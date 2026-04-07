require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function extract() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching records:', error.message);
        return;
    }

    fs.writeFileSync('db-dump.json', JSON.stringify(data, null, 2));
    console.log(`Saved ${data.length} records to db-dump.json`);

    if (data.length > 0) {
        console.log('Sample record keys:', Object.keys(data[0]));
    }
}

extract();
