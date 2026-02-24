import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

async function run() {
    try {
        const { data: { access_token } } = await axios.post('https://accounts.spotify.com/api/token', 'grant_type=client_credentials', {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(process.env.VITE_SPOTIFY_CLIENT_ID + ':' + process.env.VITE_SPOTIFY_CLIENT_SECRET).toString('base64')
            }
        });

        console.log('Token fetched');

        const res = await axios.get(`https://api.spotify.com/v1/search?q=artist:Rick%20Astley&type=track&limit=24`, {
            headers: { 'Authorization': 'Bearer ' + access_token }
        });
        console.log('Valid search res limit 24:', res.data.tracks.items.length);
    } catch (e) {
        console.error('Error:', e.response?.data || e.message);
    }
}
run();
