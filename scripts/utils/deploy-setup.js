const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const NETLIFY_TOKEN = 'nfp_BzrdAsc5JsNHRP6EGRJdEw1yFWRuK49s8de2';
const SITE_ID = '62f953cb-ec5d-46d6-80e2-89a72be8bb74';

async function setup() {
    try {
        console.log(`Setting Env Vars for Site ID: ${SITE_ID}...`);

        const envVars = {
            GEMINI_API_KEY: process.env.GEMINI_API_KEY,
            ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY,
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            CRON_SECRET: process.env.CRON_SECRET || 'nfa_secret_123'
        };

        const envPayload = Object.entries(envVars).map(([key, value]) => ({
            key,
            values: [{ value: value || '', context: 'all' }]
        }));

        await axios.post(
            `https://api.netlify.com/api/v1/sites/${SITE_ID}/env`,
            envPayload,
            { headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` } }
        );
        console.log('✅ Environment Variables Set Successfully');

    } catch (e) {
        console.error('❌ Error:', e.response?.data || e.message);
    }
}

setup();
