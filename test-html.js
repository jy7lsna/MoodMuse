import fs from 'fs';

fetch('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M')
    .then(res => res.text())
    .then(text => {
        fs.writeFileSync('test-out-html.html', text);
        console.log("Saved length:", text.length);
    })
    .catch(e => console.error(e));
