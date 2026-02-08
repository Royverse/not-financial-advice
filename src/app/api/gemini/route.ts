import { NextResponse } from 'next/server';
import axios from 'axios';
import { GeminiService } from '../../../lib/gemini';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
    let tickerString = "";
    let sentiment: any = null;
    let data: any = null;

    try {
        const body = await request.json();
        tickerString = body.ticker;
        sentiment = body.sentiment;
        data = body.data;

        if (!tickerString || !data) {
            return NextResponse.json({ error: 'Ticker and data are required' }, { status: 400 });
        }

        // Simplify data for the prompt to avoid token limits
        const timeSeries = data['Time Series (Daily)'];
        const simplifiedData = Object.entries(timeSeries)
            .slice(0, 30)
            .map(([date, values]: [string, any]) => `${date}: ${values['4. close']}`)
            .join('\n');

        // Build sentiment context string
        const sentimentContext = sentiment ? `
Social Sentiment Analysis (from XPOZ):
- Overall Sentiment: ${sentiment.sentiment} (Confidence: ${(sentiment.score * 100).toFixed(0)}%)
- Summary: ${sentiment.summary}
- Evidence: ${sentiment.evidence?.join('; ') || 'N/A'}
        ` : "No social sentiment data available.";

        // The actual prompt sent to Gemini
        const prompt = `
Role: You are a Senior Quantitative Analyst. Analyze the provided stock data for ${tickerString} with 95% objectivity.

Context & Data:
${sentiment ? `<social_sentiment>
- Overall Sentiment: ${sentiment.sentiment} (Confidence: ${(sentiment.score * 100).toFixed(0)}%)
- Summary: ${sentiment.summary}
- Evidence: ${sentiment.evidence?.join('; ') || 'N/A'}
</social_sentiment>` : "<social_sentiment>No social sentiment data available.</social_sentiment>"}

<price_history_30d>
${simplifiedData}
</price_history_30d>

Instructions:
1. Trend Analysis: Identify the current phase (Accumulation, Trending, or Distribution). Use the 30-day data to discern the trend.
2. Technical Levels: Identify the strongest Support and Resistance levels based on price consolidation areas.
3. Sentiment Weighting: Evaluate the "Evidence" tweets. Ignore "spammy" link-only tweets and prioritize unique insights.
4. Projection: Forecast the next 5 trading days. If social sentiment and price trend diverge, explain the conflict.
5. Recommendation: Provide a Buy/Hold/Sell rating with a specific "Conviction Score" (1-10).

Format the response in JSON with these keys: 
- trend (string)
- support_resistance (string)
- projection (string)
- recommendation ("Buy" | "Sell" | "Hold")
- conviction_score (number, 1-10)
- price_range_low (number, expected low next 5 days)
- price_range_high (number, expected high next 5 days)

Do not use markdown code blocks, just return raw JSON.
`;

        // Create a display version with highlights (using <<< >>> markers)
        const displaySentiment = sentiment ? `
<social_sentiment>
- Overall Sentiment: <<<${sentiment.sentiment}>>> (Confidence: <<<${(sentiment.score * 100).toFixed(0)}%>>>)
- Summary: <<<${sentiment.summary}>>>
- Evidence: <<<${sentiment.evidence?.join('; ') || 'N/A'}>>>
</social_sentiment>` : "<social_sentiment>No social sentiment data available.</social_sentiment>";

        const displayPrompt = `
Role: You are a Senior Quantitative Analyst. Analyze the provided stock data for <<<${tickerString}>>> with 95% objectivity.

Context & Data:
${displaySentiment}

<price_history_30d>
<<<${simplifiedData.substring(0, 200)}...>>> [truncated]
</price_history_30d>

Instructions:
1. Trend Analysis: Identify the current phase...
...
Format the response in JSON with these keys: 
- trend
- support_resistance
- projection
- recommendation
- conviction_score
- price_range_low
- price_range_high
...
`;

        const { text: aiText, model: usedModel } = await GeminiService.generateContent(prompt);
        // Clean up markdown code blocks if present
        const jsonString = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

        let analysis;
        try {
            analysis = JSON.parse(jsonString);
        } catch (e) {
            analysis = { raw: aiText };
        }

        // Attach the debug prompt for frontend display
        return NextResponse.json({ ...analysis, debug_prompt: displayPrompt, used_model: usedModel });

    } catch (error: any) {
        console.error('Gemini API Error:', error.response?.data || error.message);

        // Fallback Mock Response
        const mockAnalysis = {
            trend: `(Mock) The stock ${tickerString} has shown volatility over the last 30 days. This is a fallback response as the AI API is currently rate-limited or unavailable.`,
            support_resistance: "Support at recent lows, Resistance at recent highs.",
            projection: "Projected to trade sideways with a bullish bias if market conditions improve.",
            recommendation: "Hold",
            conviction_score: 5,
            price_range_low: 100,
            price_range_high: 110,
            debug_prompt: `<<<ERROR: API Call Failed>>>

Attempted Prompt (Senior Quant Mode):

Role: You are a Senior Quantitative Analyst. Analyze the provided stock data for <<<${tickerString}>>> with 95% objectivity.

Context & Data:
${sentiment ? `<social_sentiment>
- Overall Sentiment: <<<${sentiment.sentiment}>>> (Confidence: <<<${(sentiment.score * 100).toFixed(0)}%>>>)
- Summary: <<<${sentiment.summary}>>>
- Evidence: <<<${sentiment.evidence?.join('; ') || 'N/A'}>>>
</social_sentiment>` : "<social_sentiment>No social sentiment data available.</social_sentiment>"}

<price_history_30d>
<<<${data ? 'Stock Data Present (30 days)' : 'No Stock Data'}>>>
</price_history_30d>

Instructions:
1. Trend Analysis...
2. Technical Levels...
3. Sentiment Weighting...
4. Projection...
5. Recommendation...`
        };

        return NextResponse.json(mockAnalysis);
    }
}
