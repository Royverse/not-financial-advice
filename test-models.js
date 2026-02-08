const axios = require('axios');

const API_KEY = process.env.GEMINI_API_KEY;
const MODELS = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-2.0-flash-exp'
];

async function testModel(model) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
    try {
        const start = Date.now();
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Say 'Success' if you can hear me." }] }]
        });
        const duration = Date.now() - start;
        console.log(`✅ [${model}] Success in ${duration}ms: "${response.data.candidates[0].content.parts[0].text.trim()}"`);
        return true;
    } catch (e) {
        console.log(`❌ [${model}] Failed: ${e.response?.data?.error?.message || e.message}`);
        return false;
    }
}

async function runTests() {
    console.log('Testing Gemini Models availability...\n');
    for (const model of MODELS) {
        await testModel(model);
    }
}

runTests();
