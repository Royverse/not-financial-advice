require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function verify() {
    console.log('Verifying DB Records...');

    // Connect to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch last 5 records
    const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching records:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.warn('No records found in "recommendations" table.');
        return;
    }

    console.log(`Found ${data.length} recent records:\n`);

    data.forEach((rec, i) => {
        console.log(`[Record ${i + 1}] ${rec.ticker} (${new Date(rec.created_at).toLocaleString()})`);
        console.log(`  - Price (Real): $${rec.rec_price}`);
        console.log(`  - Projection: ${rec.projection ? rec.projection.substring(0, 50) + '...' : 'MISSING'}`);
        console.log(`  - Sentiment: ${rec.sentiment_label || 'N/A'} (Score: ${rec.sentiment_score || 'N/A'})`);
        console.log(`  - Rec: ${rec.recommendation} (${rec.conviction_score}/10)`);

        // Validation Logic
        if (!rec.rec_price) console.warn('    ⚠️  MISSING REC_PRICE (Real Price)');
        if (!rec.projection) console.warn('    ⚠️  MISSING PROJECTION');
        if (rec.sentiment_score === null) console.warn('    ⚠️  MISSING SENTIMENT SCORE (Did Xpoz fail?)');

        console.log('');
    });
}

verify();
