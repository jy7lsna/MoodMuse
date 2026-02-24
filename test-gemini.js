import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const ai = new GoogleGenAI({ apiKey: process.env.VITE_LLM_API_KEY });

async function run() {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'List the names of the tracks found on this public Spotify playlist: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        fs.writeFileSync('test-out-gemini.txt', response.text);
    } catch (e) {
        fs.writeFileSync('test-out-gemini.txt', e.toString());
    }
}
run();
