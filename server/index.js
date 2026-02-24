require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');

const app = express();
const prisma = new PrismaClient();
const redis = new Redis(); // default to localhost:6379

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(cookieParser());

// Routes will be added here
const authRoutes = require('./routes/auth');
const playlistRoutes = require('./routes/playlists');

app.use('/api/auth', authRoutes);
app.use('/api/playlists', playlistRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
