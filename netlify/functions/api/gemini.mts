import { AIService, AIEngine } from '../../../src/lib/services/ai';

export default async (req: Request) => {
    if (req.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    let tickerString = "";
    let sentiment: any = null;
    let data: any = null;
    let engine: AIEngine = 'auto';

    try {
        const body = await req.json();
        tickerString = body.ticker;
        sentiment = body.sentiment;
        data = body.data;
        if (body.engine) engine = body.engine as AIEngine;

        console.log(`[AI Pipeline] Processing ticker: ${tickerString} via engine: ${engine}`);

        if (!tickerString || !data) {
            console.error('[Gemini Pipeline] Missing ticker or price data in request body');
            return Response.json({ error: 'Ticker and data are required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('[Gemini Pipeline] FATAL: GEMINI_API_KEY is not defined in the environment.');
            throw new Error('CONFIG_ERROR: GEMINI_API_KEY missing');
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
SYSTEM: You are a Senior Quantitative Analyst and Wyckoff Market Structure Specialist.
Your mandate: identify asymmetric risk-reward opportunities with surgical precision.
Cognitive bias is your enemy. Default to HOLD unless every gate below is passed.

═══════════════════════════════════════════════
SUBJECT: ${tickerString}
═══════════════════════════════════════════════

${sentiment ? `SOCIAL SENTIMENT SIGNAL (XPOZ):
  Sentiment : ${sentiment.sentiment}
  Confidence: ${(sentiment.score * 100).toFixed(0)}%
  Summary   : ${sentiment.summary}
  Evidence  : ${sentiment.evidence?.join('; ') || 'N/A'}
` : "SOCIAL SENTIMENT SIGNAL: Unavailable — treat as neutral."}

30-DAY CLOSING PRICES (Most recent first):
${simplifiedData}

═══════════════════════════════════════════════
ANALYSIS FRAMEWORK — EXECUTE IN ORDER
═══════════════════════════════════════════════

STEP 1 — WYCKOFF PHASE IDENTIFICATION
Classify the current market phase. You must pick exactly one:
  [AC]  Accumulation     – Ranging low after markdown; smart money absorbing supply.
  [MU]  Markup           – Impulsive higher highs/lows; trend confirmed.
  [DI]  Distribution     – Ranging high after markup; smart money distributing.
  [MD]  Markdown         – Impulsive lower highs/lows; trend confirmed bearish.
  [SP]  Spring/Shakeout  – False breakdown below Accumulation support; bullish trap.
  [UT]  UTAD             – False breakout above Distribution resistance; bearish trap.
Evidence required: cite at least 2 specific price observations from the data.

STEP 2 — VOLUME PROFILE INFERENCE
You do not have explicit volume data. Infer volume profile structure from price clustering:
  - Point of Control (POC): The price level where candles have spent the most TIME (most dates clustered near this price).
  - Value Area High (VAH): Upper boundary of the high-frequency price zone.
  - Value Area Low (VAL): Lower boundary of the high-frequency price zone.
  - Low Volume Nodes (LVN): Price gaps or areas of rapid price traversal (few dates near this price).
State these levels explicitly and flag if current price is INSIDE or OUTSIDE the Value Area.

STEP 3 — CONVICTION SCORING (MANDATORY MATH)
Score each component 0–10, then apply weights:

  A. Trend Alignment       (weight: 0.30) — Does price action confirm the Wyckoff phase?
  B. Risk/Reward Ratio     (weight: 0.25) — How far above 3.0 is the R/R? (3.0 = 5, 4.0 = 7, 5.0+ = 10)
  C. Wyckoff Confirmation  (weight: 0.20) — How clearly defined is the phase? (Ambiguous = 1, Clear = 10)
  D. Sentiment Delta       (weight: 0.15) — Does social sentiment CONFIRM price structure? (Conflict = 1, Alignment = 10, No data = 5)
  E. Momentum Quality      (weight: 0.10) — Is the most recent 5-day price action impulsive or corrective?

  Weighted Score = (A×0.30) + (B×0.25) + (C×0.20) + (D×0.15) + (E×0.10)
  Round to 1 decimal. This IS the conviction_score field.

STEP 4 — BUY GATE (ALL MUST PASS FOR "Buy" RECOMMENDATION)
  Gate 1 | Wyckoff Phase must be [AC], [MU], or [SP] only.
  Gate 2 | Risk/Reward: (Take_Profit − Entry) ÷ (Entry − Stop_Loss) ≥ 3.0
  Gate 3 | Expected Value: EV = (0.45 × Reward_$) − (0.55 × Risk_$) > 0
           (Use 45% win probability as a conservative baseline.)
  Gate 4 | Current price must be at or BELOW the POC or VAL (buying value, not chasing).
  Gate 5 | Conviction Score ≥ 6.5
  If ANY gate fails, recommendation MUST be "Hold" or "Sell". State which gate(s) failed.

STEP 5 — INVALIDATION
Define the single price level that, if breached, invalidates the entire thesis.

═══════════════════════════════════════════════
OUTPUT — RESPOND WITH RAW JSON ONLY
No markdown. No code fences. No explanation outside the JSON.
═══════════════════════════════════════════════
{
  "wyckoff_phase": "(string) One of: Accumulation | Markup | Distribution | Markdown | Spring | UTAD",
  "wyckoff_evidence": "(string) 2 specific price observations justifying the phase classification.",
  "volume_profile_inference": {
    "poc": (number) Estimated Point of Control price,
    "vah": (number) Value Area High,
    "val": (number) Value Area Low,
    "price_vs_value_area": "(string) One of: Inside | Above | Below",
    "notable_lvn": "(string) Description of any significant Low Volume Node gap."
  },
  "trend": "(string) Objective one-sentence trend description including slope and momentum.",
  "support_resistance": "(string) Key technical levels with brief rationale.",
  "conviction_breakdown": {
    "trend_alignment":      { "score": (number 0-10), "rationale": "(string)" },
    "risk_reward_ratio":    { "score": (number 0-10), "rationale": "(string)" },
    "wyckoff_confirmation": { "score": (number 0-10), "rationale": "(string)" },
    "sentiment_delta":      { "score": (number 0-10), "rationale": "(string)" },
    "momentum_quality":     { "score": (number 0-10), "rationale": "(string)" },
    "weighted_total": (number) Final conviction score to 1 decimal place
  },
  "buy_gate_results": {
    "gate_1_wyckoff": (boolean),
    "gate_2_risk_reward": (boolean),
    "gate_3_expected_value": (boolean),
    "gate_4_price_vs_value": (boolean),
    "gate_5_conviction": (boolean),
    "all_passed": (boolean)
  },
  "entry": (number or null),
  "stop_loss": (number or null),
  "take_profit": (number or null),
  "risk_reward_ratio": (number or null) Calculated to 2 decimal places,
  "expected_value": (number or null) EV in dollars per share,
  "projection": "(string) Precise setup narrative: entry trigger, catalyst, and why EV is positive or why gates failed.",
  "recommendation": "(string) Exactly one of: Buy | Sell | Hold",
  "conviction_score": (number) Must exactly match conviction_breakdown.weighted_total,
  "invalidation_trigger": "(string) The specific price level and condition that kills the thesis.",
  "timeframe_bias": "(string) One of: Bearish | Neutral | Cautiously Bullish | Bullish",
  "price_range_low": (number) Conservative low for next 5 trading days,
  "price_range_high": (number) Conservative high for next 5 trading days
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

        const { text: aiText, model: usedModel, provider } = await AIService.generateContent(prompt, engine);
        // Clean up markdown code blocks if present
        const jsonString = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

        let analysis;
        try {
            analysis = JSON.parse(jsonString);
        } catch (e) {
            analysis = { raw: aiText };
        }

        // Attach the debug prompt for frontend display
        return Response.json({ ...analysis, debug_prompt: displayPrompt, used_model: usedModel, provider });

    } catch (error: any) {
        const errorMsg = error.response?.data?.error?.message || error.message || 'Unknown Error';
        console.error(`[AI Pipeline] Error during execution: ${errorMsg}`);
        
        if (error.response) {
            console.error(`[AI Pipeline] Status: ${error.response.status}`);
            console.error(`[AI Pipeline] Data:`, JSON.stringify(error.response.data));
        }

        // Fallback Mock Response
        const mockAnalysis = {
            trend: `(Mock) The stock ${tickerString} analysis failed. Error: ${errorMsg}. This fallback is active because the AI service returned an error.`,
            support_resistance: "Support at recent lows, Resistance at recent highs.",
            projection: "Projected to trade sideways with a bullish bias if market conditions improve.",
            recommendation: "Hold",
            conviction_score: 5,
            price_range_low: 100,
            price_range_high: 110,
            debug_prompt: `<<<ERROR: API Call Failed>>>
Error Details: ${errorMsg}

Attempted Prompt (Senior Quant Mode): ...`
        };

        return Response.json(mockAnalysis);
    }
};
