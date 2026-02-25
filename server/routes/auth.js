const express = require('express');
const axios = require('axios');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { uid } = require('uid');
const Redis = require('ioredis');

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    tls: process.env.REDIS_URL ? { rejectUnauthorized: false } : undefined,
});

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3000';
const REDIRECT_URI = `${BACKEND_URL}/api/auth/callback`;

const SCOPES = ['playlist-read-private', 'playlist-read-collaborative', 'playlist-modify-public', 'playlist-modify-private', 'user-read-private'];

// 1. Generate Login URL
router.get('/login', (req, res) => {
    const state = uid();

    res.cookie('spotify_auth_state', state, {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: IS_PRODUCTION ? 'none' : 'lax',
        maxAge: 1000 * 60 * 15
    });

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: SPOTIFY_CLIENT_ID,
        scope: SCOPES.join(' '),
        redirect_uri: REDIRECT_URI,
        state: state,
        show_dialog: 'true'
    });

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    console.log('Redirecting to Spotify with:');
    console.log('  Redirect URI:', REDIRECT_URI);
    res.redirect(authUrl);
});

// 2. Handle Callback
router.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies.spotify_auth_state : null;

    if (state === null || state !== storedState) {
        return res.redirect(`${FRONTEND_URL}/?error=state_mismatch`);
    }

    res.clearCookie('spotify_auth_state');

    try {
        const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
            code: code,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code'
        }).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
            }
        });

        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        // Fetch user profile to get spotify_user_id
        const userProfileResponse = await axios.get('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        const spotifyUserId = userProfileResponse.data.id;

        // Upsert user in db
        const user = await prisma.user.upsert({
            where: { spotify_user_id: spotifyUserId },
            update: { encrypted_refresh_token: refresh_token },
            create: {
                spotify_user_id: spotifyUserId,
                encrypted_refresh_token: refresh_token
            }
        });

        // Create a session ID
        const sessionId = uid();

        // Store tokens in Redis
        await redis.set(`session:${sessionId}:access_token`, access_token, 'EX', expires_in);
        await redis.set(`session:${sessionId}:user_id`, user.id, 'EX', 60 * 60 * 24 * 7);
        await redis.set(`session:${sessionId}:refresh_token`, refresh_token, 'EX', 60 * 60 * 24 * 7);

        // Send session cookie to frontend
        res.cookie('moodmuse_session', sessionId, {
            httpOnly: true,
            secure: IS_PRODUCTION,
            sameSite: IS_PRODUCTION ? 'none' : 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 7
        });

        res.redirect(`${FRONTEND_URL}/profile`);

    } catch (error) {
        console.error('Error during token exchange:', error.response?.data || error.message);
        res.redirect(`${FRONTEND_URL}/?error=invalid_token`);
    }
});

// --- Token Refresh Helper ---
async function refreshAccessToken(sessionId) {
    const refreshToken = await redis.get(`session:${sessionId}:refresh_token`);
    if (!refreshToken) return null;

    try {
        const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        }).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
            }
        });

        const { access_token, expires_in, refresh_token: newRefreshToken } = tokenResponse.data;

        // Update Redis with fresh tokens
        await redis.set(`session:${sessionId}:access_token`, access_token, 'EX', expires_in);
        if (newRefreshToken) {
            await redis.set(`session:${sessionId}:refresh_token`, newRefreshToken, 'EX', 60 * 60 * 24 * 7);
        }

        console.log('Token refreshed successfully for session:', sessionId);
        return access_token;
    } catch (error) {
        console.error('Token refresh failed:', error.response?.data || error.message);
        return null;
    }
}

// 3. User Info & Session Check (with auto-refresh)
router.get('/me', async (req, res) => {
    const sessionId = req.cookies.moodmuse_session;
    if (!sessionId) return res.status(401).json({ error: 'Not authenticated' });

    let accessToken = await redis.get(`session:${sessionId}:access_token`);

    // If token expired, try refresh
    if (!accessToken) {
        accessToken = await refreshAccessToken(sessionId);
        if (!accessToken) {
            return res.status(401).json({ error: 'Token expired and refresh failed. Please log in again.' });
        }
    }

    try {
        const userProfileResponse = await axios.get('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        res.json(userProfileResponse.data);
    } catch (e) {
        // If the API call fails with 401, try refreshing once more
        if (e.response?.status === 401) {
            accessToken = await refreshAccessToken(sessionId);
            if (accessToken) {
                try {
                    const retryResponse = await axios.get('https://api.spotify.com/v1/me', {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                    return res.json(retryResponse.data);
                } catch (retryErr) {
                    return res.status(401).json({ error: 'Session expired' });
                }
            }
        }
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// 4. Logout
router.post('/logout', async (req, res) => {
    const sessionId = req.cookies.moodmuse_session;

    if (sessionId) {
        // Clean up Redis
        await redis.del(`session:${sessionId}:access_token`);
        await redis.del(`session:${sessionId}:user_id`);
        await redis.del(`session:${sessionId}:refresh_token`);
    }

    res.clearCookie('moodmuse_session');
    res.json({ success: true, message: 'Logged out successfully' });
});

// Export the refresh function so playlists route can use it
module.exports = router;
module.exports.refreshAccessToken = refreshAccessToken;
