require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Test the lighter/free-tier friendly models
const models = [
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-lite-001',
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemma-3-1b-it'
];

async function testModel(modelName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const res = await axios.post(url, {
            contents: [{ parts: [{ text: "Reply with just the word HELLO" }] }]
        }, { timeout: 15000 });

        const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log(`✅ ${modelName}: "${text.trim().substring(0, 40)}"`);
        return true;
    } catch (e) {
        const errorMsg = e.response?.data?.error?.message || e.message;
        console.log(`❌ ${modelName}: ${errorMsg.substring(0, 60)}`);
        return false;
    }
}

async function main() {
    console.log('Testing Free-Tier Friendly Models...\n');

    for (const model of models) {
        const success = await testModel(model);
        if (success) {
            console.log(`\n🎉 RECOMMENDED: Use "${model}" - it works!`);
            break;
        }
    }
}

main();
