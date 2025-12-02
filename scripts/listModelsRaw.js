const https = require('https');
require('dotenv').config({ path: '.env.emulator' });

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.error("Error parsing JSON:", e);
            console.log("Raw output:", data);
        }
    });
}).on('error', (err) => {
    console.error("Error:", err.message);
});
