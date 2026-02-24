import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const id = env.match(/VITE_SPOTIFY_CLIENT_ID=(.*)/)[1].trim();
const sec = env.match(/VITE_SPOTIFY_CLIENT_SECRET=(.*)/)[1].trim();

const params = new URLSearchParams({ grant_type: 'client_credentials' });

fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(id + ':' + sec).toString('base64')
    },
    body: params
}).then(r => r.json()).then(data => {
    const token = data.access_token;

    // Testing EXACTLY the URL the app is generating
    const url = 'https://api.spotify.com/v1/search?q=Rick%20Astley&type=track&limit=5';

    return fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
    });
}).then(async r => {
    const data = await r.json();
    fs.writeFileSync('test-output.txt', "STATUS: " + r.status + "\nDATA: " + JSON.stringify(data, null, 2));
})
    .catch(e => {
        fs.writeFileSync('test-output.txt', "ERR: " + e.toString());
    });
