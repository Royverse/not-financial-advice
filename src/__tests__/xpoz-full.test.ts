/**
 * Integration tests for netlify/functions/api/xpoz.mts
 *
 * What the XPOZ Sentiment API returns (complete shape):
 *
 * POST /api/xpoz  { query: "AAPL" }
 *   → 200  { operationId: "op_abc123", status: "running" }
 *   → 500  { error: "Failed to start XPOZ job — check function logs for details" }
 *
 * GET  /api/xpoz?id=op_abc123
 *   → 200  { status: "running" }                        ← still processing
 *   → 200  { status: "completed", data: {               ← done
 *              sentiment: "Bullish" | "Bearish" | "Neutral",
 *              score:     number,   // 0..0.95 confidence
 *              summary:   string,   // human-readable summary
 *              volume:    "High" | "Medium" | "Low",
 *              evidence:  string[]  // up to 5 raw tweet texts
 *            }}
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

process.env.XPOZ_API_KEY = 'test-key';

// @ts-ignore
import handler from '../../netlify/functions/api/xpoz.mts';

vi.mock('axios');
const mocked = axios as vi.Mocked<typeof axios>;

// ─── helpers ──────────────────────────────────────────────────────────────────

const post = (body: object) =>
    handler(new Request('http://localhost/api/xpoz', { method: 'POST', body: JSON.stringify(body) }));

const get = (id: string) =>
    handler(new Request(`http://localhost/api/xpoz?id=${id}`, { method: 'GET' }));

function mcpJsonResponse(text: string) {
    return { status: 200, data: { jsonrpc: '2.0', id: 1, result: { content: [{ type: 'text', text }] } } };
}

function mcpSseResponse(text: string) {
    return { status: 200, data: `data: ${JSON.stringify({ jsonrpc: '2.0', id: 1, result: { content: [{ type: 'text', text }] } })}\n\n` };
}

// ─── POST tests ───────────────────────────────────────────────────────────────

describe('POST /api/xpoz — start a scrape job', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.XPOZ_API_KEY = 'test-key';
    });

    it('returns 400 when query is missing', async () => {
        const res = await post({});
        expect(res.status).toBe(400);
        expect((await res.json()).error).toMatch(/query/i);
    });

    it('returns operationId when XPOZ responds with plain JSON', async () => {
        mocked.post.mockResolvedValueOnce(mcpJsonResponse('operationId: op_abc123'));
        const res = await post({ query: 'AAPL' });
        const body = await res.json();
        expect(res.status).toBe(200);
        expect(body.operationId).toBe('op_abc123');
        expect(body.status).toBe('running');
    });

    it('returns operationId when XPOZ responds with SSE stream', async () => {
        mocked.post.mockResolvedValueOnce(mcpSseResponse('operationId: op_sse456'));
        const res = await post({ query: 'TSLA' });
        const body = await res.json();
        expect(res.status).toBe(200);
        expect(body.operationId).toBe('op_sse456');
    });

    it('handles operationId with hyphens', async () => {
        mocked.post.mockResolvedValueOnce(mcpJsonResponse('operationId: op-uuid-1234-5678'));
        const body = await (await post({ query: 'NVDA' })).json();
        expect(body.operationId).toBe('op-uuid-1234-5678');
    });

    it('returns completed sentiment data when XPOZ returns direct results', async () => {
        const mockResult = `
status: success
results[5]
"1","Buy buy buy bullish moon rally", "user1"
"2","Love it bull bull bull", "user2"
        `;
        mocked.post.mockResolvedValueOnce(mcpJsonResponse(mockResult));
        
        const res = await post({ query: 'AAPL' });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.status).toBe('completed');
        expect(body.data.sentiment).toBe('Bullish');
        expect(body.data.evidence.length).toBe(2);
    });

    it('returns 500 when XPOZ returns HTTP 401', async () => {
        mocked.post.mockResolvedValueOnce({ status: 401, data: { error: 'Unauthorized' } });
        const res = await post({ query: 'AAPL' });
        expect(res.status).toBe(500);
    });

    it('returns 500 when XPOZ returns no operationId', async () => {
        mocked.post.mockResolvedValueOnce(mcpJsonResponse('Job queued, please wait...'));
        const res = await post({ query: 'AAPL' });
        expect(res.status).toBe(500);
        expect((await res.json()).error).toMatch(/operationId/i);
    });

    it('returns 500 when XPOZ_API_KEY is missing', async () => {
        delete process.env.XPOZ_API_KEY;
        const res = await post({ query: 'AAPL' });
        expect(res.status).toBe(500);
    });
});

// ─── GET tests ────────────────────────────────────────────────────────────────

describe('GET /api/xpoz?id — poll job status', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.XPOZ_API_KEY = 'test-key';
    });

    it('returns 400 when id param is missing', async () => {
        const res = await handler(new Request('http://localhost/api/xpoz', { method: 'GET' }));
        expect(res.status).toBe(400);
    });

    it('returns { status: "running" } while job is still processing', async () => {
        mocked.post.mockResolvedValueOnce(mcpJsonResponse('status: pending, please wait...'));
        const body = await (await get('op_123')).json();
        expect(body.status).toBe('running');
    });

    it('returns { status: "running" } when XPOZ returns null (network issue)', async () => {
        mocked.post.mockResolvedValueOnce({ status: 200, data: {} }); // no text
        const body = await (await get('op_123')).json();
        expect(body.status).toBe('running');
    });

    it('returns completed sentiment data on success (success: true format)', async () => {
        const mockResult = `
success: true
results[12]
"1234567890","$AAPL going to the moon! Bullish long call", "trader1"
"1234567891","Buy the dip, great growth stock", "trader2"
"1234567892","Bearish risk here, sell before crash", "trader3"
        `;
        mocked.post.mockResolvedValueOnce(mcpJsonResponse(mockResult));
        const res = await get('op_done');
        const body = await res.json();

        // ── Assert the full API response shape ──────────────────────────────
        expect(res.status).toBe(200);
        expect(body.status).toBe('completed');

        const data = body.data;
        expect(data).toHaveProperty('sentiment');
        expect(['Bullish', 'Bearish', 'Neutral']).toContain(data.sentiment);

        expect(data).toHaveProperty('score');
        expect(data.score).toBeGreaterThan(0);
        expect(data.score).toBeLessThanOrEqual(0.95);

        expect(data).toHaveProperty('summary');
        expect(typeof data.summary).toBe('string');
        expect(data.summary.length).toBeGreaterThan(10);

        expect(data).toHaveProperty('volume');
        expect(['High', 'Medium', 'Low']).toContain(data.volume);

        expect(data).toHaveProperty('evidence');
        expect(Array.isArray(data.evidence)).toBe(true);
        expect(data.evidence.length).toBeLessThanOrEqual(5);
    });

    it('returns completed sentiment data on success ("status": "succeeded" format)', async () => {
        const mockResult = `{"status": "succeeded", "results": []}`;
        mocked.post.mockResolvedValueOnce(mcpJsonResponse(mockResult));
        const body = await (await get('op_done2')).json();
        expect(body.status).toBe('completed');
    });

    it('sentiment is Bullish when positive keywords dominate', async () => {
        const mockResult = `
success: true
results[5]
"1","Buy buy buy bullish moon rally long call great growth", "user1"
"2","Love it bull bull bull bull bull", "user2"
        `;
        mocked.post.mockResolvedValueOnce(mcpJsonResponse(mockResult));
        const data = (await (await get('op_bull')).json()).data;
        expect(data.sentiment).toBe('Bullish');
    });

    it('sentiment is Bearish when negative keywords dominate', async () => {
        const mockResult = `
success: true
results[5]
"1","Bearish crash dump sell short put risk fear bad loss", "user1"
"2","Bear bear bear dump crash", "user2"
        `;
        mocked.post.mockResolvedValueOnce(mcpJsonResponse(mockResult));
        const data = (await (await get('op_bear')).json()).data;
        expect(data.sentiment).toBe('Bearish');
    });

    it('volume is High when result count >= 20', async () => {
        mocked.post.mockResolvedValueOnce(mcpJsonResponse('success: true\nresults[25]'));
        const data = (await (await get('op_vol')).json()).data;
        expect(data.volume).toBe('High');
    });

    it('volume is Low when result count < 5', async () => {
        mocked.post.mockResolvedValueOnce(mcpJsonResponse('success: true\nresults[2]'));
        const data = (await (await get('op_vol2')).json()).data;
        expect(data.volume).toBe('Low');
    });
});

// ─── Method guard ─────────────────────────────────────────────────────────────

describe('Method guard', () => {
    it('returns 405 for PUT', async () => {
        const res = await handler(new Request('http://localhost/api/xpoz', { method: 'PUT' }));
        expect(res.status).toBe(405);
    });
});
