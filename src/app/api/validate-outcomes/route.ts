import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import axios from 'axios';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    try {
        // 1. Fetch unvalidated recommendations
        // For demo purposes, we check anything older than 1 minute to allow for quick testing
        const cutoff = new Date(Date.now() - 1 * 60 * 1000).toISOString();

        const { data: recs, error } = await supabase
            .from('recommendations')
            .select('*')
            .is('is_correct', null) // Only unvalidated
            .lt('created_at', cutoff)
            .not('rec_price', 'is', null) // Must have a start price
            .limit(10); // Process in batches

        if (error) throw error;
        if (!recs || recs.length === 0) {
            return NextResponse.json({ message: 'No pending validations found.' });
        }

        const updates = [];

        // 2. Check current price for each
        for (const rec of recs) {
            try {
                // Fetch current price
                const response = await axios.get('https://www.alphavantage.co/query', {
                    params: {
                        function: 'GLOBAL_QUOTE',
                        symbol: rec.ticker,
                        apikey: ALPHA_VANTAGE_API_KEY
                    }
                });

                const quote = response.data['Global Quote'];
                if (!quote || !quote['05. price']) continue;

                const currentPrice = parseFloat(quote['05. price']);
                const recPrice = parseFloat(rec.rec_price);

                let isCorrect = false;
                const threshold = 0.01; // 1% buffer

                if (rec.recommendation === 'Buy') {
                    isCorrect = currentPrice > recPrice * (1 + threshold); // Must be > 1% gain
                } else if (rec.recommendation === 'Sell') {
                    isCorrect = currentPrice < recPrice * (1 - threshold); // Must be > 1% drop
                } else {
                    // Hold: Correct if price stayed within +/- 2%
                    const pctChange = Math.abs((currentPrice - recPrice) / recPrice);
                    isCorrect = pctChange < 0.02;
                }

                // 3. Update DB
                const { error: updateError } = await supabase
                    .from('recommendations')
                    .update({
                        actual_outcome: currentPrice,
                        is_correct: isCorrect,
                        validation_date: new Date().toISOString()
                    })
                    .eq('id', rec.id);

                if (!updateError) {
                    updates.push({
                        ticker: rec.ticker,
                        rec: rec.recommendation,
                        start: recPrice,
                        end: currentPrice,
                        result: isCorrect ? 'WIN' : 'MISS'
                    });
                }

            } catch (e) {
                console.error(`Error validating ${rec.ticker}:`, e);
            }
        }

        return NextResponse.json({
            success: true,
            processed: updates.length,
            details: updates
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
