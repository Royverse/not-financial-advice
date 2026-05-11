
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const XPOZ_API_KEY = process.env.XPOZ_API_KEY;
const XPOZ_ENDPOINT = 'https://mcp.xpoz.ai/mcp';

async function listTools() {
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

        // The response might be SSE or JSON
        let data = response.data;
        if (typeof data === 'string') {
            for (const line of data.split('\n')) {
                if (line.startsWith('data: ')) {
                    const parsed = JSON.parse(line.slice(6));
                    data = parsed;
                    break;
                }
            }
        }

        const tools = data.result?.tools || [];
        console.log('Available Tools:');
        tools.forEach(t => console.log(`- ${t.name}: ${t.description}`));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

listTools();
