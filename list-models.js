const axios = require('axios');

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    try {
        const response = await axios.get(url);
        console.log('Available Models:\n');
        response.data.models.forEach(m => {
            if (m.supportedGenerationMethods.includes('generateContent')) {
                console.log(`- ${m.name} (${m.displayName})`);
            }
        });
    } catch (e) {
        console.error('Error listing models:', e.message);
        if (e.response) console.error(e.response.data);
    }
}

listModels();
