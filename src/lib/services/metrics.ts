import { AlphaVantageService } from './alpha-vantage';

export class MetricsService {
    private av: AlphaVantageService;

    constructor() {
        this.av = new AlphaVantageService();
    }

    /**
     * Engine 1: Relative Volume (RVOL)
     * Compares today's volume to the 30-day average.
     */
    async calculateRVOL(ticker: string): Promise<number> {
        // NOTE: In a real production app, we would cache the 30-day average in Supabase
        // to avoid fetching full intraday history every time.
        // For this implementation, we will use the Daily Time Series to get average volume.

        try {
            const data = await this.av.getDaily(ticker);
            const timeSeries = data['Time Series (Daily)'];

            if (!timeSeries) return 1.0; // Fallback

            if (!timeSeries) return 1.0; // Fallback

            // Sort dates descending to ensure we get the most recent data
            const dates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).slice(0, 31);

            if (dates.length < 2) return 1.0;

            const todayVol = parseInt(timeSeries[dates[0]]['5. volume']);

            // Calculate average of previous 30 days
            let totalVol = 0;
            for (let i = 1; i < dates.length; i++) {
                totalVol += parseInt(timeSeries[dates[i]]['5. volume']);
            }
            const avgVol = totalVol / (dates.length - 1);

            if (avgVol === 0) return 0;

            // RVOL = Today / Average
            return parseFloat((todayVol / avgVol).toFixed(2));
        } catch (e) {
            console.error(`RVOL failed for ${ticker}`, e);
            return 1.0;
        }
    }

    /**
     * Engine 2: Float Rotation
     * Checks if daily volume > float (high volatility signal)
     */
    async calculateFloatRotation(ticker: string, dailyVol: number): Promise<number> {
        try {
            const data = await this.av.getCompanyOverview(ticker);

            if (!data.SharesFloat || data.SharesFloat === '0' || data.SharesFloat === 'None') {
                // If float data is missing, check SharesOutstanding
                if (data.SharesOutstanding) {
                    const outstanding = parseInt(data.SharesOutstanding);
                    return parseFloat((dailyVol / outstanding).toFixed(2));
                }
                return 0;
            }

            const float = parseInt(data.SharesFloat);
            return parseFloat((dailyVol / float).toFixed(2));

        } catch (e) {
            console.error(`Float Rotation failed for ${ticker}`, e);
            return 0;
        }
    }

    /**
     * Engine 3: Sentiment Velocity
     */
    async getSentimentVelocity(ticker: string): Promise<number> {
        // In a full implementation, this would compare current sentiment
        // vs. a historical value stored in Supabase.
        // For now, we will just return the raw sentiment score as a proxy.
        // If score is high (positive) = high velocity in that direction.

        try {
            const data = await this.av.getNewsSentiment(ticker);
            const items = data.feed || [];

            if (items.length === 0) return 0;

            // Calculate weighted average of top 10 articles
            let totalScore = 0;
            let count = 0;

            for (const item of items.slice(0, 10)) {
                totalScore += parseFloat(item.overall_sentiment_score);
                count++;
            }

            return parseFloat((totalScore / count).toFixed(2));

        } catch (e) {
            return 0;
        }
    }
}
