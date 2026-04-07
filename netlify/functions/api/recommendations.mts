import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async (req: Request) => {
    // Handle POST (Save Recommendation)
    if (req.method === 'POST') {
        try {
            const {
                ticker, trend, support_resistance, projection, recommendation, stock_price,
                sentiment_score, sentiment_label, sentiment_evidence,
                conviction_score,
                price_range_low,
                price_range_high,
                take_profit,
                stop_loss
            } = await req.json();

            let risk_reward_ratio = null;
            if (take_profit && stop_loss && stock_price) {
                const risk = stock_price - stop_loss;
                const reward = take_profit - stock_price;
                if (risk > 0) risk_reward_ratio = Number((reward / risk).toFixed(2));
            }

            if (!ticker) {
                return Response.json({ error: 'Ticker is required' }, { status: 400 });
            }

            const trendStr = typeof trend === 'object' ? JSON.stringify(trend) : trend;
            const supportResistanceStr = typeof support_resistance === 'object' ? JSON.stringify(support_resistance) : support_resistance;
            const projectionStr = typeof projection === 'object' ? JSON.stringify(projection) : projection;

            let insertPayload = {
                        ticker: ticker.toUpperCase(),
                        trend: trendStr,
                        support_resistance: supportResistanceStr,
                        projection: projectionStr,
                        recommendation: recommendation,
                        stock_price: stock_price || null,
                        rec_price: stock_price || null,
                        sentiment_score: sentiment_score || null,
                        sentiment_label: sentiment_label || null,
                        sentiment_evidence: sentiment_evidence || null,
                        conviction_score: conviction_score || null,
                        price_range_low: price_range_low || null,
                        price_range_high: price_range_high || null,
                        take_profit: take_profit || null,
                        stop_loss: stop_loss || null,
                        risk_reward_ratio: risk_reward_ratio,
                        created_at: new Date().toISOString(),
                    };

            let { data, error } = await supabase.from('recommendations').insert([insertPayload]).select();

            // Fallback for Supabase Schema Cache issues (missing Phase 3 columns)
            if (error && error.message.includes('schema cache')) {
                console.warn(`[Supabase Cache Fallback] Retrying insert without TP/SL/RR targets...`);
                delete (insertPayload as any).take_profit;
                delete (insertPayload as any).stop_loss;
                delete (insertPayload as any).risk_reward_ratio;
                const retry = await supabase.from('recommendations').insert([insertPayload]).select();
                data = retry.data;
                error = retry.error;
            }

            if (error) {
                console.error('Supabase Error:', error);
                return Response.json({ error: error.message }, { status: 500 });
            }

            // Auto-create a $1,000 paper trade for every Buy recommendation
            if (recommendation === 'Buy' && stock_price && data?.[0]?.id) {
                const NOTIONAL = 1000;
                const shares = NOTIONAL / stock_price;
                await supabase.from('paper_trades').insert([{
                    rec_id: data[0].id,
                    ticker: ticker.toUpperCase(),
                    entry_price: stock_price,
                    take_profit: take_profit || null,
                    stop_loss: stop_loss || null,
                    shares_held: shares,
                    notional_value: NOTIONAL,
                    status: 'open',
                }]);
                console.log(`Paper trade opened: ${ticker.toUpperCase()} @ $${stock_price} (${shares.toFixed(4)} shares)`);
            }

            return Response.json({ success: true, data });
        } catch (error: any) {
            console.error('API Error:', error);
            return Response.json({ error: 'Failed to save recommendation' }, { status: 500 });
        }
    }

    // Handle GET (List Recommendations)
    if (req.method === 'GET') {
        try {
            const { data, error } = await supabase
                .from('recommendations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return Response.json(data);
        } catch (error: any) {
            return Response.json({ error: error.message }, { status: 500 });
        }
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
};
