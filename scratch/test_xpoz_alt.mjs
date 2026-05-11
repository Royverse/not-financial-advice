import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const XPOZ_API_KEY = process.env.XPOZ_API_KEY;
const XPOZ_ENDPOINT = 'https://api.xpoz.ai/mcp/v1/call';

async function testXpoz() {
    console.log(`Testing Xpoz API with endpoint: ${XPOZ_ENDPOINT}...`);
    const startTime = Date.now();

    const payload = {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 1,
        params: {
            name: 'getTwitterPostsByKeywords',
            arguments: { query: 'AAPL', limit: 1 },
        }
    };

    try {
        const response = await axios.post(XPOZ_ENDPOINT, payload, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${XPOZ_API_KEY}`,
            },
            timeout: 15000,
        });

        const duration = Date.now() - startTime;
        console.log(`Status: ${response.status}, Duration: ${duration}ms`);
        console.log('Response Data:', JSON.stringify(response.data).substring(0, 200));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testXpoz();
