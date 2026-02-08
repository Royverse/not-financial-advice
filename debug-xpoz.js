const axios = require('axios');

const ENDPOINT = 'https://mcp.xpoz.ai/mcp';
const API_KEY = 'K39MS1idPdrP6e9Ja0xjpELUdeLINdU0jOL0zd8FRvqwCHeKp9GoP7b2xP9XypQSIebuVbw';

async function mcpCall(method, params) {
    const payload = {
        jsonrpc: "2.0",
        method: method,
        id: 1,
        params: params
    };

    const response = await axios.post(ENDPOINT, payload, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
            'Accept': 'application/json, text/event-stream'
        }
    });

    const lines = response.data.split('\n');
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const data = JSON.parse(line.substring(6));
            if (data.result && data.result.content && data.result.content[0].text) {
                return data.result.content[0].text;
            }
        }
    }
    return null;
}

async function test() {
    console.log('Starting XPOZ test...');

    // Start job
    const start = await mcpCall("tools/call", {
        name: "getTwitterPostsByKeywords",
        arguments: { query: "AAPL", limit: 5 }
    });

    console.log('Start response:', start.substring(0, 300));

    const match = start.match(/operationId\s*[:=]\s*"?([a-zA-Z0-9_]+)"?/);
    if (!match) {
        console.log('No op ID');
        return;
    }

    const opId = match[1];
    console.log('Operation ID:', opId);

    // Poll
    for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 3000));
        console.log(`Poll ${i + 1}...`);

        const result = await mcpCall("tools/call", {
            name: "checkOperationStatus",
            arguments: { operationId: opId }
        });

        if (result && result.includes('success: true')) {
            console.log('=== FULL RESPONSE ===');
            console.log(result);
            console.log('=== END ===');

            // Try to extract tweets
            const textMatch = result.match(/text:\s*"([^"]+)"/g);
            if (textMatch) {
                console.log('\n=== EXTRACTED TWEETS ===');
                textMatch.slice(0, 5).forEach((t, i) => {
                    console.log(`${i + 1}. ${t}`);
                });
            }
            break;
        }
    }
}

test().catch(console.error);
