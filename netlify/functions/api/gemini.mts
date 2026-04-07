import { GeminiService } from '../../../src/lib/gemini';

export default async (req: Request) => {
    if (req.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    let tickerString = "";
    let sentiment: any = null;
    let data: any = null;

    try {
        const body = await req.json();
        tickerString = body.ticker;
        sentiment = body.sentiment;
        data = body.data;

        if (!tickerString || !data) {
            return Response.json({ error: 'Ticker and data are required' }, { status: 400 });
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
ANALYZE: ${tickerString}
GOAL: Maximize ROI focusing on asymmetric risk-reward. Capital preservation is priority one.

CONTEXT:
${sentiment ? `Social Sentiment: ${sentiment.sentiment} (${(sentiment.score * 100).toFixed(0)}% Confidence)
Summary: ${sentiment.summary}` : "Social Sentiment: N/A"}

30-DAY PRICE HISTORY (CLOSE):
${simplifiedData}

CRITICAL RULES (FOLLOW STRICTLY):
- NEVER recommend "Buy" in a clear downtrend or lower-high pattern.
- REQUIREMENT FOR "Buy": You must identify a precise Entry point ($X), a Stop-Loss ($Y), and a Take-Profit ($Z).
- 3:1 RISK/REWARD RULE: The expected profit ($Z - $X) MUST be at least 3 times greater than the expected risk ($X - $Y). If the mathematical ratio is < 3.0, you MUST return "Hold" or "Sell".
- Do not be overly optimistic. Default to "Hold" if conditions are not perfect.

OUTPUT FORMAT INSTRUCTIONS:
Always respond with raw JSON only (no markdown). Ensure valid JSON.
{
  "trend": "(string) Short objective statement of current phase: Accumulation, Markup, Distribution, or Markdown.",
  "support_resistance": "(string) Identifiable technical levels.",
  "projection": "(string) Briefly explain the setup, entry trigger, and why the 3:1 ratio was met or failed.",
  "recommendation": "(string) Exactly one of: Buy, Sell, Hold",
  "conviction_score": (number) 1-10,
  "stop_loss": (number or null) Required if "Buy".,
  "take_profit": (number or null) Required if "Buy".,
  "price_range_low": (number) Next 5 days.,
  "price_range_high": (number) Next 5 days.
}
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
        return Response.json({ ...analysis, debug_prompt: displayPrompt, used_model: usedModel });

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

Attempted Prompt (Senior Quant Mode): ...`
        };

        return Response.json(mockAnalysis);
    }
};
