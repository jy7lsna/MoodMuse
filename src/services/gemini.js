import { GoogleGenAI } from '@google/genai';

export const generatePlaylistNames = async (tracks, mode, irony, drama, caps) => {
    const apiKey = import.meta.env.VITE_LLM_API_KEY;

    if (!apiKey) {
        console.warn('Gemini API Key missing in .env.local');
        return [];
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        const trackNames = tracks.slice(0, 10).map(t => `${t.name} by ${t.artist}`).join('\n');

        const prompt = `
You are a hyperspecific, chronically online, culturally aware Gen-Z music curator.
Your job is to generate exactly 5 unique, highly specific, and iconic playlist names based on the following context.

DO NOT generate single-word names.
DO NOT generate generic names (like "Chill Vibes" or "Workout Hits").
Generate names that feel narrative, self-aware, and internet-fluent.

Context Mode: "${mode}"
Irony Level (0-100): ${irony} (Higher means more sarcastic, use "(real)" or "(delusional)" or similar internet phrasing)
Drama Level (0-100): ${drama} (Higher means more cinematic, dramatic, or unhinged vocabulary)
Capitalization Preference: "${caps}" (Strictly follow this formatting: all lowercase, Sentence case, or cHAoTiC cAps)

Here are some of the songs in the playlist to inspire the exact cultural niche:
${trackNames}

Return ONLY a valid JSON array of strings containing EXACTLY 5 strings. No markdown formatting, no comments, just the raw JSON array. Ex: ["name 1", "name 2"]
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                // Try to enforce JSON output structure
                responseMimeType: "application/json",
            }
        });

        const textResponse = response.text;
        const parsed = JSON.parse(textResponse);

        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
        } else {
            throw new Error("Invalid format returned");
        }

    } catch (error) {
        console.error("Gemini Naming error", error);
        return [];
    }
}
