const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const models = [
    'gemini-2.5-flash-preview-09-2025',
    'gemini-2.5-flash-lite-preview-09-2025',
    'gemini-1.5-flash',
    'gemini-1.5-flash-001',
    'gemini-1.5-flash-002',
    'gemini-2.0-flash-exp',
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
        console.log(`❌ ${model}: Failed. ${e.response?.data?.error?.message || e.message}`);
        return false;
    }
}

(async () => {
    for (const m of models) {
        await testModel(m);
    }
})();
