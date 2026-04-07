"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
    TrendingUp, TrendingDown, DollarSign, BarChart2,
    RefreshCw, CheckCircle2, XCircle, Clock, Minus
} from "lucide-react";

interface PaperTrade {
    id: string;
    ticker: string;
    entry_price: number;
    take_profit: number | null;
    stop_loss: number | null;
    shares_held: number;
    notional_value: number;
    status: "open" | "closed_win" | "closed_loss" | "expired";
    exit_price: number | null;
    pnl_dollars: number | null;
    pnl_percent: number | null;
    opened_at: string;
    closed_at: string | null;
}

interface PortfolioSummary {
    total_trades: number;
    open_positions: number;
    closed_positions: number;
    wins: number;
    losses: number;
    win_rate_pct: string | null;
    total_pnl_dollars: string | null;
    total_return_pct: string | null;
    best_trade: { ticker: string; pnl_pct: number } | null;
}

const statusConfig = {
    open: { color: "text-solarized-blue bg-solarized-blue/10 border-solarized-blue/20", icon: <Clock className="h-3.5 w-3.5" />, label: "Open" },
    closed_win: { color: "text-solarized-green bg-solarized-green/10 border-solarized-green/20", icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Win" },
    closed_loss: { color: "text-solarized-red bg-solarized-red/10 border-solarized-red/20", icon: <XCircle className="h-3.5 w-3.5" />, label: "Loss" },
    expired: { color: "text-foreground/40 bg-foreground/5 border-foreground/10", icon: <Minus className="h-3.5 w-3.5" />, label: "Expired" },
};

function StatCard({ label, value, sub, color = "text-foreground" }: {
    label: string; value: string | null; sub?: string; color?: string;
}) {
    return (
        <div className="glass-card p-4 flex flex-col gap-1 border-foreground/5 bg-foreground/5">
            <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">{label}</p>
            <p className={`text-2xl font-black font-mono ${color}`}>{value ?? "—"}</p>
            {sub && <p className="text-xs text-foreground/30 font-medium">{sub}</p>}
        </div>
    );
}

export default function PaperPortfolio() {
    const [summary, setSummary] = useState<PortfolioSummary | null>(null);
    const [openTrades, setOpenTrades] = useState<PaperTrade[]>([]);
    const [closedTrades, setClosedTrades] = useState<PaperTrade[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPortfolio = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/paper-portfolio");
            setSummary(res.data.summary);
            setOpenTrades(res.data.open_trades ?? []);
            setClosedTrades(res.data.closed_trades ?? []);
        } catch (e) {
            console.error("Failed to fetch portfolio", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPortfolio(); }, []);

    const fmt = (n: number | null | undefined, prefix = "$") =>
        n != null ? `${prefix}${Number(n).toFixed(2)}` : "—";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-solarized-green/10 rounded-xl text-solarized-green">
                        <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Paper Portfolio</h2>
                        <p className="text-xs text-foreground/40 font-medium uppercase tracking-wide">Simulated Trades ($1,000/position)</p>
                    </div>
                </div>
                <button
                    onClick={fetchPortfolio}
                    disabled={loading}
                    className="p-2 bg-foreground/5 hover:bg-foreground/10 text-foreground/40 border border-foreground/10 rounded-xl transition shadow-sm"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* Stats Bar */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard
                        label="Total Return"
                        value={summary.total_return_pct != null ? `${summary.total_return_pct}%` : null}
                        color={parseFloat(summary.total_return_pct ?? "0") >= 0 ? "text-solarized-green" : "text-solarized-red"}
                        sub={`P&L: $${summary.total_pnl_dollars ?? "0.00"}`}
                    />
                    <StatCard
                        label="Win Rate"
                        value={summary.win_rate_pct != null ? `${summary.win_rate_pct}%` : null}
                        sub={`${summary.wins}W / ${summary.losses}L`}
                        color="text-solarized-violet"
                    />
                    <StatCard
                        label="Open Positions"
                        value={String(summary.open_positions)}
                        sub={`${summary.total_trades} total trades`}
                        color="text-solarized-blue"
                    />
                    <StatCard
                        label="Best Trade"
                        value={summary.best_trade ? `${Number(summary.best_trade.pnl_pct).toFixed(1)}%` : null}
                        sub={summary.best_trade?.ticker ?? "—"}
                        color="text-solarized-cyan"
                    />
                </div>
            )}

            {/* Open Positions */}
            {openTrades.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-foreground/40 uppercase tracking-wider flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-solarized-blue" /> Open Positions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {openTrades.map(trade => (
                            <motion.div
                                key={trade.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-4 border-l-4 border-l-solarized-blue border-foreground/5 bg-foreground/5"
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-black text-lg text-foreground">{trade.ticker}</span>
                                    <span className="text-[10px] px-2 py-1 rounded-full border text-solarized-blue bg-solarized-blue/10 border-solarized-blue/20 font-bold uppercase tracking-widest">Open</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-foreground/5 p-2 rounded-lg border border-foreground/5">
                                        <p className="text-[10px] text-foreground/40 uppercase font-bold tracking-tighter mb-1">Entry</p>
                                        <p className="text-sm font-mono font-bold text-foreground/60">{fmt(trade.entry_price)}</p>
                                    </div>
                                    <div className="bg-solarized-green/10 p-2 rounded-lg border border-solarized-green/20">
                                        <p className="text-[10px] text-solarized-green/70 uppercase font-bold tracking-tighter mb-1">TP</p>
                                        <p className="text-sm font-mono font-bold text-solarized-green">{fmt(trade.take_profit)}</p>
                                    </div>
                                    <div className="bg-solarized-red/10 p-2 rounded-lg border border-solarized-red/20">
                                        <p className="text-[10px] text-solarized-red/70 uppercase font-bold tracking-tighter mb-1">SL</p>
                                        <p className="text-sm font-mono font-bold text-solarized-red">{fmt(trade.stop_loss)}</p>
                                    </div>
                                </div>
                                <p className="text-[10px] text-foreground/30 mt-2 font-mono">{trade.shares_held.toFixed(4)} shares @ {fmt(trade.notional_value)} notional</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Closed Trades */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground/40 uppercase tracking-wider flex items-center gap-2">
                    {closedTrades.some(t => t.status === 'closed_win') ? <TrendingUp className="h-4 w-4 text-solarized-green" /> : <TrendingDown className="h-4 w-4 text-solarized-red" />}
                    Closed Trades
                </h3>
                {closedTrades.length === 0 && !loading && (
                    <div className="p-8 bg-foreground/5 border border-dashed border-foreground/10 rounded-2xl text-center text-foreground/30 font-medium">
                        No closed trades yet. Buy signals will auto-paper-trade at $1,000 per position.
                    </div>
                )}
                <div className="hidden md:block overflow-auto rounded-3xl border border-foreground/10 bg-foreground/5 backdrop-blur-xl">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] uppercase bg-foreground/5 text-foreground/40 sticky top-0 font-black tracking-widest border-b border-foreground/10">
                            <tr>
                                <th className="px-5 py-4">Ticker</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4 text-right">Entry</th>
                                <th className="px-5 py-4 text-right">Exit</th>
                                <th className="px-5 py-4 text-right">P&L $</th>
                                <th className="px-5 py-4 text-right">P&L %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-foreground/5 text-xs text-foreground/60">
                            {closedTrades.map(trade => {
                                const cfg = statusConfig[trade.status] ?? statusConfig.expired;
                                const pnlPositive = (trade.pnl_dollars ?? 0) >= 0;
                                return (
                                    <tr key={trade.id} className="hover:bg-foreground/5 transition">
                                        <td className="px-5 py-4 font-black text-foreground">{trade.ticker}</td>
                                        <td className="px-5 py-4">
                                            <span className={`flex items-center gap-1.5 w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${cfg.color}`}>
                                                {cfg.icon} {cfg.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono text-foreground/30">{fmt(trade.entry_price)}</td>
                                        <td className="px-5 py-4 text-right font-mono text-foreground/60">{fmt(trade.exit_price)}</td>
                                        <td className={`px-5 py-4 text-right font-mono font-black ${pnlPositive ? "text-solarized-green" : "text-solarized-red"}`}>
                                            {trade.pnl_dollars != null ? `${pnlPositive ? "+" : ""}$${Number(trade.pnl_dollars).toFixed(2)}` : "—"}
                                        </td>
                                        <td className={`px-5 py-4 text-right font-mono font-black ${pnlPositive ? "text-solarized-green" : "text-solarized-red"}`}>
                                            {trade.pnl_percent != null ? `${pnlPositive ? "+" : ""}${Number(trade.pnl_percent).toFixed(2)}%` : "—"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
