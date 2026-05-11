
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const XPOZ_API_KEY = process.env.XPOZ_API_KEY;
const XPOZ_ENDPOINT = 'https://mcp.xpoz.ai/mcp';

async function testXpozStreaming() {
    console.log(`Testing Xpoz API with streaming...`);
    const startTime = Date.now();

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
            responseType: 'stream',
            timeout: 15000,
        });

        console.log('Got headers in', Date.now() - startTime, 'ms');
        
        let fullData = '';
        response.data.on('data', (chunk) => {
            const str = chunk.toString();
            fullData += str;
            console.log('Received chunk at', Date.now() - startTime, 'ms:', str.substring(0, 50));
            
            // If we see the results or status: success, we could potentially stop here
            if (fullData.includes('status: success') || fullData.includes('operationId')) {
                console.log('Detected completion signal at', Date.now() - startTime, 'ms');
                // In a real function we would resolve here
            }
        });

        response.data.on('end', () => {
            console.log('Stream ended in', Date.now() - startTime, 'ms');
        });

    } catch (err) {
        console.error('Error:', err.message);
    }
}

testXpozStreaming();
