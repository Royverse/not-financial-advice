require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
    console.log('Listing available Gemini models...');
    console.log('API Key:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 8)}...` : 'MISSING');

    try {
        const res = await axios.get(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
        );

        console.log('\nAvailable Models:');
        res.data.models.forEach(model => {
            const canGenerate = model.supportedGenerationMethods?.includes('generateContent');
            console.log(`- ${model.name} ${canGenerate ? '✅ [generateContent]' : '⚠️ [no generate]'}`);
        });

    } catch (e) {
        console.error('Failed to list models:', e.response?.data || e.message);
    }
}

listModels();
