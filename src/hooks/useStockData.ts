import { useState } from 'react';
import axios from 'axios';
import { StockData, AIAnalysis, XpozSentiment } from '@/types';

export interface PipelineStep {
    id: string;
    label: string;
    status: 'pending' | 'running' | 'success' | 'error' | 'mock';
    message?: string;
    duration?: number;
}

export function useStockData() {
    const [stockData, setStockData] = useState<StockData | null>(null);
    const [aiAnalysis, setAnalysis] = useState<AIAnalysis | null>(null);
    const [sentiment, setSentiment] = useState<XpozSentiment | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);

    const updateStep = (id: string, updates: Partial<PipelineStep>) => {
        setPipelineSteps(prev => prev.map(step =>
            step.id === id ? { ...step, ...updates } : step
        ));
    };

    const fetchStockData = async (ticker: string) => {
        if (!ticker) return;

        // Reset state
        setLoading(true);
        setError(null);
        setStockData(null);
        setAnalysis(null);
        setSentiment(null);

        // Initialize pipeline steps
        const initialSteps: PipelineStep[] = [
            { id: 'stock', label: 'Fetching Stock Data', status: 'pending' },
            { id: 'xpoz', label: 'Social Sentiment Analysis', status: 'pending' },
            { id: 'gemini', label: 'AI Analysis Engine', status: 'pending' },
            { id: 'save', label: 'Saving to Database', status: 'pending' },
        ];
        setPipelineSteps(initialSteps);

        let stockResult: StockData | null = null;
        let sentimentResult: XpozSentiment | null = null;

        // STEP 1: Fetch Stock Data from Alpha Vantage
        const stockStart = Date.now();
        updateStep('stock', { status: 'running', message: `Calling Alpha Vantage for ${ticker}...` });

        try {
            const response = await axios.get(`/api/alpha-vantage?ticker=${ticker}`);
            const stockDuration = Date.now() - stockStart;

            if (response.data.error) {
                updateStep('stock', {
                    status: 'error',
                    message: response.data.error,
                    duration: stockDuration
                });
                setError(response.data.error);
                setLoading(false);
                return;
            }

            stockResult = response.data;
            const isMock = response.data._mock === true;
            updateStep('stock', {
                status: isMock ? 'mock' : 'success',
                message: isMock
                    ? `Using cached/mock data (API limit reached)`
                    : `Live data received: ${Object.keys(response.data["Time Series (Daily)"] || {}).length} days`,
                duration: stockDuration
            });
            setStockData(stockResult);
        } catch (err: any) {
            updateStep('stock', {
                status: 'error',
                message: err.response?.data?.error || err.message,
                duration: Date.now() - stockStart
            });
            setError("Failed to fetch stock data.");
            setLoading(false);
            return;
        }

        // STEP 2: Fetch Social Sentiment from Xpoz
        const xpozStart = Date.now();
        updateStep('xpoz', { status: 'running', message: 'Starting Xpoz social scrape...' });

        try {
            const xpozStartRes = await axios.post("/api/xpoz", { query: ticker });

            if (xpozStartRes.data.operationId) {
                updateStep('xpoz', { message: `Operation started, polling for results...` });
                const opId = xpozStartRes.data.operationId;
                let attempts = 0;

                while (attempts < 12) {
                    await new Promise(r => setTimeout(r, 2500));
                    attempts++;
                    updateStep('xpoz', { message: `Polling... (attempt ${attempts}/12)` });

                    const check = await axios.get(`/api/xpoz?id=${opId}`);

                    if (check.data.status === 'completed') {
                        sentimentResult = check.data.data;
                        setSentiment(sentimentResult);
                        updateStep('xpoz', {
                            status: 'success',
                            message: `Sentiment: ${sentimentResult?.sentiment} (${(sentimentResult?.score || 0) * 100}% confidence)`,
                            duration: Date.now() - xpozStart
                        });
                        break;
                    }

                    if (check.data.status === 'failed') {
                        updateStep('xpoz', {
                            status: 'error',
                            message: 'Xpoz operation failed',
                            duration: Date.now() - xpozStart
                        });
                        break;
                    }
                }

                if (attempts >= 12 && !sentimentResult) {
                    updateStep('xpoz', {
                        status: 'error',
                        message: 'Timeout waiting for sentiment data',
                        duration: Date.now() - xpozStart
                    });
                }
            } else {
                updateStep('xpoz', {
                    status: 'error',
                    message: 'No operation ID returned',
                    duration: Date.now() - xpozStart
                });
            }
        } catch (e: any) {
            console.warn("Xpoz analysis failed:", e);
            updateStep('xpoz', {
                status: 'error',
                message: e.message || 'Xpoz API unavailable',
                duration: Date.now() - xpozStart
            });
        }

        // STEP 3: Run Gemini AI Analysis
        const geminiStart = Date.now();
        updateStep('gemini', { status: 'running', message: 'Sending data to Gemini AI...' });

        try {
            const geminiRes = await axios.post("/api/gemini", {
                ticker,
                data: stockResult,
                sentiment: sentimentResult
            });

            const geminiDuration = Date.now() - geminiStart;
            const isMockResponse = geminiRes.data.trend?.startsWith('(Mock)');

            setAnalysis(geminiRes.data);
            updateStep('gemini', {
                status: isMockResponse ? 'mock' : 'success',
                message: isMockResponse
                    ? 'Using fallback response (API quota exceeded)'
                    : `Analysis complete: ${geminiRes.data.recommendation} (Conviction: ${geminiRes.data.conviction_score}/10)`,
                duration: geminiDuration
            });

            // STEP 4: Save to Database
            updateStep('save', { status: 'running', message: 'Persisting to Supabase...' });
            const saveStart = Date.now();

            try {
                const latestPrice = stockResult?.["Time Series (Daily)"]
                    ? Object.values(stockResult["Time Series (Daily)"])[0]?.["4. close"]
                    : null;

                await axios.post("/api/recommendations", {
                    ticker,
                    trend: geminiRes.data.trend,
                    support_resistance: geminiRes.data.support_resistance,
                    projection: geminiRes.data.projection,
                    recommendation: geminiRes.data.recommendation,
                    conviction_score: geminiRes.data.conviction_score,
                    price_range_low: geminiRes.data.price_range_low,
                    price_range_high: geminiRes.data.price_range_high,
                    stock_price: latestPrice,
                    sentiment_score: sentimentResult?.score,
                    sentiment_label: sentimentResult?.sentiment,
                    sentiment_evidence: sentimentResult ? JSON.stringify(sentimentResult.evidence) : null
                });

                updateStep('save', {
                    status: 'success',
                    message: 'Saved to history',
                    duration: Date.now() - saveStart
                });
            } catch (saveErr: any) {
                updateStep('save', {
                    status: 'error',
                    message: saveErr.message || 'Failed to save',
                    duration: Date.now() - saveStart
                });
            }

        } catch (err: any) {
            console.error("Gemini analysis failed:", err);
            updateStep('gemini', {
                status: 'error',
                message: err.response?.data?.error || err.message,
                duration: Date.now() - geminiStart
            });
        }

        setLoading(false);
    };

    return {
        stockData,
        aiAnalysis,
        sentiment,
        loading,
        error,
        pipelineSteps,
        fetchStockData
    };
}
