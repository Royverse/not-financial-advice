require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

async function debugAlphaVantage() {
    console.log("Checking Alpha Vantage with API Key:", ALPHA_VANTAGE_API_KEY ? "EXISTS" : "MISSING");

    try {
        const res = await axios.get('https://www.alphavantage.co/query', {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol: 'AAPL',
                apikey: ALPHA_VANTAGE_API_KEY
            }
        });

        console.log("Response Data:", JSON.stringify(res.data, null, 2));

        if (res.data['Information']) {
            console.log("Found 'Information' key (likely rate limit or other info)");
        }
    } catch (error) {
        console.error("Fetch failed:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
}

debugAlphaVantage();
