
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const XPOZ_API_KEY = process.env.XPOZ_API_KEY;
const XPOZ_ENDPOINT = 'https://mcp.xpoz.ai/mcp';

async function listTools() {
    console.log(`Listing Xpoz Tools...`);

    const payload = {
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
        params: {}
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

        console.log('Response Data:', JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

listTools();
