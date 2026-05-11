import axios from 'axios';

// Priority list as requested
const MODEL_PRIORITY = [
    'gemini-flash-latest',       // 1. Primary
    'gemini-flash-lite-latest',  // 2. Secondary
    'gemini-pro-latest',         // 3. Tertiary
    'gemini-2.0-flash',          // 4. Fallback
    'gemma-4-26b-a4b-it'         // 5. Ultimate Safety Net
];

export class GeminiService {
    static async generateContent(prompt: string): Promise<{ text: string; model: string }> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not defined');
        }

        let lastError = null;
        const globalStart = Date.now();
        const TIME_LIMIT = 8500; // 8.5 seconds limit to avoid Netlify 10s timeout (504)

        for (const model of MODEL_PRIORITY) {
            const timeRemaining = TIME_LIMIT - (Date.now() - globalStart);
            if (timeRemaining <= 500) {
                console.warn(`[GeminiService] Global time limit reached. Aborting further model attempts.`);
                lastError = lastError || new Error('Request took too long, aborting to prevent 504 timeout.');
                break;
            }

            try {
                console.log(`[GeminiService] Attempting model: ${model} with ${timeRemaining}ms remaining...`);
                const response = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    {
                        contents: [{ parts: [{ text: prompt }] }]
                    },
                    {
                        timeout: timeRemaining, 
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.data && response.data.candidates && response.data.candidates.length > 0) {
                    const text = response.data.candidates[0].content.parts[0].text;
                    console.log(`[GeminiService] ✅ Success with ${model}`);
                    return { text, model };
                } else {
                    console.warn(`[GeminiService] ⚠️ ${model} returned no candidates.`);
                }

            } catch (error: any) {
                const msg = error.response?.data?.error?.message || error.message;
                const status = error.response?.status;

                console.warn(`[GeminiService] ❌ Failed with ${model}: ${status} - ${msg.substring(0, 100)}`);
                lastError = error;
                
                // If the API key is completely invalid, don't bother trying the other models
                if (status === 400 && msg.includes('API key not valid')) {
                    throw new Error('GEMINI_API_KEY is invalid.');
                }
            }
        }

        const finalMsg = lastError?.response?.data?.error?.message || lastError?.message || 'Unknown error';
        throw new Error(`All Gemini models failed or timed out. Last error: ${finalMsg}`);
    }
}
