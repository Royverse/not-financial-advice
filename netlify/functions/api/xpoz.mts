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

export default async (req: Request) => {
    // Handle POST (Start Job)
    if (req.method === 'POST') {
        try {
            const { query } = await req.json();
            if (!query) return Response.json({ error: 'Query required' }, { status: 400 });

            const result = await mcpCall("tools/call", {
                name: "getTwitterPostsByKeywords",
                arguments: { query: query, limit: 20 }
            });

            if (!result) return Response.json({ error: 'Failed to start XPOZ job' }, { status: 500 });

            // Extract operationId
            const match = result.match(/operationId\s*[:=]\s*"?([a-zA-Z0-9_]+)"?/);
            if (match && match[1]) {
                return Response.json({ operationId: match[1], status: 'running' });
            }

            return Response.json({ error: 'No operation ID returned from XPOZ' }, { status: 500 });

        } catch (error: any) {
            return Response.json({ error: error.message }, { status: 500 });
        }
    }

    // Handle GET (Check Status)
    if (req.method === 'GET') {
        const { searchParams } = new URL(req.url);
        const operationId = searchParams.get('id');

        if (!operationId) return Response.json({ error: 'Operation ID required' }, { status: 400 });

        const result = await mcpCall("tools/call", {
            name: "checkOperationStatus",
            arguments: { operationId }
        });

        if (!result) return Response.json({ status: 'running' });

        if (result.includes('success: true') || result.includes('"status": "succeeded"')) {
            // Extract tweet texts from the new CSV-like MCP format
            // Format example: "2041305043836526924","Tweet text...","Author",...
            const tweetMatches = result.match(/^\s*"\d+","([^"]+)"/gm) || [];
            const tweets = tweetMatches
                .map((m: string) => {
                    const match = m.match(/^\s*"\d+","(.*)"/);
                    return match ? match[1].replace(/\\n/g, ' ') : '';
                })
                .filter((t: string) => t.length > 20 && !t.startsWith('http'));

            // Evidence: Take 3-5 meaningful tweets
            const evidence = tweets.slice(0, 5);

            // Sentiment analysis based on keywords from the whole raw output
            const text = result.toLowerCase();
            const positiveWords = ['bull', 'bullish', 'buy', 'good', 'growth', 'profit', 'up', 'moon', 'call', 'long', 'rally', 'gain', 'love', 'great'];
            const negativeWords = ['bear', 'bearish', 'sell', 'bad', 'loss', 'down', 'crash', 'put', 'short', 'dump', 'drop', 'fear', 'risk'];

            let positiveScore = 0;
            let negativeScore = 0;

            positiveWords.forEach(w => {
                const matches = (text.match(new RegExp(`\\b${w}\\b`, 'g')) || []).length;
                positiveScore += matches;
            });

            negativeWords.forEach(w => {
                const matches = (text.match(new RegExp(`\\b${w}\\b`, 'g')) || []).length;
                negativeScore += matches;
            });

            const totalMentions = positiveScore + negativeScore;
            let sentiment = "Neutral";
            if (positiveScore > negativeScore * 1.2) sentiment = "Bullish";
            if (negativeScore > positiveScore * 1.2) sentiment = "Bearish";

            // Confidence based on sentiment divergence
            let confidence = totalMentions > 0
                ? Math.min(0.95, 0.5 + (Math.abs(positiveScore - negativeScore) / totalMentions) * 0.45)
                : 0.5;
            
            // If we have tweets but no clear keywords, use baseline confidence
            if (tweets.length > 0 && totalMentions === 0) confidence = 0.6;

            // Extract total rows for volume indicator
            const countMatch = result.match(/results\[(\d+)\]/i);
            const totalRows = countMatch ? parseInt(countMatch[1]) : tweets.length;
            
            // The recent Xpoz API limits are capped per request. 
            // We determine volume relative to the query limit (usually 20).
            const volume = totalRows >= 20 ? "High" : totalRows >= 5 ? "Medium" : "Low";

            return Response.json({
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

        return Response.json({ status: 'running' });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
};
