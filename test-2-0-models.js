const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const models = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-lite-preview',
    'gemini-2.0-flash-lite-preview-02-05',
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash-thinking-exp-01-21',
    'gemini-2.0-pro-exp-02-05',
    'gemini-2.0-flash-001',
    // Retry 2.5 just in case
    'gemini-2.5-flash-lite-preview-09-2025'
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
    console.log('--- Testing Gemini 2.0 / Lite Variations ---');
    for (const m of models) {
        await testModel(m);
    }
})();
