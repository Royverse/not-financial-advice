export interface StockData {
    "Meta Data": {
        "1. Information": string;
        "2. Symbol": string;
        "3. Last Refreshed": string;
        "4. Output Size": string;
        "5. Time Zone": string;
    };
    "Time Series (Daily)": {
        [key: string]: {
            "1. open": string;
            "2. high": string;
            "3. low": string;
            "4. close": string;
            "5. volume": string;
        };
    };
}

export interface AIAnalysis {
    trend: string;
    support_resistance: string;
    projection: string;
    recommendation: "Buy" | "Sell" | "Hold";
    conviction_score?: number; // 1-10
    price_range_low?: number;
    price_range_high?: number;
    raw?: string;
    debug_prompt?: string;
}

export interface XpozSentiment {
    sentiment: "Bullish" | "Bearish" | "Neutral";
    score: number;
    summary: string;
    volume: "High" | "Medium" | "Low";
    evidence?: string[];
}

export interface MarketScan {
    id: string;
    created_at: string;
    scan_type: 'pre_market' | 'intraday' | 'after_hours';
    tickers_found: number;
    status: 'running' | 'completed' | 'failed';
    duration_ms?: number;
}

export interface TickerCandidate {
    id: string;
    scan_id: string;
    ticker: string;
    price: number;
    volume: number;
    gap_percent?: number;
    rejection_reason?: string | null;
}

export interface AnalyzedOpportunity {
    id: string;
    scan_id: string;
    ticker: string;
    rvol: number;
    float_rotation: number;
    sentiment_velocity: number;
    options_gamma_score?: number;
    conviction_score: number;
    ai_summary: string;
    is_watchlisted: boolean;
    created_at: string;
}
