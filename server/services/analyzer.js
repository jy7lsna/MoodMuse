const axios = require('axios');

/**
 * Fetches all tracks for a given playlist and extracts their IDs.
 * Then fetches audio features for all tracks in batches of 100.
 * Computes an aggregate acoustic vector with extended features.
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

        // 3. Compute Extended Averages
        let totals = {
            tempo: 0, energy: 0, valence: 0, danceability: 0,
            acousticness: 0, instrumentalness: 0, speechiness: 0, loudness: 0
        };

        audioFeatures.forEach(f => {
            totals.tempo += f.tempo;
            totals.energy += f.energy;
            totals.valence += f.valence;
            totals.danceability += f.danceability;
            totals.acousticness += f.acousticness;
            totals.instrumentalness += f.instrumentalness;
            totals.speechiness += f.speechiness;
            totals.loudness += f.loudness;
        });

        const count = audioFeatures.length;
        const aggregateVector = {
            avgTempo: totals.tempo / count,
            avgEnergy: totals.energy / count,
            avgValence: totals.valence / count,
            avgDanceability: totals.danceability / count,
            avgAcousticness: totals.acousticness / count,
            avgInstrumentalness: totals.instrumentalness / count,
            avgSpeechiness: totals.speechiness / count,
            avgLoudness: totals.loudness / count,
            trackCount: count
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
 * Enhanced rule-based classification based on musical features.
 */
function classifyVibe(vector) {
    const { avgTempo, avgEnergy, avgValence, avgDanceability, avgAcousticness, avgSpeechiness } = vector;

    // High energy + happy = workout / hype
    if (avgEnergy > 0.8 && avgValence > 0.6) return "Rage Gym / Main Character Energy";

    // High energy + angry/sad = villain energy
    if (avgEnergy > 0.6 && avgValence < 0.4) return "Villain Arc / Dark Moody";

    // Club vibes
    if (avgDanceability > 0.7 && avgTempo > 110) return "Club Basement / High Danceability";

    // Low energy + sad = late night / sad
    if (avgEnergy < 0.4 && avgValence < 0.4) return "Late Night / Sad Autumn";

    // Acoustic + low energy = chill
    if (avgAcousticness > 0.6 && avgEnergy < 0.5) return "Acoustic Cottagecore / Lo-Fi Study";

    // Soft vibes
    if (avgEnergy < 0.5 && avgValence > 0.6) return "Soft Girl / Relaxed Sunday";

    // Podcast / spoken word detection
    if (avgSpeechiness > 0.6) return "Podcast Brain / Spoken Word";

    // High tempo + moderate energy = driving music
    if (avgTempo > 130 && avgEnergy > 0.5) return "Night Drive Cinematic / Road Trip";

    // Danceable + happy = party
    if (avgDanceability > 0.65 && avgValence > 0.6) return "Hot Girl Summer / Party Mode";

    return "Neutral Vibes / Chill Blend";
}

module.exports = {
    analyzePlaylist,
    classifyVibe
};
