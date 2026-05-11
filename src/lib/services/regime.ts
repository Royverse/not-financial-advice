import axios from 'axios';
import { AIService } from './ai';
import { supabase } from './supabase';

export interface MarketRegime {
    regime: 'Bullish' | 'Bearish' | 'Volatile' | 'Choppy' | 'Unknown';
    sentiment: string;
    riskTolerance: 'Low' | 'Medium' | 'High';
    bias: 'Long Only' | 'Short Bias' | 'Neutral';
    description: string;
    updatedAt: string;
}

export class RegimeService {
    private static readonly MACRO_TICKERS = ['SPY', 'QQQ'];

    static async getRegime(): Promise<MarketRegime> {
        // 1. Check Cache (Only run macro analysis once every 4 hours)
        const { data: cached } = await supabase
            .from('market_scans')
            .select('metadata')
            .eq('scan_type', 'macro_regime')
            .order('created_at', { ascending: false })
            .limit(1);

        if (cached && cached[0]?.metadata) {
            const age = Date.now() - new Date(cached[0].metadata.updatedAt).getTime();
            if (age < 4 * 60 * 60 * 1000) {
                console.log('[RegimeService] Using cached macro regime.');
                return cached[0].metadata;
            }
        }

        // 2. Fetch Macro Data
        const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
        const macroData: any = {};

        for (const ticker of this.MACRO_TICKERS) {
            try {
                const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`;
                const response = await axios.get(url);
                const quote = response.data['Global Quote'];
                if (quote) {
                    macroData[ticker] = {
                        price: quote['05. price'],
                        change: quote['09. change'],
                        changePercent: quote['10. change percent']
                    };
                }
            } catch (e) {
                console.warn(`[RegimeService] Failed to fetch ${ticker}:`, e);
            }
        }

        // 3. DeepSeek R1 Quantitative Reasoning
        const prompt = `
SYSTEM: You are a Macro Strategist for a Quantitative Trading Desk.
Analyze the following market indicators and classify the current Market Regime.
Respond in RAW JSON ONLY.

MARKET INDICATORS:
${JSON.stringify(macroData, null, 2)}

OUTPUT FORMAT:
{
  "regime": "Bullish" | "Bearish" | "Volatile" | "Choppy",
  "riskTolerance": "Low" | "Medium" | "High",
  "bias": "Long Only" | "Short Bias" | "Neutral",
  "description": "Brief explanation of the current market state",
  "updatedAt": "${new Date().toISOString()}"
}
`;

        try {
            console.log('[RegimeService] Requesting Macro Analysis from DeepSeek R1...');
            const { text } = await AIService.generateContent(prompt, 'openrouter');
            const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const regime = JSON.parse(jsonString) as MarketRegime;

            // 4. Cache to Supabase
            await supabase.from('market_scans').insert([{
                scan_type: 'macro_regime',
                status: 'completed',
                metadata: regime
            }]);

            return regime;
        } catch (e: any) {
            console.error('[RegimeService] AI Analysis failed:', e.message);
            return {
                regime: 'Unknown',
                sentiment: 'Neutral',
                riskTolerance: 'Medium',
                bias: 'Neutral',
                description: 'Failed to analyze macro state. Defaulting to Neutral.',
                updatedAt: new Date().toISOString()
            };
        }
    }
}
