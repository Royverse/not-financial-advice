
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const XPOZ_API_KEY = process.env.XPOZ_API_KEY;
const XPOZ_ENDPOINT = 'https://mcp.xpoz.ai/mcp';

async function testXpoz() {
    console.log('Testing Xpoz API...');
    console.log('API Key:', XPOZ_API_KEY ? `${XPOZ_API_KEY.substring(0, 5)}...` : 'MISSING');

    if (!XPOZ_API_KEY) {
        console.error('XPOZ_API_KEY is not set in .env.local');
        return;
    }

    const payload = {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 1,
        params: {
            name: 'getTwitterPostsByKeywords',
            arguments: { query: 'AAPL', limit: 5 },
        }
    };

    try {
        const response = await axios.post(XPOZ_ENDPOINT, payload, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${XPOZ_API_KEY}`,
                Accept: 'application/json, text/event-stream',
            },
            timeout: 10000,
        });

        console.log('Status:', response.status);
        console.log('Response Headers:', response.headers);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
    } catch (err) {
        if (err.response) {
            console.error('HTTP Error:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error('Error:', err.message);
        }
    }
}

testXpoz();
