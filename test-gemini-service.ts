import { GeminiService } from './src/lib/gemini';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    console.log('Testing GeminiService...');
    try {
        const { text, model } = await GeminiService.generateContent('Hello, are you there?');
        console.log(`✅ Success! Model used: ${model}`);
        console.log(`Response: ${text.substring(0, 50)}...`);
    } catch (e: any) {
        console.error('❌ Failed:', e.message);
    }
}

test();
