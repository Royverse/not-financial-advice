
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const XPOZ_API_KEY = process.env.XPOZ_API_KEY;
const XPOZ_ENDPOINT = 'https://mcp.xpoz.ai/mcp';

async function testXpozRaw() {
    console.log(`Testing Xpoz API raw...`);

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
                Accept: 'application/json, text/event-stream',
            },
            timeout: 15000,
        });

        console.log('--- RAW RESPONSE ---');
        console.log(response.data);
        console.log('--- END RAW RESPONSE ---');

    } catch (err) {
        console.error('Error:', err.message);
    }
}

testXpozRaw();
