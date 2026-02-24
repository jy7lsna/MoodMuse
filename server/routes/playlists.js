const express = require('express');
const axios = require('axios');
const router = express.Router();
const Redis = require('ioredis');
const { PrismaClient } = require('@prisma/client');
const { analyzePlaylist } = require('../services/analyzer');
const { generateNamesFromVector } = require('../services/gemini');

const prisma = new PrismaClient();
const redis = new Redis();

// Middleware to get access token from session
const requireAuth = async (req, res, next) => {
    const sessionId = req.cookies.moodmuse_session;
    if (!sessionId) return res.status(401).json({ error: 'Unauthorized' });

    const accessToken = await redis.get(`session:${sessionId}:access_token`);
    if (!accessToken) return res.status(401).json({ error: 'Token expired' });

    req.accessToken = accessToken;
    next();
};

// 1. Get User's Playlists
router.get('/', requireAuth, async (req, res) => {
    try {
        const response = await axios.get('https://api.spotify.com/v1/me/playlists?limit=50', {
            headers: { 'Authorization': `Bearer ${req.accessToken}` }
        });

        // Filter out playlists the user does not own or cannot modify
        const myProfileResponse = await axios.get('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': `Bearer ${req.accessToken}` }
        });
        const myId = myProfileResponse.data.id;

        const playlists = response.data.items
            .filter(p => p.owner.id === myId || p.collaborative)
            .map(p => ({
                id: p.id,
                name: p.name,
                image: p.images?.[0]?.url || null,
                totalTracks: p.tracks?.total || 0,
                url: p.external_urls?.spotify
            }));

        res.json(playlists);
    } catch (e) {
        console.error(e.response?.data || e.message);
        res.status(500).json({ error: 'Failed to fetch playlists' });
    }
});

// 2. Analyze Playlist & Generate Names
router.post('/:id/analyze', requireAuth, async (req, res) => {
    const playlistId = req.params.id;
    try {
        console.log(`Analyzing playlist ${playlistId}`);
        const analysis = await analyzePlaylist(playlistId, req.accessToken);

        console.log(`Generating names for vibe: ${analysis.vibeLabel}`);
        const generatedNames = await generateNamesFromVector(
            analysis.playlistInfo.name,
            analysis.playlistInfo.totalTracks,
            analysis.aggregateVector,
            analysis.vibeLabel
        );

        // Store analysis in database
        const savedAnalysis = await prisma.playlistAnalysis.create({
            data: {
                playlist_id: playlistId,
                aggregate_vector: JSON.stringify(analysis.aggregateVector),
                vibe_label: analysis.vibeLabel,
                generated_names: JSON.stringify(generatedNames)
            }
        });

        res.json({
            playlistInfo: analysis.playlistInfo,
            aggregateVector: analysis.aggregateVector,
            vibeLabel: analysis.vibeLabel,
            generatedNames
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to analyze and generate names' });
    }
});

// 3. Rename Playlist (Write-back to Spotify)
router.put('/:id/rename', requireAuth, async (req, res) => {
    const playlistId = req.params.id;
    const { newName } = req.body;

    if (!newName) return res.status(400).json({ error: 'newName is required' });

    try {
        await axios.put(`https://api.spotify.com/v1/playlists/${playlistId}`, {
            name: newName,
            description: `Curated mathematically by Mood Muse. Vibe detected: ${req.body.vibeLabel || "Unknown"}`
        }, {
            headers: {
                'Authorization': `Bearer ${req.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ success: true, message: 'Playlist renamed on Spotify!' });
    } catch (e) {
        console.error(e.response?.data || e.message);
        res.status(500).json({ error: 'Failed to rename playlist' });
    }
});

module.exports = router;
