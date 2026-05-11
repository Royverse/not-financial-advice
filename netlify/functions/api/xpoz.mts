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
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            try {
                // Handle both "data: {..." and "data:{..."
                const jsonStr = trimmed.startsWith('data: ') 
                    ? trimmed.slice(6) 
                    : trimmed.slice(5);
                
                const parsed = JSON.parse(jsonStr);
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

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        // handle escaped quotes ""
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());   // last field
  return fields;
}

interface ProcessedTweet {
  text: string;
  author: string;
  impressions: number;
}

function extractTweets(rawText: string): ProcessedTweet[] {
  const lines = rawText.split('\n');
  const tweets: ProcessedTweet[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.toLowerCase().startsWith('"id"')) continue; // skip header/empty

    const fields = parseCSVLine(trimmed);
    // Expect at least: id, text, author, impressions, ...
    if (fields.length < 4) continue;

    const id = fields[0].replace(/^"|"$/g, '');
    const text = fields[1].replace(/\\n/g, ' ').trim();
    const author = fields[2].replace(/^"|"$/g, '');
    const impressions = parseInt(fields[3], 10) || 0;

    // filter out very short or link-only tweets (same criteria as original)
    if (text.length <= 20 || text.startsWith('http')) continue;

    tweets.push({ text, author, impressions });
  }
  return tweets;
}

// Sentiment lexicons
const POSITIVE_WORDS = [
  'bull', 'bullish', 'buy', 'good', 'growth', 'profit',
  'up', 'moon', 'call', 'long', 'rally', 'gain', 'love', 'great'
];
const NEGATIVE_WORDS = [
  'bear', 'bearish', 'sell', 'bad', 'loss', 'down', 'crash',
  'put', 'short', 'dump', 'drop', 'fear', 'risk'
];

// Negation tokens (including contractions like "don't", "won't", etc.)
function isNegationToken(token: string): boolean {
  return /^(?:not?|never|no)$/i.test(token) || /n't$/i.test(token);
}

interface TweetSentiment {
  effectivePos: number;
  effectiveNeg: number;
}

function analyzeTweet(tweet: ProcessedTweet): TweetSentiment {
  const text = tweet.text.toLowerCase();
  // Tokenize on word boundaries, keeping contractions (e.g. "don't")
  const tokens = text.match(/\b\w+(?:'\w+)?\b/g) ?? [];

  let rawPosIndex: number[] = [];
  let rawNegIndex: number[] = [];

  // Find all positive keyword positions
  for (const word of POSITIVE_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    let match;
    while ((match = regex.exec(text)) !== null) {
      // convert char index to token index
      const preceding = text.slice(0, match.index);
      const tokenIdx = preceding.split(/\s+/).length - 1;
      rawPosIndex.push(tokenIdx);
    }
  }

  // Find all negative keyword positions
  for (const word of NEGATIVE_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const preceding = text.slice(0, match.index);
      const tokenIdx = preceding.split(/\s+/).length - 1;
      rawNegIndex.push(tokenIdx);
    }
  }

  // Helper: check negation window
  const hasNegation = (tokenIdx: number) => {
    for (let i = Math.max(0, tokenIdx - 3); i < tokenIdx; i++) {
      if (isNegationToken(tokens[i])) return true;
    }
    return false;
  };

  let effectivePos = 0;
  let effectiveNeg = 0;

  for (const idx of rawPosIndex) {
    if (hasNegation(idx)) {
      // negated positive → negative (weight 0.8)
      effectiveNeg += 0.8;
    } else {
      effectivePos += 1;
    }
  }

  for (const idx of rawNegIndex) {
    if (hasNegation(idx)) {
      // negated negative → positive (weight 0.8)
      effectivePos += 0.8;
    } else {
      effectiveNeg += 1;
    }
  }

  return { effectivePos, effectiveNeg };
}

function scoreSentimentAdvanced(rawText: string) {
  const tweets = extractTweets(rawText);
  if (tweets.length === 0) {
    return {
      label: 'Neutral' as const,
      score: 0.5,
      totalEffectivePos: 0,
      totalEffectiveNeg: 0,
      evidence: [] as string[],
      totalRows: 0
    };
  }

  let totalWeightedPolarity = 0;    // Σ weight * (pos - neg)
  let totalWeightedMagnitude = 0;   // Σ weight * (pos + neg)
  let totalEffectivePos = 0;
  let totalEffectiveNeg = 0;

  // Impression weighting: log base 2 to compress range, +1 to avoid zero weight
  const weightFn = (impressions: number) => Math.log2(impressions + 1) + 1;

  for (const tweet of tweets) {
    const { effectivePos, effectiveNeg } = analyzeTweet(tweet);
    const polarity = effectivePos - effectiveNeg;
    const magnitude = effectivePos + effectiveNeg;
    const weight = weightFn(tweet.impressions);

    totalWeightedPolarity += weight * polarity;
    totalWeightedMagnitude += weight * magnitude;
    totalEffectivePos += effectivePos;
    totalEffectiveNeg += effectiveNeg;
  }

  // Evidence: top 5 tweets by impression (the most influential)
  const evidence = tweets
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 5)
    .map(t => t.text);

  // If no sentiment words found anywhere -> neutral
  if (totalWeightedMagnitude === 0) {
    return {
      label: 'Neutral' as const,
      score: 0.5,
      totalEffectivePos,
      totalEffectiveNeg,
      evidence,
      totalRows: tweets.length
    };
  }

  // Raw ratio [-1, 1]
  const rawRatio = totalWeightedPolarity / totalWeightedMagnitude;
  // Map to [0, 1]: neutral = 0.5, bullish = 1, bearish = 0
  let score = 0.5 + 0.5 * rawRatio;

  // Confidence factor: shrink score towards 0.5 when total weighted evidence is small
  const MIN_STRONG_EVIDENCE = 10; // tunable threshold
  const confidenceFactor = Math.min(1, totalWeightedMagnitude / MIN_STRONG_EVIDENCE);
  score = 0.5 + (score - 0.5) * confidenceFactor;

  // Clamp to [0, 1]
  score = Math.max(0, Math.min(1, score));

  // Label based on raw ratio, but using a slightly wider neutral band (±0.25)
  let label: 'Bullish' | 'Bearish' | 'Neutral';
  if (rawRatio > 0.25) label = 'Bullish';
  else if (rawRatio < -0.25) label = 'Bearish';
  else label = 'Neutral';

  return {
    label,
    score,
    totalEffectivePos,
    totalEffectiveNeg,
    evidence,
    totalRows: tweets.length
  };
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

                const { label, score, totalEffectivePos, totalEffectiveNeg, evidence, totalRows: extractedTotalRows } = scoreSentimentAdvanced(text);

                const countMatch = text.match(/results\[(\d+)\]/i);
                const totalRows = countMatch ? parseInt(countMatch[1], 10) : extractedTotalRows;
                const volume = totalRows >= 20 ? 'High' : totalRows >= 5 ? 'Medium' : 'Low';

                return Response.json({
                    status: 'completed',
                    data: {
                        sentiment: label,
                        score: score,                             // now a true 0.0–1.0 conviction
                        summary: `Analyzed ${totalRows.toLocaleString()} posts. ` +
                                 `${Math.round(totalEffectivePos)} bullish / ${Math.round(totalEffectiveNeg)} bearish mentions. ` +
                                 `Overall: ${label} (conviction ${score.toFixed(2)}).`,
                        volume,
                        evidence,                                // top 5 most‑impression tweets
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
        const { label, score, totalEffectivePos, totalEffectiveNeg, evidence, totalRows: extractedTotalRows } = scoreSentimentAdvanced(text);

        // Prefer explicit result count; fall back to tweet count
        const countMatch = text.match(/results\[(\d+)\]/i);
        const totalRows = countMatch ? parseInt(countMatch[1], 10) : extractedTotalRows;
        const volume = totalRows >= 20 ? 'High' : totalRows >= 5 ? 'Medium' : 'Low';

        console.log(`[Xpoz] Job ${operationId} complete — ${label} (${totalRows} posts, pos:${totalEffectivePos} neg:${totalEffectiveNeg})`);

        return Response.json({
            status: 'completed',
            data: {
                sentiment: label,
                score: score,
                summary: `Analyzed ${totalRows.toLocaleString()} posts. ` +
                         `${Math.round(totalEffectivePos)} bullish / ${Math.round(totalEffectiveNeg)} bearish mentions. ` +
                         `Overall: ${label} (conviction ${score.toFixed(2)}).`,
                volume,
                evidence,
            },
        });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
};
