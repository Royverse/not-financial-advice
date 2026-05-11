import axios from 'axios';

export type AIEngine = 'auto' | 'groq' | 'gemini' | 'openrouter';

const GEMINI_MODEL_PRIORITY = [
    'gemini-flash-latest',       // 1. Primary
    'gemini-flash-lite-latest',  // 2. Secondary
    'gemini-pro-latest',         // 3. Tertiary
    'gemini-2.0-flash',          // 4. Fallback
    'gemma-4-26b-a4b-it'         // 5. Ultimate Safety Net
];

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const OPENROUTER_MODEL = 'deepseek/deepseek-r1';

export class AIService {
    static async generateContent(prompt: string, engine: AIEngine = 'auto'): Promise<{ text: string; model: string; provider: string }> {
        const groqApiKey = process.env.GROQ_API_KEY;
        const geminiApiKey = process.env.GEMINI_API_KEY;
        const openRouterApiKey = process.env.OPENROUTER_API_KEY;

        const useGroq = engine === 'groq' || engine === 'auto';
        const useGemini = engine === 'gemini' || engine === 'auto';
        const useOpenRouter = engine === 'openrouter';

        let lastError = null;
        const globalStart = Date.now();
        // Extending time limit slightly for OpenRouter but still respecting Netlify's 10s hard cap
        const TIME_LIMIT = engine === 'openrouter' ? 9500 : 8500; 

        // --- 0. Try OpenRouter (if explicitly requested) ---
        if (useOpenRouter) {
            if (!openRouterApiKey) {
                throw new Error('OPENROUTER_API_KEY is missing.');
            }
            try {
                const timeRemaining = TIME_LIMIT - (Date.now() - globalStart);
                console.log(`[AIService] Attempting OpenRouter (${OPENROUTER_MODEL}) with ${timeRemaining}ms remaining...`);
                
                const response = await axios.post(
                    'https://openrouter.ai/api/v1/chat/completions',
                    {
                        model: OPENROUTER_MODEL,
                        messages: [
                            { role: 'user', content: prompt } // DeepSeek R1 prefers direct user prompts without system
                        ],
                        response_format: { type: 'json_object' }
                    },
                    {
                        timeout: Math.min(timeRemaining, 9000), 
                        headers: {
                            'Authorization': `Bearer ${openRouterApiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'https://stock-tracker-nfa.netlify.app',
                            'X-Title': 'Stock Tracker'
                        }
                    }
                );

                if (response.data && response.data.choices && response.data.choices.length > 0) {
                    const text = response.data.choices[0].message.content;
                    console.log(`[AIService] ✅ Success with OpenRouter (${OPENROUTER_MODEL})`);
                    return { text, model: OPENROUTER_MODEL, provider: 'openrouter' };
                }
            } catch (error: any) {
                const msg = error.response?.data?.error?.message || error.response?.data?.error || error.message;
                const status = error.response?.status;
                console.warn(`[AIService] ❌ Failed with OpenRouter: ${status} - ${String(msg).substring(0, 100)}`);
                throw new Error(`OpenRouter API failed. Last error: ${msg}. (Note: DeepSeek R1 can be too slow for Netlify 10s limit)`);
            }
        }

        // --- 1. Try Groq (if 'auto' or 'groq') ---
        if (useGroq && groqApiKey) {
            try {
                const timeRemaining = TIME_LIMIT - (Date.now() - globalStart);
                if (timeRemaining <= 500) throw new Error("Out of time");

                console.log(`[AIService] Attempting Groq (${GROQ_MODEL}) with ${timeRemaining}ms remaining...`);
                
                const response = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: GROQ_MODEL,
                        messages: [
                            { role: 'system', content: 'You are a highly capable quantitative assistant. You must respond in valid raw JSON only. Do not wrap in markdown blocks.' },
                            { role: 'user', content: prompt }
                        ],
                        response_format: { type: 'json_object' }
                    },
                    {
                        timeout: Math.min(timeRemaining, 8000), 
                        headers: {
                            'Authorization': `Bearer ${groqApiKey}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.data && response.data.choices && response.data.choices.length > 0) {
                    const text = response.data.choices[0].message.content;
                    console.log(`[AIService] ✅ Success with Groq (${GROQ_MODEL})`);
                    return { text, model: GROQ_MODEL, provider: 'groq' };
                } else {
                    console.warn(`[AIService] ⚠️ Groq returned no valid choices.`);
                }
            } catch (error: any) {
                const msg = error.response?.data?.error?.message || error.response?.data?.error || error.message;
                const status = error.response?.status;
                console.warn(`[AIService] ❌ Failed with Groq: ${status} - ${String(msg).substring(0, 100)}`);
                lastError = error;

                // If user explicitly requested Groq, throw immediately
                if (engine === 'groq') {
                    throw new Error(`Groq API failed. Last error: ${msg}`);
                }
                console.log(`[AIService] Falling back to Gemini...`);
            }
        } else if (useGroq && !groqApiKey) {
            console.warn(`[AIService] ⚠️ Groq engine requested (or auto), but GROQ_API_KEY is not defined. Falling back to Gemini.`);
            if (engine === 'groq') {
                throw new Error('GROQ_API_KEY is missing.');
            }
        }

        // --- 2. Try Gemini (if 'auto' or 'gemini') ---
        if (useGemini) {
            if (!geminiApiKey) {
                throw new Error('GEMINI_API_KEY is not defined');
            }

            for (const model of GEMINI_MODEL_PRIORITY) {
                const timeRemaining = TIME_LIMIT - (Date.now() - globalStart);
                if (timeRemaining <= 500) {
                    console.warn(`[AIService] Global time limit reached. Aborting Gemini model attempts.`);
                    lastError = lastError || new Error('Request took too long, aborting to prevent 504 timeout.');
                    break;
                }

                try {
                    console.log(`[AIService] Attempting Gemini (${model}) with ${timeRemaining}ms remaining...`);
                    const response = await axios.post(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
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
                        console.log(`[AIService] ✅ Success with Gemini (${model})`);
                        return { text, model, provider: 'gemini' };
                    } else {
                        console.warn(`[AIService] ⚠️ ${model} returned no candidates.`);
                    }

                } catch (error: any) {
                    const msg = error.response?.data?.error?.message || error.message;
                    const status = error.response?.status;

                    console.warn(`[AIService] ❌ Failed with ${model}: ${status} - ${String(msg).substring(0, 100)}`);
                    lastError = error;
                    
                    // If the API key is completely invalid, don't bother trying the other models
                    if (status === 400 && String(msg).includes('API key not valid')) {
                        throw new Error('GEMINI_API_KEY is invalid.');
                    }
                }
            }
        }

        const finalMsg = lastError?.response?.data?.error?.message || lastError?.response?.data?.error || lastError?.message || 'Unknown error';
        throw new Error(`All AI models failed or timed out. Last error: ${finalMsg}`);
    }
}
