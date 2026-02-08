import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { ScannerService } from '@/lib/services/scanner';
import { MetricsService } from '@/lib/services/metrics';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Services
const scanner = new ScannerService();
const metrics = new MetricsService();

// Helper for delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
    // 1. Security Check (Basic Bearer Token)
    const authHeader = request.headers.get('authorization');
    const CRON_SECRET = process.env.CRON_SECRET || 'nfa_secret_123'; // Default for dev

    // Allow local development without token if needed, or enforce strict
    if (authHeader !== `Bearer ${CRON_SECRET}` && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scanStart = Date.now();
    let scanId: string | null = null;
    let tickersFound = 0;

    try {
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
                gap_percent: c.change_sub // mapped to change_amount
            }));
            await supabase.from('ticker_candidates').insert(rawInserts);
        }

        // --- Step 3: The Funnel (Filter & Deep Dive) ---
        // We can only process a few deep dives due to API limits (25 calls/day free tier)
        // Optimization: 1 Discovery + (2 Tickers * 3 Calls) = 7 Calls/Run
        // 3 Runs/Day = 21 Calls (Fits in limit)
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

            // 3.2 Conviction Score Calculation (Simplified Algorithm)
            let score = 0;
            if (rvol > 2.0) score += 30;
            if (floatRot > 0.5) score += 20;
            if (Math.abs(sentVel) > 0.1) score += 20;
            if (cand.change_sub > 5) score += 10; // Momentum bonus

            // Normalize to 100
            score = Math.min(score, 100);

            // 3.3 AI Analysis Handoff
            // Call our existing Gemini API for a qualitative summary
            let aiSummary = "Analysis pending...";
            try {
                // We construct a mock "stockData" object because metrics service doesn't return the full series
                // In a real app we'd fetch it properly or cache it
                const stockRes = await axios.post(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/gemini`, {
                    ticker: cand.ticker,
                    data: { "Time Series (Daily)": {} }, // Gemini will use fallback/mock if data missing, or we should fetch it
                    sentiment: { score: sentVel, sentiment: sentVel > 0 ? 'Bullish' : 'Bearish', summary: 'Velocity Scan' }
                });
                aiSummary = stockRes.data.recommendation === 'Buy'
                    ? `Buy Signal (Conviction: ${score})`
                    : stockRes.data.recommendation; // Simple summary
            } catch (e) {
                console.warn(`AI Handoff failed for ${cand.ticker}`);
            }

            analyzedOpportunities.push({
                scan_id: scanId,
                ticker: cand.ticker,
                rvol,
                float_rotation: floatRot,
                sentiment_velocity: sentVel,
                conviction_score: score,
                ai_summary: aiSummary,
                is_watchlisted: score > 50 // Auto-watchlist if score > 50
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

        return NextResponse.json({
            success: true,
            scanId,
            processed: analyzedOpportunities.length,
            opportunities: analyzedOpportunities
        });

    } catch (error: any) {
        console.error("Scan failed:", error);

        if (scanId) {
            await supabase
                .from('market_scans')
                .update({ status: 'failed' })
                .eq('id', scanId);
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
