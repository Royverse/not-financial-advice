import axios from 'axios';
import { supabase } from '../../../src/lib/services/supabase';

const XPOZ_ENDPOINT = 'https://mcp.xpoz.ai/mcp';

/**
 * Extracts the text payload from an XPOZ MCP response.
 * XPOZ can return either:
 *   (a) A plain JSON-RPC object  { result: { content: [{ text: "..." }] } }
 *   (b) An SSE stream            "data: { result: { content: [{ text: "..." }] } }\n\n"
 *
 * Axios auto-parses (a) into an object, so we branch on typeof.
 */
function extractMcpText(rawData: unknown): string | null {
    // (a) JSON object — axios already parsed it
    if (typeof rawData === 'object' && rawData !== null) {
        const obj = rawData as Record<string, any>;
        const text = obj?.result?.content?.[0]?.text ?? obj?.result?.text ?? null;
        if (text) return text;
        console.warn('[Xpoz] JSON response has unexpected shape:', JSON.stringify(obj).substring(0, 200));
        return null;
    }

    // (b) SSE string — parse each "data: <json>" line
    if (typeof rawData === 'string') {
        for (const line of rawData.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
                const parsed = JSON.parse(line.slice(6));
                const text = parsed?.result?.content?.[0]?.text ?? parsed?.result?.text ?? null;
                if (text) return text;
            } catch {
                // malformed JSON line — skip
            }
        }
        console.warn('[Xpoz] No parseable data: line found in SSE stream');
        return null;
    }

    console.warn('[Xpoz] Unexpected response type:', typeof rawData);
    return null;
}

async function mcpCall(method: string, params: Record<string, unknown>): Promise<string | null> {
    const apiKey = process.env.XPOZ_API_KEY;
    if (!apiKey) {
        console.error('[Xpoz] FATAL: XPOZ_API_KEY is not set');
        return null;
    }

    const payload = { jsonrpc: '2.0', method, id: 1, params };

    try {
        console.log(`[Xpoz] → ${method}`, JSON.stringify(params).substring(0, 80));

        const response = await axios.post(XPOZ_ENDPOINT, payload, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
                Accept: 'application/json, text/event-stream',
            },
            // Keep well inside Netlify's 10s function timeout
            timeout: 9500,
            // Never throw on 4xx/5xx — we log and handle gracefully
            validateStatus: () => true,
        });

        if (response.status >= 400) {
            console.error(`[Xpoz] HTTP ${response.status}:`, JSON.stringify(response.data).substring(0, 200));
            return null;
        }

        console.log(`[Xpoz] ← HTTP ${response.status}, data type: ${typeof response.data}`);
        return extractMcpText(response.data);

    } catch (err: any) {
        // Only network / timeout errors reach here (validateStatus swallows HTTP errors)
        console.error('[Xpoz] Network error:', err.code ?? err.message);
        return null;
    }
}

// ─── Sentiment scoring ────────────────────────────────────────────────────────

const POSITIVE_WORDS = ['bull', 'bullish', 'buy', 'good', 'growth', 'profit', 'up', 'moon', 'call', 'long', 'rally', 'gain', 'love', 'great'];
const NEGATIVE_WORDS = ['bear', 'bearish', 'sell', 'bad', 'loss', 'down', 'crash', 'put', 'short', 'dump', 'drop', 'fear', 'risk'];

function countKeywords(text: string, words: string[]): number {
    return words.reduce((sum, w) => sum + (text.match(new RegExp(`\\b${w}\\b`, 'g'))?.length ?? 0), 0);
}

function scoreSentiment(rawText: string) {
    const text = rawText.toLowerCase();
    const pos = countKeywords(text, POSITIVE_WORDS);
    const neg = countKeywords(text, NEGATIVE_WORDS);
    const total = pos + neg;

    let label: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
    if (pos > neg * 1.2) label = 'Bullish';
    if (neg > pos * 1.2) label = 'Bearish';

    let score = total > 0
        ? Math.min(0.95, 0.5 + (Math.abs(pos - neg) / total) * 0.45)
        : 0.5;

    return { label, pos, neg, total, score };
}

function extractTweets(rawText: string): string[] {
    // XPOZ CSV format: "tweetId","text","author",...
    const matches = rawText.match(/^\s*"\d+","([^"]+)"/gm) ?? [];
    return matches
        .map(m => m.match(/^\s*"\d+","(.*)"/)?.[ 1]?.replace(/\\n/g, ' ') ?? '')
        .filter(t => t.length > 20 && !t.startsWith('http'));
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async (req: Request) => {

    // ── POST: kick off a scrape job ──────────────────────────────────────────
    if (req.method === 'POST') {
        try {
            let body: any;
            try {
                body = await req.json();
            } catch (jsonErr: any) {
                console.error('[Xpoz POST] Body parse error:', jsonErr.message);
                return Response.json({ error: `Malformed JSON body: ${jsonErr.message}` }, { status: 400 });
            }

            const { query } = body;
            if (!query) return Response.json({ error: 'query is required' }, { status: 400 });

            console.log(`[Xpoz POST] Processing query: ${query}`);

            // --- STEP 0: Check Cache ---
            const { data: cached } = await supabase
                .from('recommendations')
                .select('sentiment_label, sentiment_score, sentiment_evidence, created_at')
                .eq('ticker', query.toUpperCase())
                .not('sentiment_label', 'is', null)
                .order('created_at', { ascending: false })
                .limit(1);

            if (cached && cached.length > 0) {
                const age = Date.now() - new Date(cached[0].created_at).getTime();
                const TWO_HOURS = 2 * 60 * 60 * 1000;
                
                if (age < TWO_HOURS) {
                    console.log(`[Xpoz Cache] Hit for ${query}: ${cached[0].sentiment_label}`);
                    let evidence: any[] = [];
                    try {
                        evidence = typeof cached[0].sentiment_evidence === 'string' 
                            ? JSON.parse(cached[0].sentiment_evidence) 
                            : (cached[0].sentiment_evidence || []);
                    } catch (e) {
                        console.warn('[Xpoz Cache] Failed to parse evidence:', e);
                    }

                    return Response.json({
                        status: 'completed',
                        data: {
                            sentiment: cached[0].sentiment_label,
                            score: cached[0].sentiment_score,
                            summary: `Retrieved from recent analysis (${Math.round(age / 60000)}m ago).`,
                            volume: 'N/A',
                            evidence,
                        },
                    });
                }
            }

            const text = await mcpCall('tools/call', {
                name: 'getTwitterPostsByKeywords',
                arguments: { query, limit: 8 },
            });

            if (!text) return Response.json({ error: 'Failed to start XPOZ job — check function logs for details' }, { status: 500 });

            // CASE A: Direct Results (Xpoz returned data immediately for small query)
            if (text.includes('results[') || text.includes('status: success')) {
                console.log(`[Xpoz] Received direct results for query: ${query}`);
                
                const tweets = extractTweets(text);
                const evidence = tweets.slice(0, 5);
                const { label, pos, neg, score } = scoreSentiment(text);

                const countMatch = text.match(/results\[(\d+)\]/i);
                const totalRows = countMatch ? parseInt(countMatch[1], 10) : tweets.length;
                const volume = totalRows >= 20 ? 'High' : totalRows >= 5 ? 'Medium' : 'Low';
                const finalScore = tweets.length > 0 && pos + neg === 0 ? 0.6 : score;

                return Response.json({
                    status: 'completed',
                    data: {
                        sentiment: label,
                        score: finalScore,
                        summary: `Analyzed ${totalRows.toLocaleString()} posts. ${pos} bullish / ${neg} bearish mentions. Overall: ${label}.`,
                        volume,
                        evidence,
                    },
                });
            }

            // CASE B: Asynchronous Job (Returns operationId for polling)
            const match = text.match(/operationId\s*[:=]\s*"?([a-zA-Z0-9_-]+)"?/);
            if (match?.[1]) {
                console.log(`[Xpoz] Job started: ${match[1]}`);
                return Response.json({ operationId: match[1], status: 'running' });
            }

            console.error('[Xpoz] Unrecognized response format:', text.substring(0, 500));
            return Response.json({ error: 'No operationId or results returned from XPOZ' }, { status: 500 });

        } catch (err: any) {
            console.error('[Xpoz POST] UNHANDLED ERROR:', err.stack || err.message);
            return Response.json({ 
                error: 'Internal Server Error', 
                details: err.message,
                stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
            }, { status: 500 });
        }
    }

    // ── GET: poll job status ─────────────────────────────────────────────────
    if (req.method === 'GET') {
        const operationId = new URL(req.url).searchParams.get('id');
        if (!operationId) return Response.json({ error: 'id param required' }, { status: 400 });

        const text = await mcpCall('tools/call', {
            name: 'checkOperationStatus',
            arguments: { operationId },
        });

        if (!text) return Response.json({ status: 'running' });

        // XPOZ signals completion via either "success: true" or '"status": "succeeded"'
        const isComplete = text.includes('success: true') || text.includes('"status": "succeeded"') || text.includes('"status":"succeeded"');

        if (!isComplete) {
            console.log(`[Xpoz] Job ${operationId} still running`);
            return Response.json({ status: 'running' });
        }

        // ── Parse completed result ──────────────────────────────────────────
        const tweets   = extractTweets(text);
        const evidence = tweets.slice(0, 5);
        const { label, pos, neg, score } = scoreSentiment(text);

        // Prefer explicit result count; fall back to tweet count
        const countMatch = text.match(/results\[(\d+)\]/i);
        const totalRows  = countMatch ? parseInt(countMatch[1], 10) : tweets.length;
        const volume     = totalRows >= 20 ? 'High' : totalRows >= 5 ? 'Medium' : 'Low';

        // If we have tweets but zero keyword hits, still give baseline confidence
        const finalScore = tweets.length > 0 && pos + neg === 0 ? 0.6 : score;

        console.log(`[Xpoz] Job ${operationId} complete — ${label} (${totalRows} posts, pos:${pos} neg:${neg})`);

        return Response.json({
            status: 'completed',
            data: {
                sentiment: label,
                score: finalScore,
                summary: `Analyzed ${totalRows.toLocaleString()} posts. ${pos} bullish / ${neg} bearish mentions. Overall: ${label}.`,
                volume,
                evidence,
            },
        });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
};
