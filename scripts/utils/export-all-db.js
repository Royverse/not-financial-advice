require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function exportAll() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Exporting all tables...");
    const dbData = {};

    const tables = ['recommendations', 'market_scans', 'ticker_candidates', 'analyzed_opportunities'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
            console.error(`Error fetching ${table}:`, error.message);
        } else {
            dbData[table] = data;
            console.log(`Exported ${data.length} records from ${table}`);
        }
    }

    fs.writeFileSync('full-db-dump.json', JSON.stringify(dbData, null, 2));
    console.log("Successfully exported to full-db-dump.json");
}

exportAll();
