require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');

const app = express();
const prisma = new PrismaClient();

// Redis: use REDIS_URL for production (Upstash), default to localhost for dev
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        return delay;
    },
    maxRetriesPerRequest: 3,
    tls: process.env.REDIS_URL ? { rejectUnauthorized: false } : undefined,
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err.message);
});

redis.on('connect', () => {
    console.log('Redis connected successfully');
});

// CORS: allow frontend origin (Vercel in production, localhost in dev)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';

app.use(express.json());
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));
app.use(cookieParser());

// Make redis available to routes
app.set('redis', redis);

// Routes
const authRoutes = require('./routes/auth');
const playlistRoutes = require('./routes/playlists');

app.use('/api/auth', authRoutes);
app.use('/api/playlists', playlistRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
