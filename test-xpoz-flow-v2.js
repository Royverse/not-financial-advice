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

    try {
        const response = await axios.post(ENDPOINT, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json, text/event-stream'
            }
        });

        // Simple SSE parser
        const lines = response.data.split('\n');
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = JSON.parse(line.substring(6));
                if (data.result && data.result.content && data.result.content[0].text) {
                    return data.result.content[0].text;
                }
                return JSON.stringify(data);
            }
        }
        return "No Data in SSE";
    } catch (e) {
        console.log('Error calling MCP:', e.message);
        return "Error";
    }
}

async function testFlow() {
    console.log('1. Starting Search...');
    const startRes = await mcpCall("tools/call", {
        name: "getTwitterPostsByKeywords",
        arguments: { query: "IBM", limit: 5 }
    });

    console.log('Start Response:', startRes);

    const match = startRes.match(/operationId\s*[:=]\s*"?([a-zA-Z0-9_]+)"?/);
    if (!match) {
        console.log('No operation ID found!');
        return;
    }
    const opId = match[1];
    console.log(`2. Found Operation ID: ${opId}`);

    // Poll for status
    for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 3000)); // Wait 3s
        console.log(`3. Checking Status (Attempt ${i + 1})...`);

        const checkRes = await mcpCall("tools/call", {
            name: "checkOperationStatus",
            arguments: { operationId: opId }
        });

        console.log(`Status Response:`, checkRes.substring(0, 500));

        if (checkRes.includes('"status": "succeeded"') || checkRes.includes('"tweets":') || checkRes.includes('"posts":')) {
            console.log('SUCCESS! Data Found.');
            break;
        }
    }
}

testFlow();
