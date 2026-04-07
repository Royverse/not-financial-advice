import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const NOTIONAL = 1000; // $1,000 per paper trade

export default async (req: Request) => {
    if (req.method !== 'GET') {
        return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
        const { data: trades, error } = await supabase
            .from('paper_trades')
            .select('*')
            .order('opened_at', { ascending: false });

        if (error) throw error;

        const open = trades?.filter(t => t.status === 'open') ?? [];
        const closed = trades?.filter(t => t.status !== 'open') ?? [];

        const wins = closed.filter(t => t.status === 'closed_win');
        const losses = closed.filter(t => t.status === 'closed_loss' || t.status === 'expired');
        const winRate = closed.length > 0 ? ((wins.length / closed.length) * 100).toFixed(1) : null;

        const totalPnl = closed.reduce((sum, t) => sum + (t.pnl_dollars ?? 0), 0);
        const totalInvested = (trades?.length ?? 0) * NOTIONAL;
        const totalReturn = totalInvested > 0 ? ((totalPnl / totalInvested) * 100).toFixed(2) : null;

        const bestTrade = closed.reduce((best, t) =>
            (t.pnl_percent ?? -Infinity) > (best?.pnl_percent ?? -Infinity) ? t : best, null as any);

        return Response.json({
            summary: {
                total_trades: trades?.length ?? 0,
                open_positions: open.length,
                closed_positions: closed.length,
                wins: wins.length,
                losses: losses.length,
                win_rate_pct: winRate,
                total_pnl_dollars: totalPnl.toFixed(2),
                total_return_pct: totalReturn,
                best_trade: bestTrade ? { ticker: bestTrade.ticker, pnl_pct: bestTrade.pnl_percent } : null,
            },
            open_trades: open,
            closed_trades: closed.slice(0, 20),
        });
    } catch (err: any) {
        return Response.json({ error: err.message }, { status: 500 });
    }
};
