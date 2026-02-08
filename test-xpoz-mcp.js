const axios = require('axios');

const ENDPOINT = 'https://mcp.xpoz.ai/mcp';
const API_KEY = 'K39MS1idPdrP6e9Ja0xjpELUdeLINdU0jOL0zd8FRvqwCHeKp9GoP7b2xP9XypQSIebuVbw';

async function testMcp() {
    const payload = {
        jsonrpc: "2.0",
        method: "tools/list",
        id: 1,
        params: {}
    };

    try {
        console.log(`Testing ${ENDPOINT} with accept headers...`);
        const response = await axios.post(ENDPOINT, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json, text/event-stream'
            },
            timeout: 10000
        });
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('Error:', error.message);
        if (error.response) {
            console.log('Response Status:', error.response.status);
            console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testMcp();
