const axios = require('axios');

/**
 * Fetches all tracks for a given playlist and extracts their IDs.
 * Then fetches audio features for all tracks in batches of 100.
 */
async function analyzePlaylist(playlistId, accessToken) {
    try {
        // 1. Fetch playlist metadata and tracks
        const playlistUrl = `https://api.spotify.com/v1/playlists/${playlistId}`;
        const playlistResponse = await axios.get(playlistUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        const trackItems = playlistResponse.data.tracks.items;
        if (!trackItems || trackItems.length === 0) {
            throw new Error("Playlist has no tracks");
        }

        const validTracks = trackItems.filter(item => item.track && item.track.id);
        const trackIds = validTracks.map(item => item.track.id);

        // 2. Fetch Audio Features in batches of 100
        const audioFeatures = [];
        for (let i = 0; i < trackIds.length; i += 100) {
            const batch = trackIds.slice(i, i + 100).join(',');
            const featuresResponse = await axios.get(`https://api.spotify.com/v1/audio-features?ids=${batch}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            audioFeatures.push(...featuresResponse.data.audio_features.filter(Boolean));
        }

        if (audioFeatures.length === 0) {
            throw new Error("Could not fetch audio features for any tracks");
        }

        // 3. Compute Averages
        let totalTempo = 0, totalEnergy = 0, totalValence = 0, totalDanceability = 0;
        audioFeatures.forEach(f => {
            totalTempo += f.tempo;
            totalEnergy += f.energy;
            totalValence += f.valence;
            totalDanceability += f.danceability;
        });

        const count = audioFeatures.length;
        const aggregateVector = {
            avgTempo: totalTempo / count,
            avgEnergy: totalEnergy / count,
            avgValence: totalValence / count,
            avgDanceability: totalDanceability / count
        };

        // 4. Deterministic Vibe Classification
        const vibeLabel = classifyVibe(aggregateVector);

        return {
            playlistInfo: {
                id: playlistResponse.data.id,
                name: playlistResponse.data.name,
                image: playlistResponse.data.images?.[0]?.url || null,
                totalTracks: trackItems.length,
            },
            aggregateVector,
            vibeLabel
        };

    } catch (error) {
        console.error("Error analyzing playlist:", error.response?.data || error.message);
        throw error;
    }
}

/**
 * Rule-based classification based on musical features.
 */
function classifyVibe(vector) {
    const { avgTempo, avgEnergy, avgValence, avgDanceability } = vector;

    if (avgEnergy > 0.8 && avgValence > 0.6) return "Rage Gym / Main Character Energy";
    if (avgEnergy < 0.4 && avgValence < 0.4) return "Late Night / Sad Autumn";
    if (avgDanceability > 0.7 && avgTempo > 110) return "Club Basement / High Danceability";
    if (avgEnergy < 0.5 && avgValence > 0.6) return "Soft Girl / Relaxed Sunday";
    if (avgEnergy > 0.6 && avgValence < 0.5) return "Villain Arc / Dark Moody";

    return "Neutral Vibes / Chill Blend";
}

module.exports = {
    analyzePlaylist,
    classifyVibe
};
