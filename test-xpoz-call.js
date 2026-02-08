const axios = require('axios');

const ENDPOINT = 'https://mcp.xpoz.ai/mcp';
const API_KEY = 'K39MS1idPdrP6e9Ja0xjpELUdeLINdU0jOL0zd8FRvqwCHeKp9GoP7b2xP9XypQSIebuVbw';

async function callTool() {
    const payload = {
        jsonrpc: "2.0",
        method: "tools/call",
        id: 1,
        params: {
            name: "getTwitterPostsByKeywords",
            arguments: {
                query: "IBM",
                limit: 5
            }
        }
    };

    try {
        const response = await axios.post(ENDPOINT, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json, text/event-stream'
            }
        });

        // Parse SSE
        const lines = response.data.split('\n');
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = JSON.parse(line.substring(6));
                if (data.result && data.result.content && data.result.content[0].text) {
                    console.log('Result:', data.result.content[0].text.substring(0, 500) + '...');
                } else {
                    console.log('Raw Result:', JSON.stringify(data, null, 2));
                }
            }
        }
    } catch (error) {
        console.log('Error:', error.message);
        if (error.response) console.log(JSON.stringify(error.response.data));
    }
}

callTool();
