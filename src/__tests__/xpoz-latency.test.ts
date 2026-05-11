
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { supabase } from '../lib/services/supabase';

// Mock both axios and supabase
vi.mock('axios');
vi.mock('../lib/services/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    order: vi.fn(() => ({
                        limit: vi.fn()
                    }))
                }))
            }))
        }))
    }
}));

// @ts-ignore - The function import might need mapping or ignore for vitest
import handler from '../../netlify/functions/api/xpoz.mts';

describe('Xpoz Function - Latency and Caching', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.XPOZ_API_KEY = 'test-key';
    });

    it('returns cached data from Supabase if available and fresh', async () => {
        const mockCachedData = [{
            sentiment_label: 'Bullish',
            sentiment_score: 0.85,
            sentiment_evidence: JSON.stringify(['Bullish tweet']),
            created_at: new Date().toISOString()
        }];

        // Mock Supabase chain
        const mockLimit = vi.fn().mockResolvedValue({ data: mockCachedData });
        const mockOrder = vi.fn(() => ({ limit: mockLimit }));
        const mockEq = vi.fn(() => ({ order: mockOrder }));
        const mockSelect = vi.fn(() => ({ eq: mockEq }));
        (supabase.from as any).mockReturnValue({ select: mockSelect });

        const req = new Request('http://localhost/api/xpoz', {
            method: 'POST',
            body: JSON.stringify({ query: 'AAPL' })
        });

        const res = await handler(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.status).toBe('completed');
        expect(body.data.sentiment).toBe('Bullish');
        expect(body.data.summary).toContain('Retrieved from recent analysis');
        
        // Ensure axios.post was NOT called
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('calls Xpoz API if no fresh cache is found', async () => {
        // Mock empty cache
        const mockLimit = vi.fn().mockResolvedValue({ data: [] });
        const mockOrder = vi.fn(() => ({ limit: mockLimit }));
        const mockEq = vi.fn(() => ({ order: mockOrder }));
        const mockSelect = vi.fn(() => ({ eq: mockEq }));
        (supabase.from as any).mockReturnValue({ select: mockSelect });

        // Mock Xpoz API response
        (axios.post as any).mockResolvedValue({
            status: 200,
            data: {
                result: { content: [{ text: 'operationId: op_123' }] }
            }
        });

        const req = new Request('http://localhost/api/xpoz', {
            method: 'POST',
            body: JSON.stringify({ query: 'AAPL' })
        });

        const res = await handler(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.operationId).toBe('op_123');
        expect(axios.post).toHaveBeenCalled();
    });
});
