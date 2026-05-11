
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const XPOZ_API_KEY = process.env.XPOZ_API_KEY;
const XPOZ_ENDPOINT = 'https://mcp.xpoz.ai/mcp';

// --- Functions from xpoz.mts to simulate processing ---

function extractMcpText(rawData) {
    if (typeof rawData === 'object' && rawData !== null) {
        return rawData?.result?.content?.[0]?.text ?? rawData?.result?.text ?? null;
    }
    if (typeof rawData === 'string') {
        for (const line of rawData.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
                const parsed = JSON.parse(line.slice(6));
                const text = parsed?.result?.content?.[0]?.text ?? parsed?.result?.text ?? null;
                if (text) return text;
            } catch { }
        }
    }
    return null;
}

const POSITIVE_WORDS = ['bull', 'bullish', 'buy', 'good', 'growth', 'profit', 'up', 'moon', 'call', 'long', 'rally', 'gain', 'love', 'great'];
const NEGATIVE_WORDS = ['bear', 'bearish', 'sell', 'bad', 'loss', 'down', 'crash', 'put', 'short', 'dump', 'drop', 'fear', 'risk'];

function countKeywords(text, words) {
    return words.reduce((sum, w) => sum + (text.toLowerCase().match(new RegExp(`\\b${w}\\b`, 'g'))?.length ?? 0), 0);
}

function scoreSentiment(rawText) {
    const text = rawText.toLowerCase();
    const pos = countKeywords(text, POSITIVE_WORDS);
    const neg = countKeywords(text, NEGATIVE_WORDS);
    const total = pos + neg;
    let label = 'Neutral';
    if (pos > neg * 1.2) label = 'Bullish';
    if (neg > pos * 1.2) label = 'Bearish';
    let score = total > 0 ? Math.min(0.95, 0.5 + (Math.abs(pos - neg) / total) * 0.45) : 0.5;
    return { label, pos, neg, total, score };
}

function extractTweets(rawText) {
    const matches = rawText.match(/^\s*"\d+","([^"]+)"/gm) ?? [];
    return matches
        .map(m => m.match(/^\s*"\d+","(.*)"/)?.[1]?.replace(/\\n/g, ' ') ?? '')
        .filter(t => t.length > 20 && !t.startsWith('http'));
}

async function showAaplResult() {
    console.log('Fetching Xpoz data for AAPL...');
    const startTime = Date.now();

    try {
        const response = await axios.post(XPOZ_ENDPOINT, {
            jsonrpc: '2.0',
            method: 'tools/call',
            id: 1,
            params: {
                name: 'getTwitterPostsByKeywords',
                arguments: { query: 'AAPL', limit: 10 },
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${XPOZ_API_KEY}`,
                Accept: 'application/json, text/event-stream',
            },
            timeout: 20000,
        });

        const rawText = extractMcpText(response.data);
        if (!rawText) {
            console.error('No text extracted from response');
            return;
        }

        const tweets = extractTweets(rawText);
        const sentimentInfo = scoreSentiment(rawText);
        
        const output = {
            status: 'completed',
            data: {
                sentiment: sentimentInfo.label,
                score: sentimentInfo.score,
                summary: `Analyzed ${tweets.length} posts. ${sentimentInfo.pos} bullish / ${sentimentInfo.neg} bearish mentions.`,
                volume: tweets.length >= 20 ? 'High' : tweets.length >= 5 ? 'Medium' : 'Low',
                evidence: tweets.slice(0, 5),
            },
            raw_stats: sentimentInfo,
            duration: `${Date.now() - startTime}ms`
        };

        console.log(JSON.stringify(output, null, 2));

    } catch (err) {
        console.error('Error:', err.message);
    }
}

showAaplResult();
