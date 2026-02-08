const axios = require('axios');

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.0-flash';

async function test() {
    console.log(`Testing ${MODEL}...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Hello, reply with 'Confirmed'." }] }]
        });
        console.log(`✅ Success: ${response.data.candidates[0].content.parts[0].text.trim()}`);
    } catch (e) {
        console.error(`❌ Failed: ${e.message}`);
        if (e.response) console.error(JSON.stringify(e.response.data, null, 2));
    }
}

test();
