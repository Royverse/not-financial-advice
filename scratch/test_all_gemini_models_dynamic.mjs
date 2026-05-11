import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ ERROR: GEMINI_API_KEY is not defined in .env.local");
    process.exit(1);
}

const prompt = `Return exactly this JSON string, nothing else: {"status": "ok", "model_test": true}`;

async function testAllAvailableModels() {
    console.log("=== FETCHING ALL AVAILABLE MODELS ===");
    let availableModels = [];
    
    try {
        const listResponse = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        
        // Filter out models that don't support generateContent (e.g. embedding models)
        availableModels = listResponse.data.models
            .filter(m => m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name.replace('models/', ''));
            
        console.log(`Found ${availableModels.length} models supporting 'generateContent'.\n`);
    } catch (e) {
        console.error("Failed to fetch model list:", e.response?.data || e.message);
        process.exit(1);
    }

    console.log("=== GEMINI API DIAGNOSTICS ===");
    console.log(`Testing all ${availableModels.length} models simultaneously...\n`);

    const results = await Promise.allSettled(availableModels.map(async (model) => {
        const start = Date.now();
        try {
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    contents: [{ parts: [{ text: prompt }] }]
                },
                {
                    timeout: 30000,
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            const duration = Date.now() - start;
            
            if (response.data && response.data.candidates && response.data.candidates.length > 0) {
                const text = response.data.candidates[0].content.parts[0].text;
                return {
                    model,
                    status: 'SUCCESS',
                    duration,
                    statusCode: response.status,
                    response: text.trim().substring(0, 100).replace(/\n/g, '') + (text.length > 100 ? '...' : '')
                };
            } else {
                return {
                    model,
                    status: 'WARNING',
                    duration,
                    statusCode: response.status,
                    error: 'Returned 200 OK but no candidates.'
                };
            }

        } catch (error) {
            const duration = Date.now() - start;
            const statusCode = error.response?.status || 'Network Error';
            const errorMsg = error.response?.data?.error?.message || error.message;
            
            return {
                model,
                status: 'FAILED',
                duration,
                statusCode,
                error: errorMsg
            };
        }
    }));

    // Output formatted results grouped by status
    const successful = [];
    const failed = [];
    
    results.forEach((result) => {
        const data = result.value || result.reason;
        if (data.status === 'SUCCESS') successful.push(data);
        else failed.push(data);
    });

    console.log(`\n--- SUCCESSFUL MODELS (${successful.length}) ---`);
    successful.forEach(data => {
        console.log(`✅ [${data.model}] (${data.duration}ms) -> ${data.response}`);
    });

    console.log(`\n--- FAILED/RATE-LIMITED MODELS (${failed.length}) ---`);
    failed.forEach(data => {
        const icon = data.status === 'WARNING' ? '⚠️' : '❌';
        let shortError = data.error.split('\n')[0];
        if (shortError.length > 80) shortError = shortError.substring(0, 80) + '...';
        console.log(`${icon} [${data.model}] (${data.statusCode}) -> ${shortError}`);
    });
}

testAllAvailableModels();
