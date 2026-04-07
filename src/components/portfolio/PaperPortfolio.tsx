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
    open: { color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: <Clock className="h-3.5 w-3.5" />, label: "Open" },
    closed_win: { color: "text-green-400 bg-green-500/10 border-green-500/20", icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Win" },
    closed_loss: { color: "text-red-400 bg-red-500/10 border-red-500/20", icon: <XCircle className="h-3.5 w-3.5" />, label: "Loss" },
    expired: { color: "text-gray-400 bg-gray-500/10 border-gray-500/20", icon: <Minus className="h-3.5 w-3.5" />, label: "Expired" },
};

function StatCard({ label, value, sub, color = "text-white" }: {
    label: string; value: string | null; sub?: string; color?: string;
}) {
    return (
        <div className="glass-card p-4 rounded-2xl flex flex-col gap-1">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
            <p className={`text-2xl font-black font-mono ${color}`}>{value ?? "—"}</p>
            {sub && <p className="text-xs text-gray-600 font-medium">{sub}</p>}
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
                    <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                        <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-100">Paper Portfolio</h2>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Simulated Trades ($1,000/position)</p>
                    </div>
                </div>
                <button
                    onClick={fetchPortfolio}
                    disabled={loading}
                    className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10 rounded-xl transition"
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
                        color={parseFloat(summary.total_return_pct ?? "0") >= 0 ? "text-green-400" : "text-red-400"}
                        sub={`P&L: $${summary.total_pnl_dollars ?? "0.00"}`}
                    />
                    <StatCard
                        label="Win Rate"
                        value={summary.win_rate_pct != null ? `${summary.win_rate_pct}%` : null}
                        sub={`${summary.wins}W / ${summary.losses}L`}
                        color="text-purple-400"
                    />
                    <StatCard
                        label="Open Positions"
                        value={String(summary.open_positions)}
                        sub={`${summary.total_trades} total trades`}
                        color="text-blue-400"
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
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-blue-400" /> Open Positions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {openTrades.map(trade => (
                            <motion.div
                                key={trade.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-4 rounded-2xl border-l-4 border-l-blue-400"
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-black text-lg text-gray-100">{trade.ticker}</span>
                                    <span className="text-[10px] px-2 py-1 rounded-full border text-blue-400 bg-blue-500/10 border-blue-500/20 font-bold uppercase">Open</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Entry</p>
                                        <p className="text-sm font-mono font-bold text-gray-300">{fmt(trade.entry_price)}</p>
                                    </div>
                                    <div className="bg-green-500/10 p-2 rounded-lg border border-green-500/20">
                                        <p className="text-[10px] text-green-500/70 uppercase font-bold">TP</p>
                                        <p className="text-sm font-mono font-bold text-green-400">{fmt(trade.take_profit)}</p>
                                    </div>
                                    <div className="bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                        <p className="text-[10px] text-red-500/70 uppercase font-bold">SL</p>
                                        <p className="text-sm font-mono font-bold text-red-400">{fmt(trade.stop_loss)}</p>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-600 mt-2 font-mono">{trade.shares_held.toFixed(4)} shares @ {fmt(trade.notional_value)} notional</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Closed Trades */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    {closedTrades.some(t => t.status === 'closed_win') ? <TrendingUp className="h-4 w-4 text-green-400" /> : <TrendingDown className="h-4 w-4 text-red-400" />}
                    Closed Trades
                </h3>
                {closedTrades.length === 0 && !loading && (
                    <div className="p-8 bg-white/5 border border-dashed border-white/10 rounded-2xl text-center text-gray-500 font-medium">
                        No closed trades yet. Buy signals will auto-paper-trade at $1,000 per position.
                    </div>
                )}
                <div className="hidden md:block overflow-auto rounded-2xl border border-white/10 bg-black/20">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-white/5 text-gray-500 sticky top-0 font-bold border-b border-white/10">
                            <tr>
                                <th className="px-4 py-3">Ticker</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Entry</th>
                                <th className="px-4 py-3 text-right">Exit</th>
                                <th className="px-4 py-3 text-right">P&L $</th>
                                <th className="px-4 py-3 text-right">P&L %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {closedTrades.map(trade => {
                                const cfg = statusConfig[trade.status] ?? statusConfig.expired;
                                const pnlPositive = (trade.pnl_dollars ?? 0) >= 0;
                                return (
                                    <tr key={trade.id} className="hover:bg-white/5 transition">
                                        <td className="px-4 py-3 font-black text-gray-200">{trade.ticker}</td>
                                        <td className="px-4 py-3">
                                            <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
                                                {cfg.icon} {cfg.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-gray-400">{fmt(trade.entry_price)}</td>
                                        <td className="px-4 py-3 text-right font-mono text-gray-300">{fmt(trade.exit_price)}</td>
                                        <td className={`px-4 py-3 text-right font-mono font-bold ${pnlPositive ? "text-green-400" : "text-red-400"}`}>
                                            {trade.pnl_dollars != null ? `${pnlPositive ? "+" : ""}$${Number(trade.pnl_dollars).toFixed(2)}` : "—"}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-mono font-bold ${pnlPositive ? "text-green-400" : "text-red-400"}`}>
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
