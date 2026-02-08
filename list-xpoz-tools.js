const axios = require('axios');

const ENDPOINT = 'https://mcp.xpoz.ai/mcp';
const API_KEY = 'K39MS1idPdrP6e9Ja0xjpELUdeLINdU0jOL0zd8FRvqwCHeKp9GoP7b2xP9XypQSIebuVbw';

async function listTools() {
    const payload = {
        jsonrpc: "2.0",
        method: "tools/list",
        id: 1,
        params: {}
    };

    try {
        const response = await axios.post(ENDPOINT, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json, text/event-stream'
            }
        });

        const tools = response.data.result.tools;
        console.log('Available Tools:');
        tools.forEach(tool => {
            console.log(`- ${tool.name}: ${tool.description.substring(0, 100)}...`);
        });
    } catch (error) {
        console.log('Error:', error.message);
    }
}

listTools();
