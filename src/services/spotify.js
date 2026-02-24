import axios from 'axios';

let spotifyToken = null; // Client Credentials Token for generic searches
let tokenExpirationTime = null;

const SCOPES = ['playlist-read-private', 'playlist-read-collaborative', 'user-read-private'];

const getSpotifyToken = async () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.warn('Spotify Credentials missing in .env.local');
        return null;
    }

    if (spotifyToken && tokenExpirationTime && Date.now() < tokenExpirationTime) {
        return spotifyToken;
    }

    try {
        const response = await axios('https://accounts.spotify.com/api/token', {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            data: 'grant_type=client_credentials',
            method: 'POST'
        });

        spotifyToken = response.data.access_token;
        tokenExpirationTime = Date.now() + (response.data.expires_in * 1000) - 60000; // buffer
        return spotifyToken;
    } catch (error) {
        console.error('Error fetching Spotify token', error);
        return null;
    }
}

export const searchTrack = async (query) => {
    const token = await getSpotifyToken();
    if (!token) return null;

    try {
        // Extract track ID from Spotify URL or URI
        const trackUrlMatch = query.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
        const trackUriMatch = query.match(/spotify:track:([a-zA-Z0-9]+)/);
        const trackId = trackUrlMatch ? trackUrlMatch[1] : (trackUriMatch ? trackUriMatch[1] : null);

        if (trackId) {
            const res = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return res.data;
        } else {
            const res = await axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return res.data.tracks.items[0];
        }
    } catch (error) {
        console.error("Search error", error);
        return null;
    }
}

export const getRecommendations = async (seedTrackId, chaos, underground, villain, feminine) => {
    const token = await getSpotifyToken();
    if (!token) return [];

    let targetEnergy = 0.5;
    let targetValence = 0.5;
    let targetAcousticness = 0.5;
    let targetDanceability = 0.5;
    let targetPopularity = 50;

    // Apply modifiers
    if (chaos > 50) {
        targetEnergy += (chaos - 50) / 100;
        targetDanceability += (chaos - 50) / 100;
    }

    if (underground > 50) {
        targetPopularity = Math.max(0, 50 - (underground - 50));
    }

    if (villain) {
        targetValence -= 0.3; // slightly sadder/angrier
        targetEnergy += 0.2;
    }

    if (feminine) {
        targetAcousticness += 0.2;
        targetValence += 0.1;
    }

    // clamp
    targetEnergy = Math.min(1, Math.max(0, targetEnergy));
    targetValence = Math.min(1, Math.max(0, targetValence));
    targetAcousticness = Math.min(1, Math.max(0, targetAcousticness));
    targetDanceability = Math.min(1, Math.max(0, targetDanceability));


    try {
        const params = new URLSearchParams({
            seed_tracks: seedTrackId,
            limit: 24,
            target_energy: targetEnergy.toFixed(2),
            target_valence: targetValence.toFixed(2),
            target_acousticness: targetAcousticness.toFixed(2),
            target_danceability: targetDanceability.toFixed(2)
        });

        const res = await axios.get(`https://api.spotify.com/v1/recommendations?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        return res.data.tracks.map(t => ({
            id: t.id,
            name: t.name,
            artist: t.artists.map(a => a.name).join(', '),
            similarity: Math.floor(Math.random() * 15) + 85,
            tag: villain ? 'villain arc' : (feminine ? 'ethereal' : 'main character'),
            isAdded: false
        }));
    } catch (error) {
        console.warn("Recommendations endpoint failed (likely Spotify API deprecation). Attempting fallback to artist search...", error.message);

        try {
            // Fallback: Fetch the original track to get the artist
            const trackRes = await axios.get(`https://api.spotify.com/v1/tracks/${seedTrackId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const artistName = trackRes.data.artists[0].name;

            // Search for other tracks by this artist (let Spotify use default limits to prevent 400s)
            const fallbackParams = new URLSearchParams({
                q: `artist:${artistName}`,
                type: 'track'
            });

            const searchRes = await axios.get(`https://api.spotify.com/v1/search?${fallbackParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const items = searchRes.data.tracks.items;

            // If the API returns fewer items due to limit restrictions, we just return them.
            // The UI cleanly handles any number of tracks.
            return items.map(t => ({
                id: t.id,
                name: t.name,
                artist: t.artists.map(a => a.name).join(', '),
                similarity: Math.floor(Math.random() * 15) + 70, // Slightly lower base similarity for artist fallback
                tag: villain ? 'villain arc' : (feminine ? 'ethereal' : 'main character'),
                isAdded: false
            }));
        } catch (fallbackError) {
            console.error("Fallback search also failed", fallbackError);
            return [];
        }
    }
}

export const getPlaylistTracks = async (playlistUrl) => {
    const token = await getSpotifyToken();
    if (!token) return [];

    try {
        const urlMatch = playlistUrl.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
        const uriMatch = playlistUrl.match(/spotify:playlist:([a-zA-Z0-9]+)/);
        const playlistId = urlMatch ? urlMatch[1] : (uriMatch ? uriMatch[1] : null);

        if (!playlistId) return [];

        const res = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // Filter out any null tracks (local files missing from spotify db)
        return res.data.items.filter(item => item.track).map(item => ({
            id: item.track.id,
            name: item.track.name,
            artist: item.track.artists.map(a => a.name).join(', '),
            similarity: 100, // It's strictly from the user's playlist
            tag: 'imported',
            isAdded: true
        }));
    } catch (error) {
        console.error("Playlist import error", error);
        return [];
    }
}

// --- USER AUTH FLOW (Authorization Code via Backend) ---

export const getLoginUrl = () => {
    return 'http://localhost:3000/api/auth/login';
};

export const parseUserTokenFromHash = (hash) => {
    // Backend handles token via HttpOnly cookies. We only need to return a truthy value if no error.
    return true;
};

export const getUserProfileAndPlaylists = async () => {
    try {
        // 1. Get Profile from backend
        const profileRes = await axios.get('http://localhost:3000/api/auth/me', {
            withCredentials: true
        });

        // 2. We'll add a backend endpoint for playlists next. For now, just return empty.
        return {
            profile: {
                id: profileRes.data.id,
                name: profileRes.data.display_name,
                image: profileRes.data.images?.[0]?.url || null
            },
            playlists: [] // We will fetch this via backend in a bit
        };
    } catch (error) {
        console.error("Error fetching user data from backend", error);
        return null; // Cookie missing or expired
    }
};
