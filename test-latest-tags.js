const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const models = [
    'gemini-flash-latest',
    'gemini-pro-latest',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
    'gemini-ultra-latest',
    // Control
    'gemma-3-27b-it'
];

async function testModel(model) {
    console.log(`Testing ${model}...`);
    try {
        const res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: 'Say hi' }] }] },
            { timeout: 10000 }
        );
        const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'OK';
        console.log(`✅ ${model}: Success! Response: ${text.trim().substring(0, 30)}...`);
        return true;
    } catch (e) {
        const errorMsg = e.response?.data?.error?.message || e.message;
        if (errorMsg.includes('quota')) {
            console.log(`⚠️ ${model}: QUOTA EXCEEDED`);
        } else if (errorMsg.includes('not found') || errorMsg.includes('not supported')) {
            console.log(`❌ ${model}: Not found`);
        } else {
            console.log(`❌ ${model}: Error - ${errorMsg.substring(0, 100)}`);
        }
        return false;
    }
}

(async () => {
    console.log('--- Testing Gemini "Latest" Tags ---');
    for (const m of models) {
        await testModel(m);
    }
})();
