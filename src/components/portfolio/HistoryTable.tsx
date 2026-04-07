"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { History, RefreshCw, CheckCircle2, XCircle, Clock, Download, Filter, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface HistoryRecord {
    id: number;
    ticker: string;
    recommendation: string;
    conviction_score: number | null;
    rec_price: number | null;
    actual_outcome: number | null;
    is_correct: boolean | null;
    created_at: string;
    validation_date: string | null;
}

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function HistoryTable() {
    const [records, setRecords] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const url = filter ? `/api/history?ticker=${filter}` : "/api/history";
            const res = await axios.get(url);
            setRecords(res.data.data || []);
        } catch (e) {
            console.error("Failed to fetch history", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHistory(); }, [filter]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getResultIcon = (record: HistoryRecord) => {
        if (record.is_correct === null) return <Clock className="h-3.5 w-3.5 text-gray-600" />;
        return record.is_correct
            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/60" />
            : <XCircle className="h-3.5 w-3.5 text-red-400/60" />;
    };

    const getRecIcon = (rec: string) => {
        switch (rec) {
            case 'Buy': return <TrendingUp className="h-3 w-3" />;
            case 'Sell': return <TrendingDown className="h-3 w-3" />;
            default: return <Minus className="h-3 w-3" />;
        }
    };

    const uniqueTickers = [...new Set(records.map(r => r.ticker))];

    const handleExport = () => { window.location.href = '/api/export'; };

    const getPnl = (record: HistoryRecord) => {
        if (!record.rec_price || !record.actual_outcome) return null;
        const rawPct = ((record.actual_outcome - record.rec_price) / record.rec_price) * 100;
        return record.recommendation === 'Sell' ? -rawPct : rawPct;
    };

    return (
        <div className="glass-card rounded-2xl p-4 md:p-5 h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 shrink-0">
                <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-gray-600" />
                    <div>
                        <h2 className="text-sm font-bold text-gray-200 tracking-tight">Analysis History</h2>
                        <p className="text-[9px] font-mono text-gray-600 uppercase tracking-[0.15em]">Track Record</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="appearance-none bg-white/[0.03] border border-white/[0.06] text-gray-400 text-xs font-mono rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 w-full"
                        >
                            <option value="">All</option>
                            {uniqueTickers.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-600 pointer-events-none" />
                    </div>

                    <button
                        onClick={handleExport}
                        className="px-3 py-2 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.1] text-emerald-400/70 border border-emerald-500/10 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1.5 tracking-wider uppercase"
                    >
                        <Download className="h-3 w-3" />
                        <span className="hidden sm:inline">Export</span>
                    </button>

                    <button
                        onClick={fetchHistory}
                        disabled={loading}
                        className="p-2 bg-white/[0.03] hover:bg-white/[0.05] text-gray-500 border border-white/[0.06] rounded-lg transition"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Desktop Table */}
            <div className="flex-1 overflow-auto rounded-xl border border-white/[0.04] bg-white/[0.01] custom-scrollbar hidden md:block">
                <table className="w-full text-xs text-left">
                    <thead className="text-[9px] uppercase bg-white/[0.02] text-gray-600 sticky top-0 z-10 font-mono font-bold tracking-[0.15em] border-b border-white/[0.04]">
                        <tr>
                            <th className="px-4 py-2.5">Ticker</th>
                            <th className="px-4 py-2.5">Date</th>
                            <th className="px-4 py-2.5">Verdict</th>
                            <th className="px-4 py-2.5">Conviction</th>
                            <th className="px-4 py-2.5 text-center">Entry</th>
                            <th className="px-4 py-2.5 text-center">Outcome</th>
                            <th className="px-4 py-2.5 text-center">Result</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {records.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-600 font-mono text-xs">
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <RefreshCw className="h-3 w-3 animate-spin" /> Loading...
                                        </div>
                                    ) : (
                                        "No analysis history found."
                                    )}
                                </td>
                            </tr>
                        ) : (
                            records.map((record) => (
                                <tr key={record.id} className="hover:bg-white/[0.02] transition">
                                    <td className="px-4 py-2.5">
                                        <span className="font-black text-gray-300 font-mono">{record.ticker}</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-gray-600 text-[10px] font-mono tabular-nums">
                                        {formatDate(record.created_at)}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className={`flex items-center gap-1 w-fit px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider ${
                                            record.recommendation === 'Buy' ? 'bg-emerald-500/[0.08] text-emerald-400/80' :
                                            record.recommendation === 'Sell' ? 'bg-red-500/[0.08] text-red-400/80' :
                                            'bg-amber-500/[0.08] text-amber-400/80'
                                        }`}>
                                            {getRecIcon(record.recommendation)}
                                            {record.recommendation.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        {record.conviction_score ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-14 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500/50 rounded-full"
                                                        style={{ width: `${Math.min((record.conviction_score ?? 0) * 10, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-mono font-bold text-gray-500 tabular-nums">{record.conviction_score}/10</span>
                                            </div>
                                        ) : <span className="text-gray-700 font-mono">—</span>}
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-gray-500 text-center tabular-nums">
                                        {record.rec_price ? `$${parseFloat(String(record.rec_price)).toFixed(2)}` : '—'}
                                    </td>
                                    <td className="px-4 py-2.5 font-mono font-bold text-gray-300 text-center tabular-nums">
                                        {record.actual_outcome ? `$${parseFloat(String(record.actual_outcome)).toFixed(2)}` : '—'}
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {getResultIcon(record)}
                                            {(() => {
                                                const pnl = getPnl(record);
                                                if (pnl === null) return null;
                                                return (
                                                    <span className={`text-[10px] font-mono font-bold tabular-nums ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(1)}%
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="flex-1 overflow-auto space-y-2 md:hidden custom-scrollbar pb-20">
                {records.length === 0 ? (
                    <div className="text-center py-12 text-gray-600 font-mono text-xs">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <RefreshCw className="h-3 w-3 animate-spin" /> Loading...
                            </div>
                        ) : (
                            "No analysis history found."
                        )}
                    </div>
                ) : (
                    records.map((record) => {
                        const pnl = getPnl(record);
                        return (
                            <motion.div
                                key={record.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease }}
                                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-sm text-gray-300 font-mono">{record.ticker}</span>
                                        <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                            record.recommendation === 'Buy' ? 'bg-emerald-500/[0.08] text-emerald-400/80' :
                                            record.recommendation === 'Sell' ? 'bg-red-500/[0.08] text-red-400/80' :
                                            'bg-amber-500/[0.08] text-amber-400/80'
                                        }`}>
                                            {getRecIcon(record.recommendation)}
                                            {record.recommendation.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {getResultIcon(record)}
                                        {pnl !== null && (
                                            <span className={`text-xs font-mono font-bold tabular-nums ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {pnl >= 0 ? '+' : ''}{pnl.toFixed(1)}%
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-1.5 text-center">
                                    <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.03]">
                                        <p className="text-[8px] text-gray-600 uppercase font-mono font-bold tracking-wider">Entry</p>
                                        <p className="text-xs font-mono font-bold text-gray-400 tabular-nums">
                                            {record.rec_price ? `$${parseFloat(String(record.rec_price)).toFixed(2)}` : '—'}
                                        </p>
                                    </div>
                                    <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.03]">
                                        <p className="text-[8px] text-gray-600 uppercase font-mono font-bold tracking-wider">Current</p>
                                        <p className="text-xs font-mono font-bold text-gray-300 tabular-nums">
                                            {record.actual_outcome ? `$${parseFloat(String(record.actual_outcome)).toFixed(2)}` : '—'}
                                        </p>
                                    </div>
                                    <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.03]">
                                        <p className="text-[8px] text-gray-600 uppercase font-mono font-bold tracking-wider">Conv</p>
                                        <p className="text-xs font-mono font-bold text-indigo-300 tabular-nums">
                                            {record.conviction_score ? `${record.conviction_score}/10` : '—'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[9px] text-gray-600 font-mono">
                                    <span className="tabular-nums">{formatDate(record.created_at)}</span>
                                    {record.conviction_score && (
                                        <div className="w-16 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500/40 rounded-full"
                                                style={{ width: `${Math.min(record.conviction_score * 10, 100)}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
