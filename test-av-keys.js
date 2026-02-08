require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

const KEY_1 = process.env.ALPHA_VANTAGE_API_KEY;
const KEY_2 = process.env.ALPHA_VANTAGE_API_KEY_2;

async function testKey(key, name) {
    console.log(`Testing ${name} (${key ? key.substring(0, 5) + '...' : 'MISSING'})...`);
    if (!key) return;

    try {
        // Use a lightweight call like TIME_SERIES_DAILY or GLOBAL_QUOTE
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=${key}`;
        const res = await axios.get(url);

        console.log(`Response for ${name}:`);
        console.log(JSON.stringify(res.data, null, 2));

        if (res.data['Note']) console.warn("⚠️  NOTE DETECTED (Rate Limit)");
        if (res.data['Information']) console.warn("⚠️  INFORMATION DETECTED (Daily Limit/Premium)");

    } catch (e) {
        console.error(`❌ Error for ${name}:`, e.message);
    }
    console.log('-'.repeat(40));
}

async function main() {
    await testKey(KEY_1, 'Key 1');
    // Wait a bit to avoid triggering rate limit on same IP if they track that
    setTimeout(async () => {
        await testKey(KEY_2, 'Key 2');
    }, 2000);
}

main();
