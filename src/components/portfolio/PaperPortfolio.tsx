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

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

function StatCard({ label, value, sub, color = "text-white" }: {
    label: string; value: string | null; sub?: string; color?: string;
}) {
    return (
        <div className="glass-card p-4 rounded-xl flex flex-col gap-1">
            <p className="text-[9px] font-mono font-bold text-gray-600 uppercase tracking-[0.2em]">{label}</p>
            <p className={`text-xl font-black font-mono tabular-nums ${color}`}>{value ?? "—"}</p>
            {sub && <p className="text-[10px] text-gray-600 font-mono">{sub}</p>}
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
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-gray-600" />
                    <div>
                        <h2 className="text-sm font-bold text-gray-200 tracking-tight">Paper Portfolio</h2>
                        <p className="text-[9px] font-mono text-gray-600 uppercase tracking-[0.15em]">Simulated · $1,000/position</p>
                    </div>
                </div>
                <button
                    onClick={fetchPortfolio}
                    disabled={loading}
                    className="p-2 bg-white/[0.03] hover:bg-white/[0.05] text-gray-500 border border-white/[0.06] rounded-lg transition"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* Stats */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard
                        label="Total Return"
                        value={summary.total_return_pct != null ? `${summary.total_return_pct}%` : null}
                        color={parseFloat(summary.total_return_pct ?? "0") >= 0 ? "text-emerald-400" : "text-red-400"}
                        sub={`P&L: $${summary.total_pnl_dollars ?? "0.00"}`}
                    />
                    <StatCard
                        label="Win Rate"
                        value={summary.win_rate_pct != null ? `${summary.win_rate_pct}%` : null}
                        sub={`${summary.wins}W / ${summary.losses}L`}
                        color="text-indigo-300"
                    />
                    <StatCard
                        label="Open"
                        value={String(summary.open_positions)}
                        sub={`${summary.total_trades} total`}
                        color="text-gray-200"
                    />
                    <StatCard
                        label="Best Trade"
                        value={summary.best_trade ? `${Number(summary.best_trade.pnl_pct).toFixed(1)}%` : null}
                        sub={summary.best_trade?.ticker ?? "—"}
                        color="text-emerald-400"
                    />
                </div>
            )}

            {/* Open Positions */}
            {openTrades.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
                        <BarChart2 className="h-3.5 w-3.5 text-indigo-500/40" /> Open Positions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {openTrades.map(trade => (
                            <motion.div
                                key={trade.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease }}
                                className="glass-card p-4 rounded-xl border-l-2 border-l-indigo-500/40"
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-black text-base text-gray-200 font-mono">{trade.ticker}</span>
                                    <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold text-indigo-400/70 bg-indigo-500/[0.08] border border-indigo-500/10 uppercase tracking-wider">Open</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1.5 text-center">
                                    <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.03]">
                                        <p className="text-[8px] text-gray-600 uppercase font-mono font-bold tracking-wider">Entry</p>
                                        <p className="text-xs font-mono font-bold text-gray-300 tabular-nums">{fmt(trade.entry_price)}</p>
                                    </div>
                                    <div className="bg-emerald-500/[0.04] p-2 rounded-lg border border-emerald-500/10">
                                        <p className="text-[8px] text-emerald-500/50 uppercase font-mono font-bold tracking-wider">TP</p>
                                        <p className="text-xs font-mono font-bold text-emerald-400 tabular-nums">{fmt(trade.take_profit)}</p>
                                    </div>
                                    <div className="bg-red-500/[0.04] p-2 rounded-lg border border-red-500/10">
                                        <p className="text-[8px] text-red-500/50 uppercase font-mono font-bold tracking-wider">SL</p>
                                        <p className="text-xs font-mono font-bold text-red-400 tabular-nums">{fmt(trade.stop_loss)}</p>
                                    </div>
                                </div>
                                <p className="text-[9px] text-gray-600 mt-2 font-mono tabular-nums">{trade.shares_held.toFixed(4)} shares @ {fmt(trade.notional_value)} notional</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Closed Trades */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
                    <TrendingDown className="h-3.5 w-3.5 text-gray-600" /> Closed Trades
                </h3>
                {closedTrades.length === 0 && !loading && (
                    <div className="p-8 bg-white/[0.02] border border-dashed border-white/[0.06] rounded-xl text-center text-gray-600 font-mono text-xs">
                        No closed trades yet. Buy signals auto-paper-trade at $1,000/position.
                    </div>
                )}
                <div className="hidden md:block overflow-auto rounded-xl border border-white/[0.04] bg-white/[0.01]">
                    <table className="w-full text-xs text-left">
                        <thead className="text-[9px] uppercase bg-white/[0.02] text-gray-600 font-mono sticky top-0 font-bold border-b border-white/[0.04] tracking-[0.15em]">
                            <tr>
                                <th className="px-4 py-2.5">Ticker</th>
                                <th className="px-4 py-2.5">Status</th>
                                <th className="px-4 py-2.5 text-right">Entry</th>
                                <th className="px-4 py-2.5 text-right">Exit</th>
                                <th className="px-4 py-2.5 text-right">P&L $</th>
                                <th className="px-4 py-2.5 text-right">P&L %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {closedTrades.map(trade => {
                                const pnlPositive = (trade.pnl_dollars ?? 0) >= 0;
                                return (
                                    <tr key={trade.id} className="hover:bg-white/[0.02] transition">
                                        <td className="px-4 py-2.5 font-black text-gray-300 font-mono">{trade.ticker}</td>
                                        <td className="px-4 py-2.5">
                                            <span className={`flex items-center gap-1 w-fit px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                                trade.status === 'closed_win' ? 'text-emerald-400/70 bg-emerald-500/[0.06]' :
                                                trade.status === 'closed_loss' ? 'text-red-400/70 bg-red-500/[0.06]' :
                                                'text-gray-500 bg-white/[0.03]'
                                            }`}>
                                                {trade.status === 'closed_win' ? 'WIN' : trade.status === 'closed_loss' ? 'LOSS' : 'EXP'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono text-gray-500 tabular-nums">{fmt(trade.entry_price)}</td>
                                        <td className="px-4 py-2.5 text-right font-mono text-gray-400 tabular-nums">{fmt(trade.exit_price)}</td>
                                        <td className={`px-4 py-2.5 text-right font-mono font-bold tabular-nums ${pnlPositive ? "text-emerald-400" : "text-red-400"}`}>
                                            {trade.pnl_dollars != null ? `${pnlPositive ? "+" : ""}$${Number(trade.pnl_dollars).toFixed(2)}` : "—"}
                                        </td>
                                        <td className={`px-4 py-2.5 text-right font-mono font-bold tabular-nums ${pnlPositive ? "text-emerald-400" : "text-red-400"}`}>
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
