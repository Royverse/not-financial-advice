import { AIService } from '../../src/lib/services/ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    console.log('Testing AIService...');
    try {
        const { text } = await AIService.generateContent('Hello, are you there?', 'auto');
        console.log(`✅ Success!`);
        console.log(`Response: ${text.substring(0, 50)}...`);
    } catch (e: any) {
        console.error('❌ Failed:', e.message);
    }
}

test();
