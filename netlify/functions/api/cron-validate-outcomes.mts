import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { AIService } from '../../../src/lib/services/ai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async (req: Request) => {
    try {
        // 1. Security Check (Basic Bearer Token)
        const authHeader = req.headers.get('authorization');
        const CRON_SECRET = process.env.CRON_SECRET || 'nfa_secret_123';

        // Allow local development without token if needed, or enforce strict
        if (authHeader !== `Bearer ${CRON_SECRET}` && process.env.URL) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        console.log("Starting Outcome Validation...");

        // 1. Fetch unvalidated recommendations
        // Check anything older than 1 minute to allow for quick testing
        const cutoff = new Date(Date.now() - 1 * 60 * 1000).toISOString();

        const { data: recs, error } = await supabase
            .from('recommendations')
            .select('*')
            .is('is_correct', null) // Only unvalidated
            .lt('created_at', cutoff)
            .not('rec_price', 'is', null) // Must have a start price
            .order('created_at', { ascending: false }) // Newest first
            .limit(10); // Process in batches

        if (error) throw error;

        if (!recs || recs.length === 0) {
            console.log("No pending validations found.");
            return new Response(JSON.stringify({ message: 'No pending validations found.' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
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

                if (response.data.Information || response.data.Note) {
                    console.warn("Alpha Vantage API rate limit hit. Breaking validation loop.");
                    break; // Stop processing further records this run
                }

                if (response.data['Error Message']) {
                    console.warn(`Invalid symbol or API error for ${rec.ticker}. Marking as invalid to unblock queue.`);
                    await supabase.from('recommendations').update({ actual_outcome: 0, is_correct: false, validation_date: new Date().toISOString() }).eq('id', rec.id);
                    continue;
                }

                const quote = response.data['Global Quote'];
                if (!quote || !quote['05. price']) {
                    console.warn(`No price data for ${rec.ticker}`);
                    continue; // Might be a temporary issue, leave in queue
                }

                const currentPrice = parseFloat(quote['05. price']);
                const recPrice = parseFloat(rec.rec_price);

                let isCorrect = false;
                const threshold = 0.01; // 1% buffer

                if (rec.recommendation === 'Buy') {
                    if (rec.take_profit && currentPrice >= rec.take_profit) {
                        isCorrect = true; // Hit Take-Profit
                    } else if (rec.stop_loss && currentPrice <= rec.stop_loss) {
                        isCorrect = false; // Hit Stop-Loss
                    } else {
                        // Check for expiry (14 days)
                        const recDate = new Date(rec.created_at);
                        const daysOld = (new Date().getTime() - recDate.getTime()) / (1000 * 3600 * 24);
                        if (daysOld > 14) {
                            isCorrect = false; // Expired without hitting target
                        } else {
                            continue; // Still active, hasn't hit TP or SL
                        }
                    }
                } else if (rec.recommendation === 'Sell') {
                    isCorrect = currentPrice < recPrice * (1 - threshold); // Must be > 1% drop
                } else {
                    // Hold: Correct if price stayed within +/- 2%
                    const pctChange = Math.abs((currentPrice - recPrice) / recPrice);
                    isCorrect = pctChange < 0.02;
                }

                // 3. Update Recommendation DB
                const { error: updateError } = await supabase
                    .from('recommendations')
                    .update({
                        actual_outcome: currentPrice,
                        is_correct: isCorrect,
                        validation_date: new Date().toISOString()
                    })
                    .eq('id', rec.id);

                // --- Pillar 3: Algorithmic Post-Mortem (Self-Learning) ---
                if (!isCorrect && rec.recommendation === 'Buy') {
                    console.log(`[Post-Mortem] Analyzing failed trade on ${rec.ticker} via DeepSeek R1...`);
                    const pmPrompt = `
SYSTEM: You are a Senior Risk Manager. A paper trade just hit its Stop Loss.
Analyze why this trade failed based on the data below.
Suggest ONE permanent "Trading Rule" to prevent similar future failures.
Respond in RAW JSON ONLY. No reasoning tokens.

TRADE DATA:
- Ticker: ${rec.ticker}
- Entry: ${recPrice}
- Stop Loss: ${rec.stop_loss}
- Take Profit: ${rec.take_profit}
- AI Thesis: ${rec.ai_summary}
- Final Price: ${currentPrice}

OUTPUT FORMAT:
{
  "failure_reason": "string",
  "suggested_rule": "string",
  "category": "Technicals" | "Sentiment" | "Macro"
}
`;
                    try {
                        const { text } = await AIService.generateContent(pmPrompt, 'openrouter');
                        const pm = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
                        
                        // Log to market_scans or a dedicated rules table
                        await supabase.from('market_scans').insert([{
                            scan_type: 'post_mortem',
                            status: 'completed',
                            metadata: {
                                ticker: rec.ticker,
                                ...pm
                            }
                        }]);
                        console.log(`[Post-Mortem] New learning captured: ${pm.suggested_rule}`);
                    } catch (e: any) {
                        console.warn('[Post-Mortem] Analysis failed:', e.message);
                    }
                }

                // 4. Close the linked paper trade if it exists
                const { data: openTrades } = await supabase
                    .from('paper_trades')
                    .select('*')
                    .eq('rec_id', rec.id)
                    .eq('status', 'open')
                    .limit(1);

                if (openTrades && openTrades.length > 0) {
                    const trade = openTrades[0];
                    // Determine close reason
                    let closeStatus = 'expired';
                    if (trade.take_profit && currentPrice >= trade.take_profit) closeStatus = 'closed_win';
                    else if (trade.stop_loss && currentPrice <= trade.stop_loss) closeStatus = 'closed_loss';
                    
                    const pnlDollars = (currentPrice - trade.entry_price) * trade.shares_held;
                    const pnlPct = ((currentPrice - trade.entry_price) / trade.entry_price) * 100;

                    await supabase.from('paper_trades').update({
                        status: closeStatus,
                        exit_price: currentPrice,
                        pnl_dollars: pnlDollars,
                        pnl_percent: pnlPct,
                        closed_at: new Date().toISOString(),
                    }).eq('id', trade.id);
                    console.log(`Paper trade closed: ${trade.ticker} → ${closeStatus} | P&L: $${pnlDollars.toFixed(2)}`);
                }

                if (!updateError) {
                    updates.push({
                        ticker: rec.ticker,
                        rec: rec.recommendation,
                        start: recPrice,
                        end: currentPrice,
                        result: isCorrect ? 'WIN' : 'MISS'
                    });
                } else {
                    console.error(`Failed to update DB for ${rec.ticker}`, updateError);
                }

            } catch (e) {
                console.error(`Error validating ${rec.ticker}:`, e);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            processed: updates.length,
            details: updates
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
