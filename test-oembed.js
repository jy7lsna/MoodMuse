import fs from 'fs';

fetch('https://open.spotify.com/oembed?url=https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M')
    .then(r => r.json())
    .then(data => {
        fs.writeFileSync('test-out-oembed.txt', JSON.stringify(data, null, 2));
    })
    .catch(e => console.error(e));
