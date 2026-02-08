const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
console.log('API Key:', GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 15) + '...' : 'MISSING');

// Extended list of model name variations
const models = [
    // Latest suffix variations
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-pro-latest',
    'gemini-ultra-latest',

    // 2.0 variations
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-pro',
    'gemini-2.0-flash-thinking-exp',
    'gemini-2.0-flash-thinking-exp-01-21',

    // 1.5 variations
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-001',
    'gemini-1.5-flash-002',
    'gemini-1.5-flash-8b-latest',
    'gemini-1.5-pro-latest',

    // Legacy/experimental
    'gemini-exp-1206',
    'learnlm-1.5-pro-experimental',
    'gemma-3-27b-it',

    // v1 API (non-beta)
    'text-bison-001',
    'chat-bison-001',
];

async function testModel(model) {
    try {
        const res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: 'Say hi' }] }] },
            { timeout: 10000 }
        );
        const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'OK (no text)';
        console.log(`✅ ${model}: ${text.trim().substring(0, 40)}`);
        return true;
    } catch (e) {
        const msg = e.response?.data?.error?.message || e.message;
        const shortMsg = msg.substring(0, 50);
        if (msg.includes('quota')) {
            console.log(`⚠️  ${model}: QUOTA EXCEEDED`);
        } else if (msg.includes('not found') || msg.includes('not supported')) {
            console.log(`❌ ${model}: Not found`);
        } else {
            console.log(`❌ ${model}: ${shortMsg}`);
        }
        return false;
    }
}

(async () => {
    console.log('\n=== Testing Extended Gemini Model List ===\n');
    let working = [];
    for (const m of models) {
        const ok = await testModel(m);
        if (ok) working.push(m);
    }
    console.log('\n=== Summary ===');
    if (working.length > 0) {
        console.log('Working models:', working.join(', '));
    } else {
        console.log('No working models found.');
    }
})();
