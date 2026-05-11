import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSave() {
  const insertPayload = {
    ticker: 'TEST',
    trend: 'Bullish (Test)',
    recommendation: 'Hold',
    created_at: new Date().toISOString(),
  };

  console.log('Inserting payload:', insertPayload);
  const { data, error } = await supabase.from('recommendations').insert([insertPayload]).select();

  if (error) {
    console.error('❌ Insert failed:', error.message);
  } else {
    console.log('✅ Insert successful:', data);
    
    // Clean up
    const { error: deleteError } = await supabase.from('recommendations').delete().eq('ticker', 'TEST');
    if (deleteError) console.error('Delete failed:', deleteError.message);
    else console.log('✅ Clean up successful');
  }
}

testSave();
