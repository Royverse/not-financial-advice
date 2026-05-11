import { ScannerService } from '../../../src/lib/services/scanner';
import { MetricsService } from '../../../src/lib/services/metrics';
import { RegimeService, MarketRegime } from '../../../src/lib/services/regime';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Services
const scanner = new ScannerService();
const metrics = new MetricsService();

// Helper for delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default async (req: Request) => {
    try {
        // 1. Security Check (Basic Bearer Token)
        const authHeader = req.headers.get('authorization');
        const CRON_SECRET = process.env.CRON_SECRET || 'nfa_secret_123'; // Default for dev

        // Allow local development without token if needed, or enforce strict
        if (authHeader !== `Bearer ${CRON_SECRET}` && process.env.URL) { // Verify checks only on Prod
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        const scanStart = Date.now();
        let scanId: string | null = null;
        let tickersFound = 0;

        // --- Step 0: Get Macro Regime (Dynamic Adaptation) ---
        console.log('[Cron] Fetching Macro Regime...');
        const marketRegime = await RegimeService.getRegime();
        console.log(`[Cron] Current Regime: ${marketRegime.regime} (Bias: ${marketRegime.bias})`);

        // --- Step 1: Initialize Scan Log ---
        const { data: scanLog, error: scanError } = await supabase
            .from('market_scans')
            .insert([{
                scan_type: 'intraday',
                status: 'running'
            }])
            .select()
            .single();

        if (scanError) throw scanError;
        scanId = scanLog.id;
        console.log(`[Scan ${scanId}] Started.`);

        // --- Step 2: Discovery (Wide Net) ---
        const candidates = await scanner.discoverCandidates();
        tickersFound = candidates.length;
        console.log(`[Scan ${scanId}] Discovered ${tickersFound} candidates.`);

        // Detect Mock Mode
        if (candidates.some(c => c.ticker.startsWith('MOCK'))) {
            console.warn(`[Scan ${scanId}] Mock data detected. Tagging scan.`);
            await supabase.from('market_scans').update({ scan_type: 'mock_intraday' }).eq('id', scanId);
        }

        // Log raw candidates
        if (tickersFound > 0) {
            const rawInserts = candidates.map(c => ({
                scan_id: scanId,
                ticker: c.ticker,
                price: c.price,
                volume: c.volume,
                gap_percent: parseFloat(c.change_percent.replace('%', '')) // Fix Scanner Illusion
            }));
            await supabase.from('ticker_candidates').insert(rawInserts);
        }

        // --- Step 3: The Funnel (Filter & Deep Dive) ---
        // We can only process a few deep dives due to API limits (25 calls/day free tier)
        const topCandidates = candidates
            .sort((a, b) => (b.volume * Math.abs(b.change_sub)) - (a.volume * Math.abs(a.change_sub)))
            .slice(0, 2);

        const analyzedOpportunities = [];

        for (const cand of topCandidates) {
            console.log(`[Scan ${scanId}] Deep diving ${cand.ticker}...`);

            // 3.1 Metrics Calculation
            const rvol = await metrics.calculateRVOL(cand.ticker);
            await delay(1000); // Rate limit
            const floatRot = await metrics.calculateFloatRotation(cand.ticker, cand.volume);
            await delay(1000);
            const sentVel = await metrics.getSentimentVelocity(cand.ticker);
            await delay(1000);

            // 3.2 Conviction Score Calculation (Dynamic Regime-Based Algorithm)
            let score = 0;
            
            // Base Weights
            if (rvol > 2.0) score += 30;
            if (floatRot > 0.5) score += 20;
            if (Math.abs(sentVel) > 0.1) score += 20;
            if (cand.change_sub > 5) score += 10;

            // Regime-Specific Multipliers
            if (marketRegime.regime === 'Bearish') {
                // In a bear market, we punish momentum stocks that aren't extreme
                if (rvol < 3.0) score -= 20;
                if (cand.change_sub < 10) score -= 10;
            } else if (marketRegime.regime === 'Bullish') {
                // In a bull market, we reward trend-following
                if (cand.change_sub > 0) score += 10;
            } else if (marketRegime.regime === 'Volatile') {
                // High volatility -> Require higher conviction
                score -= 10;
            }

            // Bias Check: If bias is "Short Bias", penalize long setups
            if (marketRegime.bias === 'Short Bias') score -= 15;

            // Normalize to 100
            score = Math.max(0, Math.min(score, 100));

            // 3.3 AI Analysis Handoff
            // Call our existing Gemini API for a qualitative summary
            let aiSummary = "Analysis pending...";
            let isMockOrError = false;
            let takeProfit = null;
            let stopLoss = null;
            let riskRewardRatio = null;

            try {
                // Determine APP_URL
                const APP_URL = process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:3000';

                // Call the FLATTENED Gemini function or via Redirect
                // Using redirect path /api/gemini which maps to /.netlify/functions/api-gemini
                const stockRes = await axios.post(`${APP_URL}/api/gemini`, {
                    ticker: cand.ticker,
                    data: { 
                        "Time Series (Daily)": {},
                        "Market_Regime": marketRegime // Inject regime context into AI prompt
                    }, 
                    sentiment: { score: sentVel, sentiment: sentVel > 0 ? 'Bullish' : 'Bearish', summary: 'Velocity Scan' },
                    engine: 'auto' // Robust fallback for cron reliability
                });

                if (stockRes.data.trend && stockRes.data.trend.includes('(Mock)')) {
                    isMockOrError = true;
                    console.warn(`[Scan ${scanId}] AI returned mock data for ${cand.ticker}.`);
                } else {
                    aiSummary = stockRes.data.recommendation === 'Buy'
                        ? `Buy Signal (Conviction: ${score})`
                        : stockRes.data.recommendation; // Simple summary
                    
                    takeProfit = stockRes.data.take_profit || null;
                    stopLoss = stockRes.data.stop_loss || null;
                    
                    if (takeProfit && stopLoss && cand.price) {
                        const risk = cand.price - stopLoss;
                        const reward = takeProfit - cand.price;
                        if (risk > 0) riskRewardRatio = Number((reward / risk).toFixed(2));
                    }
                }
            } catch (e) {
                console.warn(`AI Handoff failed for ${cand.ticker}`, e);
                isMockOrError = true;
            }

            if (isMockOrError) {
                console.warn(`[Scan ${scanId}] Skipping persistence of ${cand.ticker} to prevent DB pollution.`);
                continue;
            }

            analyzedOpportunities.push({
                scan_id: scanId,
                ticker: cand.ticker,
                rvol,
                float_rotation: floatRot,
                sentiment_velocity: sentVel,
                conviction_score: score,
                ai_summary: aiSummary,
                is_watchlisted: score > 50, // Auto-watchlist if score > 50
                take_profit: takeProfit,
                stop_loss: stopLoss,
                risk_reward_ratio: riskRewardRatio
            });
        }

        // --- Step 4: Persist Results ---
        if (analyzedOpportunities.length > 0) {
            await supabase.from('analyzed_opportunities').insert(analyzedOpportunities);
        }

        // --- Step 5: Complete Scan Log ---
        await supabase
            .from('market_scans')
            .update({
                status: 'completed',
                tickers_found: tickersFound,
                duration_ms: Date.now() - scanStart
            })
            .eq('id', scanId);

        return new Response(JSON.stringify({
            success: true,
            scanId,
            processed: analyzedOpportunities.length,
            opportunities: analyzedOpportunities
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("Scan failed:", error);

        // Update status to failed
        // Note: scanId is local scop let, might be null
        // We need it accessible. scanId is accessible from outer scope.

        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
