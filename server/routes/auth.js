const express = require('express');
const axios = require('axios');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uid');
const Redis = require('ioredis');

const prisma = new PrismaClient();
const redis = new Redis();

const SPOTIFY_CLIENT_ID = process.env.VITE_SPOTIFY_CLIENT_ID || process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.VITE_SPOTIFY_CLIENT_SECRET || process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/api/auth/callback'; // Backend callback
const SCOPES = ['playlist-read-private', 'playlist-read-collaborative', 'playlist-modify-public', 'playlist-modify-private', 'user-read-private'];

// 1. Generate Login URL
router.get('/login', (req, res) => {
    // Generate random state for CSRF protection
    const state = uuidv4();

    // In production, store state in redis or a signed cookie to verify it later
    res.cookie('spotify_auth_state', state, { httpOnly: true, secure: false, maxAge: 1000 * 60 * 15 });

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: SPOTIFY_CLIENT_ID,
        scope: SCOPES.join(' '),
        redirect_uri: REDIRECT_URI,
        state: state,
        show_dialog: 'true'
    });

    res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

// 2. Handle Callback
router.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies.spotify_auth_state : null;

    if (state === null || state !== storedState) {
        return res.redirect('http://localhost:5173/?error=state_mismatch');
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
            update: { encrypted_refresh_token: refresh_token }, // In prod, actually encrypt this
            create: {
                spotify_user_id: spotifyUserId,
                encrypted_refresh_token: refresh_token
            }
        });

        // Create a session ID
        const sessionId = uuidv4();

        // Store access token in redis
        await redis.set(`session:${sessionId}:access_token`, access_token, 'EX', expires_in);
        await redis.set(`session:${sessionId}:user_id`, user.id, 'EX', 60 * 60 * 24 * 7); // 7 days

        // Send session cookie to frontend
        res.cookie('moodmuse_session', sessionId, {
            httpOnly: true,
            secure: false, // Must be true in prod behind HTTPS
            maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        });

        // Redirect back to frontend
        res.redirect('http://localhost:5173/profile');

    } catch (error) {
        console.error('Error during token exchange:', error.response?.data || error.message);
        res.redirect('http://localhost:5173/?error=invalid_token');
    }
});

// 3. User Info & Session Check
router.get('/me', async (req, res) => {
    const sessionId = req.cookies.moodmuse_session;
    if (!sessionId) return res.status(401).json({ error: 'Not authenticated' });

    const accessToken = await redis.get(`session:${sessionId}:access_token`);
    if (!accessToken) {
        // TODO: Implement refresh logic here
        return res.status(401).json({ error: 'Token expired' });
    }

    try {
        const userProfileResponse = await axios.get('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        res.json(userProfileResponse.data);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

module.exports = router;
