
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
    const { data, error } = await supabase
        .from('recommendations')
        .select('ticker, sentiment_label, sentiment_score, sentiment_evidence, created_at')
        .eq('ticker', 'AAPL')
        .not('sentiment_label', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Recent AAPL entry:', JSON.stringify(data, null, 2));
    }
}

checkDb();
