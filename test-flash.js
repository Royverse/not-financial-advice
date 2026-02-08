const axios = require('axios');

const API_KEY = process.env.GEMINI_API_KEY;

async function test(modelName) {
    console.log(`Testing ${modelName}...`);
    // Note: The API expects the model name, e.g., 'gemini-flash-latest'
    // If the resource name is 'models/foo', we usually just pass 'foo' or 'models/foo'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Hi" }] }]
        });
        console.log(`✅ ${modelName}: Success`);
        return true;
    } catch (e) {
        console.log(`❌ ${modelName}: ${e.response?.data?.error?.message || e.message}`);
        return false;
    }
}

async function run() {
    await test('gemini-flash-latest');
    await test('gemini-1.5-flash'); // Just to be sure
    await test('gemini-2.0-flash-lite-preview-02-05');
}

run();
