import axios from 'axios';

// Priority list as requested
const MODEL_PRIORITY = [
    'gemini-flash-latest',       // 1. Primary
    'gemini-flash-lite-latest',  // 2. Secondary
    'gemini-pro-latest',         // 3. Tertiary
    'gemma-4-26b-a4b-it',        // 4. Safety Net (updated to valid model name)
    'gemini-2.0-flash'           // 5. Ultimate Fallback
];

export class GeminiService {
    static async generateContent(prompt: string): Promise<{ text: string; model: string }> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not defined');
        }

        let lastError = null;

        for (const model of MODEL_PRIORITY) {
            try {
                console.log(`[GeminiService] Attempting model: ${model}...`);
                const response = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    {
                        contents: [{ parts: [{ text: prompt }] }]
                    },
                    {
                        timeout: 30000, // 30s timeout
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
        throw new Error(`All Gemini models failed (likely due to API quota limits). Last error: ${finalMsg}`);
    }
}
