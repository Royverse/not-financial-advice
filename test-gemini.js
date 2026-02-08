const axios = require('axios');

const payload = {
    ticker: "IBM",
    data: {
        "Meta Data": { "2. Symbol": "IBM" },
        "Time Series (Daily)": {
            "2023-10-25": { "4. close": "150.00" },
            "2023-10-24": { "4. close": "148.00" },
            "2023-10-23": { "4. close": "145.00" },
            "2023-10-21": { "4. close": "147.00" }
        }
    }
};

async function test() {
    try {
        const response = await axios.post('http://localhost:3000/api/gemini', payload);
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

test();
