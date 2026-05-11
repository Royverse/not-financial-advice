import { supabase } from '../../../src/lib/services/supabase';
import { AIService } from '../../../src/lib/services/ai';
import axios from 'axios';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// Reusable helper (copied from route.ts)
async function checkAlphaVantageKey(apiKey: string, keyName: string) {
    try {
        const res = await axios.get('https://www.alphavantage.co/query', {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol: 'AAPL',
                apikey: apiKey
            },
            timeout: 10000
        });

        const data = res.data;
        if (data['Note']) {
            return { status: 'warning', message: `${keyName}: Rate limit (5/min)` };
        } else if (data['Information']) {
            return { status: 'warning', message: `${keyName}: Daily limit (25/day) reached` };
        } else if (data['Error Message']) {
            return { status: 'error', message: `${keyName}: Invalid key` };
        } else if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
            const price = data['Global Quote']['05. price'];
            return { status: 'healthy', message: `${keyName}: OK - AAPL $${parseFloat(price).toFixed(2)}` };
        } else {
            return { status: 'warning', message: `${keyName}: No data (market closed?)` };
        }
    } catch (e: any) {
        return { status: 'error', message: `${keyName}: ${e.message.substring(0, 30)}` };
    }
}

export default async (req: Request) => {
    const status: any = {
        timestamp: new Date().toISOString(),
        services: {
            supabase: { status: 'pending', message: '', tooltip: 'Database for storing scan results and recommendations' },
            alpha_vantage: { status: 'pending', message: '', tooltip: 'Market data provider (25 calls/day free)' },
            xpoz: { status: 'pending', message: '', tooltip: 'Xpoz: Real-time Twitter/X sentiment analysis. Scrapes social media for stock mentions, analyzes bullish/bearish keywords, and provides evidence tweets for transparency.' },
            gemini: { status: 'pending', message: '', tooltip: 'AI analysis engine (Gemini Flash Lite)' },
            cron_job: { status: 'pending', message: '', tooltip: 'Autonomous market scanner scheduler' },
        }
    };

    // 1. Check Supabase
    try {
        const { error } = await supabase.from('market_scans').select('count', { count: 'exact', head: true });
        if (error) throw error;
        status.services.supabase.status = 'healthy';
        status.services.supabase.message = 'Connected';
    } catch (e: any) {
        status.services.supabase.status = 'error';
        status.services.supabase.message = e.message.substring(0, 40);
    }

    // 2. Check Alpha Vantage
    if (ALPHA_VANTAGE_API_KEY) {
        const result1 = await checkAlphaVantageKey(ALPHA_VANTAGE_API_KEY, 'API');
        status.services.alpha_vantage.status = result1.status;
        status.services.alpha_vantage.message = result1.message;
    } else {
        status.services.alpha_vantage.status = 'error';
        status.services.alpha_vantage.message = 'Not configured';
    }

    // 3. Check Xpoz
    if (process.env.XPOZ_API_KEY) {
        status.services.xpoz.status = 'healthy';
        status.services.xpoz.message = 'API Key Configured';
    } else {
        status.services.xpoz.status = 'warning';
        status.services.xpoz.message = 'API Key Missing';
    }

    // 4. Check Gemini
    try {
        const { text, model } = await AIService.generateContent("ping", 'auto');
        status.services.gemini.status = 'healthy';
        status.services.gemini.message = `AI Engine online`;
    } catch (e: any) {
        const errMsg = e.message;
        if (errMsg.includes('quota') || errMsg.includes('429')) {
            status.services.gemini.status = 'warning';
            status.services.gemini.message = 'All models quota limited';
        } else {
            status.services.gemini.status = 'error';
            status.services.gemini.message = errMsg.substring(0, 40);
        }
    }

    // 5. Check Cron Job
    try {
        const { data: lastScan, error } = await supabase
            .from('market_scans')
            .select('created_at, status')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !lastScan) {
            status.services.cron_job.status = 'warning';
            status.services.cron_job.message = 'No scans yet';
        } else {
            const lastRunDate = new Date(lastScan.created_at);
            const now = new Date();
            const minutesAgo = Math.floor((now.getTime() - lastRunDate.getTime()) / (1000 * 60));
            const hoursAgo = Math.floor(minutesAgo / 60);
            let timeAgoStr = minutesAgo < 60 ? `${minutesAgo}m ago` : `${hoursAgo}h ago`;
            status.services.cron_job.status = minutesAgo < 60 ? 'healthy' : 'warning';
            status.services.cron_job.message = `Last: ${timeAgoStr} (${lastScan.status})`;
        }
    } catch (e: any) {
        status.services.cron_job.status = 'error';
        status.services.cron_job.message = 'Query failed';
    }

    return Response.json(status);
};
