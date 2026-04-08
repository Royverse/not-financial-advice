import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MetricsService } from '../lib/services/metrics';

vi.mock('../lib/services/supabase', () => ({
    supabase: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [] }),
    },
}));

vi.mock('../lib/services/alpha-vantage', () => ({
    AlphaVantageService: vi.fn().mockImplementation(() => ({
        getDaily: vi.fn(),
        getCompanyOverview: vi.fn(),
        getNewsSentiment: vi.fn(),
    })),
}));

describe('MetricsService', () => {
    let metrics: MetricsService;
    let mockAv: any;

    beforeEach(() => {
        metrics = new MetricsService();
        mockAv = (metrics as any).av;
    });

    // --- RVOL ---
    describe('calculateRVOL', () => {
        it('returns 1.0 when no time series data', async () => {
            mockAv.getDaily.mockResolvedValue({});
            const result = await metrics.calculateRVOL('AAPL');
            expect(result).toBe(1.0);
        });

        it('correctly calculates RVOL as today / avg of prior days', async () => {
            // today = 2_000_000, prev 2 days avg = 1_000_000 → RVOL = 2.0
            const timeSeries: Record<string, any> = {
                '2025-01-03': { '5. volume': '2000000' },
                '2025-01-02': { '5. volume': '1000000' },
                '2025-01-01': { '5. volume': '1000000' },
            };
            mockAv.getDaily.mockResolvedValue({ 'Time Series (Daily)': timeSeries });
            const result = await metrics.calculateRVOL('AAPL');
            expect(result).toBe(2.0);
        });

        it('returns 1.0 when API throws', async () => {
            mockAv.getDaily.mockRejectedValue(new Error('fail'));
            const result = await metrics.calculateRVOL('ERR');
            expect(result).toBe(1.0);
        });
    });

    // --- Float Rotation ---
    describe('calculateFloatRotation', () => {
        it('returns 0 when no float data and no outstanding shares', async () => {
            mockAv.getCompanyOverview.mockResolvedValue({
                SharesFloat: 'None',
            });
            const result = await metrics.calculateFloatRotation('AAPL', 1_000_000);
            expect(result).toBe(0);
        });

        it('calculates correctly when SharesFloat is provided', async () => {
            mockAv.getCompanyOverview.mockResolvedValue({
                SharesFloat: '10000000',
            });
            // 1_000_000 / 10_000_000 = 0.1
            const result = await metrics.calculateFloatRotation('AAPL', 1_000_000);
            expect(result).toBe(0.1);
        });

        it('falls back to SharesOutstanding when SharesFloat is missing', async () => {
            mockAv.getCompanyOverview.mockResolvedValue({
                SharesFloat: 'None',
                SharesOutstanding: '5000000',
            });
            // 1_000_000 / 5_000_000 = 0.2
            const result = await metrics.calculateFloatRotation('AAPL', 1_000_000);
            expect(result).toBe(0.2);
        });

        it('returns 0 on API error', async () => {
            mockAv.getCompanyOverview.mockRejectedValue(new Error('fail'));
            const result = await metrics.calculateFloatRotation('ERR', 1_000_000);
            expect(result).toBe(0);
        });
    });

    // --- Sentiment Velocity ---
    describe('getSentimentVelocity', () => {
        it('returns 0 when no feed items', async () => {
            mockAv.getNewsSentiment.mockResolvedValue({ feed: [] });
            const result = await metrics.getSentimentVelocity('AAPL');
            expect(result).toBe(0);
        });

        it('averages sentiment scores from top 10 articles', async () => {
            const feed = Array(10).fill({ overall_sentiment_score: '0.5' });
            mockAv.getNewsSentiment.mockResolvedValue({ feed });
            const result = await metrics.getSentimentVelocity('AAPL');
            expect(result).toBe(0.5);
        });

        it('only uses first 10 articles', async () => {
            // 10 articles at 1.0, then extras at 0.0 — result should still be 1.0
            const feed = [
                ...Array(10).fill({ overall_sentiment_score: '1.0' }),
                ...Array(5).fill({ overall_sentiment_score: '0.0' }),
            ];
            mockAv.getNewsSentiment.mockResolvedValue({ feed });
            const result = await metrics.getSentimentVelocity('AAPL');
            expect(result).toBe(1.0);
        });

        it('returns 0 on API error', async () => {
            mockAv.getNewsSentiment.mockRejectedValue(new Error('fail'));
            const result = await metrics.getSentimentVelocity('ERR');
            expect(result).toBe(0);
        });
    });
});
