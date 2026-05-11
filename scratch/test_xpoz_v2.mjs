
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const XPOZ_API_KEY = process.env.XPOZ_API_KEY;
const XPOZ_ENDPOINT = 'https://mcp.xpoz.ai/mcp';

async function testXpoz(accept) {
    console.log(`Testing Xpoz API with Accept: ${accept}...`);

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
                Accept: accept,
            },
            timeout: 15000,
        });

        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers['content-type']);
        console.log('Response Data:', typeof response.data === 'string' ? response.data.substring(0, 200) : JSON.stringify(response.data, null, 2).substring(0, 200));
    } catch (err) {
        if (err.response) {
            console.error('HTTP Error:', err.response.status);
            console.error('Data:', err.response.data);
        } else {
            console.error('Error:', err.message);
        }
    }
}

async function runTests() {
    await testXpoz('application/json');
    console.log('---');
    await testXpoz('text/event-stream');
}

runTests();
