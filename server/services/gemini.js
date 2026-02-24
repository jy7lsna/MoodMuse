const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

if (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);
}

/**
 * Generates dynamic playlist names using Gemini AI and the computed audio feature vector.
 */
async function generateNamesFromVector(playlistName, trackCount, aggregateVector, vibeLabel) {
    if (!genAI) throw new Error("Missing Gemini API Key in backend config");

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: "You are a Gen-Z music culture expert. You create highly creative, non-generic playlist names."
    });

    const prompt = `
I have a Spotify playlist currently named "${playlistName}" with ${trackCount} tracks.
I just mathematically analyzed the audio features of every track, and here are the results:
- Average Tempo: ${Math.round(aggregateVector.avgTempo)} BPM
- Average Energy: ${aggregateVector.avgEnergy.toFixed(2)} (0 is low, 1 is high)
- Average Valence (Happiness): ${aggregateVector.avgValence.toFixed(2)} (0 is sad, 1 is happy)
- Average Danceability: ${aggregateVector.avgDanceability.toFixed(2)}
- Autodetected Deterministic Vibe Cluster: "${vibeLabel}"

Based ONLY on this strict mathematical profile and the vibe cluster, generate exactly 5 culturally intelligent, Gen-Z coded playlist names.
Do NOT just repeat the original name.
Make them at least 3-4 words.
Provide a mix of lowercase, aesthetic, and bold styles.

Return ONLY a valid JSON array of strings. No markdown formatting, no explanations. Just the JSON array.`;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text();

        // Strip backticks if present (markdown formatting)
        if (text.startsWith('\`\`\`json')) {
            text = text.replace(/^\`\`\`json\\n/, '').replace(/\\n\`\`\`$/, '');
        } else if (text.startsWith('\`\`\`')) {
            text = text.replace(/^\`\`\`\\n/, '').replace(/\\n\`\`\`$/, '');
        }

        return JSON.parse(text);

    } catch (error) {
        console.error("Gemini Generation Error:", error);
        throw new Error("Failed to generate names with Gemini");
    }
}

module.exports = {
    generateNamesFromVector
};
