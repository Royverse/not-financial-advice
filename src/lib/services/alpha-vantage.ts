export class AlphaVantageService {
    private apiKey: string;
    private baseUrl: string = 'https://www.alphavantage.co/query';

    constructor() {
        this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
        if (!this.apiKey) {
            console.warn("ALPHA_VANTAGE_API_KEY is not set");
        }
    }

    private async fetch(params: Record<string, string>) {
        // Construct query string manually to avoid URLSearchParams encoding issues if any
        const queryString = new URLSearchParams({
            ...params,
            apikey: this.apiKey
        }).toString();

        const url = `${this.baseUrl}?${queryString}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Alpha Vantage API error: ${response.statusText}`);
            }
            const data = await response.json();

            // Check for API error messages or limits
            if (data['Error Message']) {
                throw new Error(data['Error Message']);
            }
            if (data['Note'] || data['Information']) {
                console.warn("Alpha Vantage Limit Reached. Switching to Mock Data.");
                return this.getMockData(params);
            }

            return data;
        } catch (error) {
            console.error("Alpha Vantage Fetch Error (switching to mock):", error);
            return this.getMockData(params);
        }
    }

    private getMockData(params: Record<string, string>) {
        const symbol = params.symbol || 'MOCK';

        // Mock Top Gainers
        if (params.function === 'TOP_GAINERS_LOSERS') {
            return {
                "top_gainers": [
                    { "ticker": "MOCK1", "price": "150.23", "change_amount": "12.50", "change_percentage": "9.05%", "volume": "1200000" },
                    { "ticker": "MOCK2", "price": "45.67", "change_amount": "3.20", "change_percentage": "7.54%", "volume": "800000" },
                    { "ticker": "MOCK3", "price": "12.34", "change_amount": "0.90", "change_percentage": "6.87%", "volume": "5000000" },
                    { "ticker": "MOCK4", "price": "89.10", "change_amount": "5.40", "change_percentage": "6.45%", "volume": "300000" },
                    { "ticker": "MOCK5", "price": "23.45", "change_amount": "1.10", "change_percentage": "4.92%", "volume": "600000" }
                ],
                "top_losers": [],
                "most_actively_traded": []
            };
        }

        // Mock Overview
        if (params.function === 'OVERVIEW') {
            return {
                "Symbol": symbol,
                "Name": `Mock Company ${symbol}`,
                "Description": "This is a mock company description for testing purposes when API limits are hit.",
                "MarketCapitalization": "1000000000",
                "EBITDA": "50000000",
                "PERatio": "15.5",
                "PEGRatio": "1.2",
                "BookValue": "10.5",
                "DividendPerShare": "0.50",
                "EPS": "3.45",
                "RevenuePerShareTTM": "12.30",
                "ProfitMargin": "0.15",
                "OperatingMarginTTM": "0.18",
                "ReturnOnAssetsTTM": "0.08",
                "ReturnOnEquityTTM": "0.12",
                "RevenueTTM": "5000000000",
                "GrossProfitTTM": "2000000000",
                "DilutedEPSTTM": "3.45",
                "QuarterlyEarningsGrowthYOY": "0.10",
                "QuarterlyRevenueGrowthYOY": "0.08",
                "AnalystTargetPrice": "160.00",
                "TrailingPE": "15.5",
                "ForwardPE": "16.5",
                "PriceToSalesRatioTTM": "2.5",
                "PriceToBookRatio": "3.5",
                "EVToRevenue": "3.0",
                "EVToEBITDA": "12.0",
                "Beta": "1.1",
                "52WeekHigh": "160.00",
                "52WeekLow": "100.00",
                "50DayMovingAverage": "140.00",
                "200DayMovingAverage": "130.00",
                "SharesOutstanding": "100000000",
                "SharesFloat": "90000000"
            };
        }

        // Mock Global Quote (not directly used by public methods, but included in mock data)
        if (params.function === 'GLOBAL_QUOTE') {
            return {
                "Global Quote": {
                    "01. symbol": symbol,
                    "02. open": "145.00",
                    "03. high": "155.00",
                    "04. low": "144.00",
                    "05. price": "150.23",
                    "06. volume": "1500000",
                    "07. latest trading day": new Date().toISOString().split('T')[0],
                    "08. previous close": "140.00",
                    "09. change": "10.23",
                    "10. change percent": "7.31%"
                }
            };
        }

        // Mock Time Series Intraday
        if (params.function === 'TIME_SERIES_INTRADAY') {
            const series: any = {};
            const now = new Date();
            const interval = parseInt(params.interval || '5min');
            for (let i = 0; i < 10; i++) { // Last 10 intervals
                const date = new Date(now.getTime() - i * interval * 60 * 1000);
                const dateStr = date.toISOString().replace('T', ' ').substring(0, 19);
                const basePrice = 100 + Math.random() * 10;
                series[dateStr] = {
                    "1. open": (basePrice - 0.5).toFixed(2),
                    "2. high": (basePrice + 1.0).toFixed(2),
                    "3. low": (basePrice - 1.0).toFixed(2),
                    "4. close": basePrice.toFixed(2),
                    "5. volume": (1000 + Math.random() * 500).toFixed(0)
                };
            }
            return {
                "Meta Data": {
                    "1. Information": `Mock Intraday (${params.interval}) Prices`,
                    "2. Symbol": symbol,
                    "3. Last Refreshed": now.toISOString().replace('T', ' ').substring(0, 19),
                    "4. Interval": params.interval,
                    "5. Output Size": "Full",
                    "6. Time Zone": "US/Eastern"
                },
                [`Time Series (${params.interval})`]: series
            };
        }

        // Mock Time Series Daily
        if (params.function === 'TIME_SERIES_DAILY') {
            const series: any = {};
            const today = new Date();
            for (let i = 0; i < 30; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const basePrice = 150 - i + (Math.random() * 5);
                series[dateStr] = {
                    "1. open": (basePrice - 2).toFixed(2),
                    "2. high": (basePrice + 5).toFixed(2),
                    "3. low": (basePrice - 3).toFixed(2),
                    "4. close": basePrice.toFixed(2),
                    "5. volume": (1000000 + Math.random() * 500000).toFixed(0)
                };
            }
            return {
                "Meta Data": {
                    "1. Information": "Mock Daily Prices",
                    "2. Symbol": symbol,
                    "3. Last Refreshed": today.toISOString().split('T')[0],
                    "4. Output Size": "Compact",
                    "5. Time Zone": "US/Eastern"
                },
                "Time Series (Daily)": series
            };
        }

        // Mock Sentiment
        if (params.function === 'NEWS_SENTIMENT') {
            return {
                "feed": [
                    { "title": "Mock News 1", "overall_sentiment_score": "0.35", "summary": "Positive news about MOCK ticker." },
                    { "title": "Mock News 2", "overall_sentiment_score": "0.15", "summary": "Slightly positive update." }
                ]
            };
        }

        return {};
    }

    async getTopGainersLosers() {
        return this.fetch({ function: 'TOP_GAINERS_LOSERS' });
    }

    async getCompanyOverview(symbol: string) {
        return this.fetch({ function: 'OVERVIEW', symbol });
    }

    async getIntraday(symbol: string, interval: string = '5min') {
        return this.fetch({
            function: 'TIME_SERIES_INTRADAY',
            symbol,
            interval,
            outputsize: 'full'
        });
    }

    async getDaily(symbol: string) {
        return this.fetch({
            function: 'TIME_SERIES_DAILY',
            symbol
        });
    }

    async getNewsSentiment(symbol: string) {
        return this.fetch({
            function: 'NEWS_SENTIMENT',
            tickers: symbol,
            limit: '50'
        });
    }
}
