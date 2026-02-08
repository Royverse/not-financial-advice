const axios = require('axios');

const API_KEY = 'K39MS1idPdrP6e9Ja0xjpELUdeLINdU0jOL0zd8FRvqwCHeKp9GoP7b2xP9XypQSIebuVbw';
// Guessing endpoints based on common patterns
const ENDPOINTS = [
    'https://api.xpoz.ai/v1/search',
    'https://xpoz.ai/api/v1/search',
    'https://api.xpoz.ai/search',
    'https://xpoz.ai/api/search'
];

async function testXpoz() {
    for (const url of ENDPOINTS) {
        try {
            console.log(`Testing ${url}...`);
            const response = await axios.get(url, {
                params: { query: 'AAPL', q: 'AAPL' },
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'X-API-Key': API_KEY
                },
                timeout: 5000
            });
            console.log(`SUCCESS: ${url}`);
            console.log('Data:', response.data);
            return;
        } catch (error) {
            console.log(`Failed ${url}: ${error.response ? error.response.status : error.message}`);
        }
    }
}

testXpoz();
