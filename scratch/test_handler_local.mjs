
import handler from '../netlify/functions/api/xpoz.mts';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testLocalHandler() {
    console.log('Testing local handler...');
    
    // Mock Request
    const req = {
        method: 'POST',
        json: async () => ({ query: 'AAPL' }),
    };

    try {
        const res = await handler(req);
        const body = await res.json();
        console.log('Response Status:', res.status);
        console.log('Response Body:', JSON.stringify(body, null, 2));
    } catch (err) {
        console.error('Fatal Handler Error:', err);
    }
}

testLocalHandler();
