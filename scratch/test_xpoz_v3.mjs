
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const XPOZ_API_KEY = process.env.XPOZ_API_KEY;
const XPOZ_ENDPOINT = 'https://mcp.xpoz.ai/mcp';

async function testXpoz(limit) {
    console.log(`Testing Xpoz API with limit: ${limit}...`);
    const startTime = Date.now();

    const payload = {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 1,
        params: {
            name: 'getTwitterPostsByKeywords',
            arguments: { query: 'AAPL', limit },
        }
    };

    try {
        const response = await axios.post(XPOZ_ENDPOINT, payload, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${XPOZ_API_KEY}`,
                Accept: 'application/json, text/event-stream',
            },
            timeout: 45000, // 45 seconds
        });

        const duration = Date.now() - startTime;
        console.log(`Status: ${response.status}, Duration: ${duration}ms`);
        console.log('Content-Type:', response.headers['content-type']);
        console.log('Response Data (start):', typeof response.data === 'string' ? response.data.substring(0, 100) : JSON.stringify(response.data).substring(0, 100));
    } catch (err) {
        const duration = Date.now() - startTime;
        console.error(`Failed after ${duration}ms`);
        if (err.response) {
            console.error('HTTP Error:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data));
        } else {
            console.error('Error:', err.message);
        }
    }
}

async function runTests() {
    await testXpoz(1);
}

runTests();
