import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSave() {
  const insertPayload = {
    ticker: 'AAPL',
    trend: 'Bullish momentum',
    support_resistance: 'Support at 180',
    projection: 'Up to 200',
    recommendation: 'Buy',
    stock_price: 185.50,
    rec_price: 185.50,
    sentiment_score: 0.85,
    sentiment_label: 'Bullish',
    sentiment_evidence: JSON.stringify(["Bullish tweet 1"]),
    conviction_score: Math.round(8.5),
    price_range_low: 180.25,
    price_range_high: 200.75,
    take_profit: 210.50,
    stop_loss: 175.25,
    risk_reward_ratio: 2.5, // 25 / 10 = 2.5
    created_at: new Date().toISOString(),
  };

  console.log('Inserting payload:', insertPayload);
  const { data, error } = await supabase.from('recommendations').insert([insertPayload]).select();

  if (error) {
    console.error('❌ Insert failed:', error.message);
  } else {
    console.log('✅ Insert successful:', data);
    
    // Test paper trade creation (it's done in the API, but let's check if the table exists)
    const { data: ptData, error: ptError } = await supabase.from('paper_trades').select('*').limit(1);
    if (ptError) console.error('❌ paper_trades table error:', ptError.message);
    else console.log('✅ paper_trades table accessible');

    // Clean up
    await supabase.from('recommendations').delete().eq('id', data[0].id);
  }
}

testSave();
