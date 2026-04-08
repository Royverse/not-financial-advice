import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScannerService } from '../lib/services/scanner';

// Mock the AlphaVantageService
vi.mock('../lib/services/alpha-vantage', () => ({
    AlphaVantageService: vi.fn().mockImplementation(() => ({
        getTopGainersLosers: vi.fn(),
    })),
}));

const mockGainerData = (overrides = {}) => ({
    ticker: 'AAPL',
    price: '10.00',
    volume: '1000000',
    change_amount: '1.50',
    change_percentage: '15%',
    ...overrides,
});

describe('ScannerService.discoverCandidates', () => {
    let scanner: ScannerService;
    let mockGetTopGainersLosers: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        scanner = new ScannerService();
        // Access the mocked method
        mockGetTopGainersLosers = (scanner as any).av.getTopGainersLosers;
    });

    it('returns empty array when API returns no top_gainers', async () => {
        mockGetTopGainersLosers.mockResolvedValue({});
        const result = await scanner.discoverCandidates();
        expect(result).toEqual([]);
    });

    it('filters out stocks with price <= $2', async () => {
        mockGetTopGainersLosers.mockResolvedValue({
            top_gainers: [mockGainerData({ price: '1.50', volume: '2000000' })],
        });
        const result = await scanner.discoverCandidates();
        expect(result).toHaveLength(0);
    });

    it('filters out stocks with volume <= 500k', async () => {
        mockGetTopGainersLosers.mockResolvedValue({
            top_gainers: [mockGainerData({ price: '10.00', volume: '400000' })],
        });
        const result = await scanner.discoverCandidates();
        expect(result).toHaveLength(0);
    });

    it('includes stocks that pass price > $2 and volume > 500k filters', async () => {
        mockGetTopGainersLosers.mockResolvedValue({
            top_gainers: [mockGainerData({ price: '5.00', volume: '600000' })],
        });
        const result = await scanner.discoverCandidates();
        expect(result).toHaveLength(1);
        expect(result[0].ticker).toBe('AAPL');
        expect(result[0].price).toBe(5.0);
    });

    it('deduplicates tickers from most_actively_traded', async () => {
        mockGetTopGainersLosers.mockResolvedValue({
            top_gainers: [mockGainerData({ ticker: 'XYZ', price: '10.00', volume: '600000' })],
            most_actively_traded: [
                mockGainerData({ ticker: 'XYZ', price: '10.00', volume: '2000000', change_percentage: '5%' }),
            ],
        });
        const result = await scanner.discoverCandidates();
        expect(result.filter(c => c.ticker === 'XYZ')).toHaveLength(1);
    });

    it('returns empty array when API throws', async () => {
        mockGetTopGainersLosers.mockRejectedValue(new Error('API Error'));
        const result = await scanner.discoverCandidates();
        expect(result).toEqual([]);
    });

    it('most_actively_traded requires >= 3% change', async () => {
        mockGetTopGainersLosers.mockResolvedValue({
            top_gainers: [],
            most_actively_traded: [
                mockGainerData({ ticker: 'LOW', price: '10.00', volume: '2000000', change_percentage: '1%' }),
            ],
        });
        const result = await scanner.discoverCandidates();
        expect(result).toHaveLength(0);
    });
});
