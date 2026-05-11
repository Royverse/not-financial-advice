import axios from 'axios';

const GROQ_API_KEY = process.env.GROQ_API_KEY || 'gsk_...';

async function testGroq() {
    console.log("=== TESTING GROQ API ===");
    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant. Output in JSON only.' },
                    { role: 'user', content: 'Return exactly this JSON string: {"status": "ok", "groq": true}' }
                ],
                response_format: { type: 'json_object' }
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log("✅ SUCCESS!");
        console.log("Status Code:", response.status);
        console.log("Response:", response.data.choices[0].message.content);
        
    } catch (error) {
        console.log("❌ FAILED!");
        console.log("Status Code:", error.response?.status);
        console.log("Error Details:", error.response?.data?.error || error.message);
    }
}

testGroq();
