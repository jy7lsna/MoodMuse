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
}).then(r => r.json()).then(async data => {
    const token = data.access_token;

    // First let's search for a random user playlist
    const searchParams = new URLSearchParams({
        q: 'my playlist',
        type: 'playlist',
        limit: 1
    });

    const searchRes = await fetch('https://api.spotify.com/v1/search?' + searchParams.toString(), {
        headers: { 'Authorization': 'Bearer ' + token }
    }).then(r => r.json());

    const playlistId = searchRes.playlists.items[0].id;
    console.log("Found Playlist:", playlistId, searchRes.playlists.items[0].name, "Owner:", searchRes.playlists.items[0].owner.id);

    // Now try to fetch its tracks
    const url = `https://api.spotify.com/v1/playlists/${playlistId}?fields=tracks(items(track(name,artists,id)))`;
    const res = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
    });

    const resData = await res.json();
    fs.writeFileSync('test-out.txt', "STATUS: " + res.status + "\nDATA: " + JSON.stringify(resData, null, 2));
})
    .catch(e => {
        fs.writeFileSync('test-out.txt', "ERR: " + e.toString());
    });
