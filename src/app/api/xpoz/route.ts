import { NextResponse } from 'next/server';
import axios from 'axios';

const XPOZ_API_KEY = process.env.XPOZ_API_KEY;
const XPOZ_ENDPOINT = 'https://mcp.xpoz.ai/mcp';

async function mcpCall(method: string, params: any) {
    const payload = {
        jsonrpc: "2.0",
        method: method,
        id: 1,
        params: params
    };

    try {
        const response = await axios.post(XPOZ_ENDPOINT, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${XPOZ_API_KEY}`,
                'Accept': 'application/json, text/event-stream'
            },
            timeout: 15000
        });

        // Simple SSE parser
        const lines = response.data.split('\n');
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = JSON.parse(line.substring(6));
                if (data.result && data.result.content && data.result.content[0].text) {
                    return data.result.content[0].text;
                }
                return null;
            }
        }
        return null;
    } catch (e: any) {
        console.error('Error calling MCP:', e.message);
        return null;
    }
}

export async function POST(request: Request) {
    try {
        const { query } = await request.json();
        if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

        const result = await mcpCall("tools/call", {
            name: "getTwitterPostsByKeywords",
            arguments: { query: query, limit: 20 }
        });

        if (!result) return NextResponse.json({ error: 'Failed to start XPOZ job' }, { status: 500 });

        // Extract operationId
        const match = result.match(/operationId\s*[:=]\s*"?([a-zA-Z0-9_]+)"?/);
        if (match && match[1]) {
            return NextResponse.json({ operationId: match[1], status: 'running' });
        }

        return NextResponse.json({ error: 'No operation ID returned from XPOZ' }, { status: 500 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const operationId = searchParams.get('id');

    if (!operationId) return NextResponse.json({ error: 'Operation ID required' }, { status: 400 });

    const result = await mcpCall("tools/call", {
        name: "checkOperationStatus",
        arguments: { operationId }
    });

    if (!result) return NextResponse.json({ status: 'running' });

    if (result.includes('success: true') || result.includes('"status": "succeeded"')) {
        // Extract tweet texts using regex - the format is: text: "content"
        const tweetMatches = result.match(/text:\s*"([^"]+)"/g) || [];
        const tweets = tweetMatches
            .slice(0, 10) // Take top 10
            .map((m: string) => m.replace(/^text:\s*"/, '').replace(/"$/, ''))
            .filter((t: string) => t.length > 20 && !t.startsWith('http')); // Filter out short/link-only tweets

        // Evidence: Take 3-5 meaningful tweets
        const evidence = tweets.slice(0, 5);

        // Sentiment analysis based on keywords
        const text = result.toLowerCase();
        const positiveWords = ['bull', 'bullish', 'buy', 'good', 'growth', 'profit', 'up', 'moon', 'call', 'long', 'rally', 'gain', 'love', 'great'];
        const negativeWords = ['bear', 'bearish', 'sell', 'bad', 'loss', 'down', 'crash', 'put', 'short', 'dump', 'drop', 'fear', 'risk'];

        let positiveScore = 0;
        let negativeScore = 0;

        positiveWords.forEach(w => {
            const matches = (text.match(new RegExp(w, 'g')) || []).length;
            positiveScore += matches;
        });

        negativeWords.forEach(w => {
            const matches = (text.match(new RegExp(w, 'g')) || []).length;
            negativeScore += matches;
        });

        const totalMentions = positiveScore + negativeScore;
        let sentiment = "Neutral";
        if (positiveScore > negativeScore * 1.2) sentiment = "Bullish";
        if (negativeScore > positiveScore * 1.2) sentiment = "Bearish";

        // Confidence based on volume
        const confidence = totalMentions > 0
            ? Math.min(0.95, 0.5 + (Math.abs(positiveScore - negativeScore) / totalMentions) * 0.45)
            : 0.5;

        // Extract total rows for volume indicator
        const totalMatch = result.match(/totalRows:\s*(\d+)/);
        const totalRows = totalMatch ? parseInt(totalMatch[1]) : 0;
        const volume = totalRows > 1000 ? "High" : totalRows > 100 ? "Medium" : "Low";

        return NextResponse.json({
            status: 'completed',
            data: {
                sentiment: sentiment,
                score: confidence,
                summary: `Analyzed ${totalRows.toLocaleString()} social media posts about this ticker. Found ${positiveScore} bullish and ${negativeScore} bearish mentions. Overall sentiment: ${sentiment}.`,
                volume: volume,
                evidence: evidence
            }
        });
    }

    return NextResponse.json({ status: 'running' });
}
