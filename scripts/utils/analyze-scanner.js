require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function extractScannerData() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: scans, error: scansError } = await supabase.from('market_scans').select('*').order('created_at', { ascending: false });
    const { data: candidates, error: candsError } = await supabase.from('ticker_candidates').select('*');
    const { data: opportunities, error: oppsError } = await supabase.from('analyzed_opportunities').select('*');

    if (scansError || candsError || oppsError) {
        console.error('Error fetching scanner records:', scansError?.message, candsError?.message, oppsError?.message);
        return;
    }

    const report = {
        scans,
        candidates,
        opportunities,
    };

    fs.writeFileSync('scanner-dump.json', JSON.stringify(report, null, 2));
    console.log(`Saved ${scans.length} scans, ${candidates.length} candidates, and ${opportunities.length} opportunities to scanner-dump.json`);
}

extractScannerData();
