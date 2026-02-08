require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const models = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-1.5-pro-latest',
    'gemini-pro',
    'gemini-2.0-flash',
    'gemini-2.0-flash-exp',
    'gemini-1.0-pro'
];

async function testModel(modelName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const res = await axios.post(url, {
            contents: [{ parts: [{ text: "Say 'Hello' in one word" }] }]
        }, { timeout: 10000 });

        const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
        console.log(`✅ ${modelName}: WORKS! Response: "${text.trim().substring(0, 30)}..."`);
        return { model: modelName, status: 'success', response: text.trim() };
    } catch (e) {
        const errorMsg = e.response?.data?.error?.message || e.message;
        console.log(`❌ ${modelName}: FAILED - ${errorMsg.substring(0, 60)}`);
        return { model: modelName, status: 'failed', error: errorMsg };
    }
}

async function main() {
    console.log('Testing Gemini API Models...');
    console.log('API Key:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 8)}...` : 'MISSING');
    console.log('---');

    const results = [];
    for (const model of models) {
        const result = await testModel(model);
        results.push(result);
    }

    console.log('\n--- SUMMARY ---');
    const working = results.filter(r => r.status === 'success');
    if (working.length > 0) {
        console.log('Working models:', working.map(r => r.model).join(', '));
        console.log('\nRecommended: Use', working[0].model);
    } else {
        console.log('No working models found. Check your API key.');
    }
}

main();
