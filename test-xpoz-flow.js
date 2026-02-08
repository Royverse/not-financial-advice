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

    // Simple SSE parser
    const lines = response.data.split('\n');
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            return JSON.parse(line.substring(6));
        }
    }
    return null;
}

async function testFlow() {
    try {
        console.log('1. Starting Search...');
        const startRes = await mcpCall("tools/call", {
            name: "getTwitterPostsByKeywords",
            arguments: { query: "IBM", limit: 5 }
        });

        const content = startRes.result.content[0].text;
        console.log('Start Response:', content);

        const match = content.match(/operationId\s*[:=]\s*"?([a-zA-Z0-9_]+)"?/);
        if (!match) {
            console.log('No operation ID found!');
            return;
        }
        const opId = match[1];
        console.log(`2. Found Operation ID: ${opId}`);

        // Poll for status
        for (let i = 0; i < 5; i++) {
            console.log(`3. Checking Status (Attempt ${i + 1})...`);
            await new Promise(r => setTimeout(r, 2000)); // Wait 2s

            const checkRes = await mcpCall("tools/call", {
                name: "checkOperationStatus",
                arguments: { operationId: opId }
            });

            const checkContent = checkRes.result.content[0].text;
            console.log(`Status Response Length: ${checkContent.length}`);

            if (checkContent.includes('"status": "succeeded"') || checkContent.includes('"status": "completed"') || checkContent.includes('"tweets":')) {
                console.log('SUCCESS!');
                console.log(checkContent.substring(0, 500) + '...');
                break;
            }
        }

    } catch (error) {
        console.log('Error:', error.message);
        if (error.response) console.log(error.response.data);
    }
}

testFlow();
