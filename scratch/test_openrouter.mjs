import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'sk-or-v1-...';

async function testOpenRouter() {
    console.log("=== TESTING OPENROUTER API ===");
    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'deepseek/deepseek-r1', // Paid model to test if key has credits
                messages: [
                    { role: 'user', content: 'Return exactly this JSON string: {"status": "ok", "openrouter": true}' }
                ],
                response_format: { type: 'json_object' }
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'http://localhost:3000', // Optional but recommended
                    'X-Title': 'Stock Tracker',
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log("✅ SUCCESS!");
        console.log("Status Code:", response.status);
        console.log("Model Used:", response.data.model);
        console.log("Response:", response.data.choices[0].message.content);
        
    } catch (error) {
        console.log("❌ FAILED!");
        console.log("Status Code:", error.response?.status);
        console.log("Error Details:", error.response?.data?.error || error.message);
    }
}

testOpenRouter();
