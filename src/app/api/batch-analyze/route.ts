import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import axios from 'axios';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Default watchlist - can be customized
const DEFAULT_WATCHLIST = ['AAPL', 'TSLA', 'NVDA', 'META', 'GOOGL'];

// Helper to delay between requests (rate limit protection)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const tickers = body.tickers || DEFAULT_WATCHLIST;
        const results: any[] = [];
        const errors: any[] = [];

        for (const ticker of tickers) {
            try {
                console.log(`Analyzing ${ticker}...`);

                // 1. Fetch stock data
                const stockRes = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/alpha-vantage?symbol=${ticker}`);
                const stockData = stockRes.data;

                if (!stockData['Time Series (Daily)']) {
                    errors.push({ ticker, error: 'No stock data available' });
                    continue;
                }

                // 2. Fetch sentiment (with timeout)
                let sentimentData = null;
                try {
                    const xpozRes = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/xpoz?query=${ticker}`, { timeout: 10000 });
                    sentimentData = xpozRes.data;
                } catch (e) {
                    console.warn(`Sentiment fetch failed for ${ticker}`);
                }

                // 3. Run Gemini analysis
                const geminiRes = await axios.post(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/gemini`, {
                    ticker,
                    data: stockData,
                    sentiment: sentimentData
                });
                const analysisResult = geminiRes.data;

                // 4. Save to Supabase
                const latestPrice = Object.values(stockData['Time Series (Daily)'])[0]?.['4. close' as any];

                const { data: savedRec, error: saveError } = await supabase
                    .from('recommendations')
                    .insert([{
                        ticker,
                        trend: analysisResult.trend,
                        support_resistance: analysisResult.support_resistance,
                        projection: analysisResult.projection,
                        recommendation: analysisResult.recommendation,
                        conviction_score: analysisResult.conviction_score || null,
                        price_range_low: analysisResult.price_range_low || null,
                        price_range_high: analysisResult.price_range_high || null,
                        rec_price: latestPrice,
                        sentiment_score: sentimentData?.score || null,
                        sentiment_label: sentimentData?.sentiment || null,
                        created_at: new Date().toISOString(),
                    }])
                    .select();

                if (saveError) throw saveError;

                results.push({
                    ticker,
                    recommendation: analysisResult.recommendation,
                    conviction: analysisResult.conviction_score,
                    price: latestPrice
                });

                // Rate limit protection: wait 2 seconds between tickers
                await delay(2000);

            } catch (tickerError: any) {
                errors.push({ ticker, error: tickerError.message });
            }
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            failed: errors.length,
            results,
            errors
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET endpoint to trigger with default watchlist
export async function GET() {
    const fakeRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ tickers: DEFAULT_WATCHLIST })
    });
    return POST(fakeRequest);
}
