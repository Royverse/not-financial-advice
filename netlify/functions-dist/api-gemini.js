import f from"axios";var _=["gemini-flash-latest","gemini-flash-lite-latest","gemini-pro-latest","gemma-3-27b-it"],s=class{static async generateContent(i){let e=process.env.GEMINI_API_KEY;if(!e)throw new Error("GEMINI_API_KEY is not defined");let o=null;for(let t of _)try{console.log(`[GeminiService] Attempting model: ${t}...`);let n=await f.post(`https://generativelanguage.googleapis.com/v1beta/models/${t}:generateContent?key=${e}`,{contents:[{parts:[{text:i}]}]},{timeout:3e4,headers:{"Content-Type":"application/json"}});if(n.data&&n.data.candidates&&n.data.candidates.length>0){let r=n.data.candidates[0].content.parts[0].text;return console.log(`[GeminiService] \u2705 Success with ${t}`),{text:r,model:t}}else console.warn(`[GeminiService] \u26A0\uFE0F ${t} returned no candidates.`)}catch(n){let r=n.response?.data?.error?.message||n.message,l=n.response?.status;console.warn(`[GeminiService] \u274C Failed with ${t}: ${l} - ${r.substring(0,100)}`),o=n}throw new Error(`All Gemini models failed. Last error: ${o?.message||"Unknown error"}`)}};var R=async a=>{if(a.method!=="POST")return Response.json({error:"Method not allowed"},{status:405});let i="",e=null,o=null;try{let t=await a.json();if(i=t.ticker,e=t.sentiment,o=t.data,!i||!o)return Response.json({error:"Ticker and data are required"},{status:400});let n=o["Time Series (Daily)"],r=Object.entries(n).slice(0,30).map(([m,S])=>`${m}: ${S["4. close"]}`).join(`
`),l=e?`
Social Sentiment Analysis (from XPOZ):
- Overall Sentiment: ${e.sentiment} (Confidence: ${(e.score*100).toFixed(0)}%)
- Summary: ${e.summary}
- Evidence: ${e.evidence?.join("; ")||"N/A"}
        `:"No social sentiment data available.",p=`
ANALYZE: ${i}
GOAL: Maximize ROI focusing on asymmetric risk-reward. Capital preservation is priority one.

CONTEXT:
${e?`Social Sentiment: ${e.sentiment} (${(e.score*100).toFixed(0)}% Confidence)
Summary: ${e.summary}`:"Social Sentiment: N/A"}

30-DAY PRICE HISTORY (CLOSE):
${r}

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
`,u=e?`
<social_sentiment>
- Overall Sentiment: <<<${e.sentiment}>>> (Confidence: <<<${(e.score*100).toFixed(0)}%>>>)
- Summary: <<<${e.summary}>>>
- Evidence: <<<${e.evidence?.join("; ")||"N/A"}>>>
</social_sentiment>`:"<social_sentiment>No social sentiment data available.</social_sentiment>",y=`
Role: You are a Senior Quantitative Analyst. Analyze the provided stock data for <<<${i}>>> with 95% objectivity.

Context & Data:
${u}

<price_history_30d>
<<<${r.substring(0,200)}...>>> [truncated]
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
`,{text:d,model:h}=await s.generateContent(p),g=d.replace(/```json/g,"").replace(/```/g,"").trim(),c;try{c=JSON.parse(g)}catch{c={raw:d}}return Response.json({...c,debug_prompt:y,used_model:h})}catch(t){console.error("Gemini API Error:",t.response?.data||t.message);let n={trend:`(Mock) The stock ${i} has shown volatility over the last 30 days. This is a fallback response as the AI API is currently rate-limited or unavailable.`,support_resistance:"Support at recent lows, Resistance at recent highs.",projection:"Projected to trade sideways with a bullish bias if market conditions improve.",recommendation:"Hold",conviction_score:5,price_range_low:100,price_range_high:110,debug_prompt:`<<<ERROR: API Call Failed>>>

Attempted Prompt (Senior Quant Mode): ...`};return Response.json(n)}};export{R as default};
//# sourceMappingURL=api-gemini.js.map
