"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { History, RefreshCw, CheckCircle2, XCircle, Clock, Download, Filter, TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

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
        if (record.is_correct === null) return <Clock className="h-4 w-4 text-gray-500" />;
        return record.is_correct
            ? <CheckCircle2 className="h-4 w-4 text-green-500" />
            : <XCircle className="h-4 w-4 text-red-500" />;
    };

    const getRecIcon = (rec: string) => {
        switch (rec) {
            case 'Buy': return <TrendingUp className="h-3.5 w-3.5" />;
            case 'Sell': return <TrendingDown className="h-3.5 w-3.5" />;
            default: return <Minus className="h-3.5 w-3.5" />;
        }
    };

    const uniqueTickers = [...new Set(records.map(r => r.ticker))];

    const handleExport = () => { window.location.href = '/api/export'; };

    const getPnl = (record: HistoryRecord) => {
        if (!record.rec_price || !record.actual_outcome) return null;
        const rawPct = ((record.actual_outcome - record.rec_price) / record.rec_price) * 100;
        // For Sell: a price DROP is a win, so invert the sign for display
        return record.recommendation === 'Sell' ? -rawPct : rawPct;
    };

    return (
        <div className="glass-card p-4 md:p-6 h-full flex flex-col overflow-hidden bg-transparent border-foreground/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-solarized-violet/10 rounded-xl text-solarized-violet">
                        <History className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-foreground">Analysis History</h2>
                        <p className="text-xs text-foreground/40 font-medium uppercase tracking-wide">Track Record</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative group flex-1 sm:flex-none">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="appearance-none bg-foreground/5 border border-foreground/10 text-foreground/80 text-sm font-bold rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-solarized-violet/30 w-full transition-all"
                        >
                            <option value="">All Tickers</option>
                            {uniqueTickers.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30 pointer-events-none" />
                    </div>

                    <button
                        onClick={handleExport}
                        className="px-4 py-2.5 bg-solarized-green/10 hover:bg-solarized-green/20 text-solarized-green border border-solarized-green/20 rounded-xl text-sm font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Export</span>
                    </button>

                    <button
                        onClick={fetchHistory}
                        disabled={loading}
                        className="p-2.5 bg-foreground/5 hover:bg-foreground/10 text-foreground/40 border border-foreground/10 rounded-xl transition shadow-sm"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Desktop Table */}
            <div className="flex-1 overflow-auto rounded-3xl border border-foreground/10 bg-foreground/5 backdrop-blur-xl custom-scrollbar hidden md:block">
                <table className="w-full text-sm text-left">
                    <thead className="text-[10px] uppercase bg-foreground/5 text-foreground/40 sticky top-0 backdrop-blur-2xl z-10 font-black tracking-widest border-b border-foreground/10">
                        <tr>
                            <th className="px-6 py-4">Ticker</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Verdict</th>
                            <th className="px-6 py-4">Conviction</th>
                            <th className="px-6 py-4 text-center">Prediction</th>
                            <th className="px-6 py-4 text-center">Outcome</th>
                            <th className="px-6 py-4 text-center">Result</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-foreground/5">
                        {records.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-20 text-center text-foreground/30 font-medium">
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <RefreshCw className="h-5 w-5 animate-spin text-solarized-violet" /> 
                                            <span className="tracking-widest uppercase text-xs font-bold">Synchronizing History...</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="text-4xl">📭</div>
                                            <p className="tracking-wide uppercase text-xs font-bold opacity-50">Empty Archive</p>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ) : (
                            records.map((record) => (
                                <tr key={record.id} className="hover:bg-foreground/5 transition duration-150 group">
                                    <td className="px-6 py-4">
                                        <span className="font-black text-foreground bg-foreground/5 px-2.5 py-1.5 rounded-xl border border-foreground/5 group-hover:border-solarized-violet/20 transition-all">{record.ticker}</span>
                                    </td>
                                    <td className="px-6 py-4 text-foreground/30 text-[10px] font-mono font-bold">
                                        {formatDate(record.created_at)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${record.recommendation === 'Buy' ? 'bg-solarized-green/10 text-solarized-green border-solarized-green/20' :
                                            record.recommendation === 'Sell' ? 'bg-solarized-red/10 text-solarized-red border-solarized-red/20' :
                                                'bg-solarized-yellow/10 text-solarized-yellow border-solarized-yellow/20'
                                            }`}>
                                            {record.recommendation}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {record.conviction_score ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-20 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-solarized-blue to-solarized-violet rounded-full"
                                                        style={{ width: `${Math.min((record.conviction_score ?? 0) * 10, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-foreground/40">{record.conviction_score}/10</span>
                                            </div>
                                        ) : <span className="text-foreground/20 italic">-</span>}
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-foreground/40 text-center">
                                        {record.rec_price ? `$${parseFloat(String(record.rec_price)).toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 font-mono font-black text-foreground text-center">
                                        {record.actual_outcome ? `$${parseFloat(String(record.actual_outcome)).toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2 font-black">
                                            {getResultIcon(record)}
                                            {(() => {
                                                const pnl = getPnl(record);
                                                if (pnl === null) return null;
                                                return (
                                                    <span className={`text-xs font-black ${pnl >= 0 ? 'text-solarized-green' : 'text-solarized-red'}`}>
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
            <div className="flex-1 overflow-auto space-y-4 md:hidden custom-scrollbar pb-24 px-1">
                {records.length === 0 ? (
                    <div className="text-center py-20 text-foreground/30 font-medium">
                        {loading ? (
                            <Activity className="h-8 w-8 animate-pulse mx-auto text-solarized-violet opacity-50" />
                        ) : (
                            <p className="uppercase text-xs font-bold tracking-widest">No history recorded.</p>
                        )}
                    </div>
                ) : (
                    records.map((record) => {
                        const pnl = getPnl(record);
                        return (
                            <motion.div
                                key={record.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-5 rounded-3xl bg-foreground/5 border border-foreground/10 space-y-4 backdrop-blur-xl shadow-sm`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="font-black text-xl text-foreground bg-foreground/5 px-3 py-1.5 rounded-2xl border border-foreground/10">{record.ticker}</span>
                                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${record.recommendation === 'Buy' ? 'bg-solarized-green/10 text-solarized-green border-solarized-green/20' :
                                            record.recommendation === 'Sell' ? 'bg-solarized-red/10 text-solarized-red border-solarized-red/20' :
                                                'bg-solarized-yellow/10 text-solarized-yellow border-solarized-yellow/20'
                                            }`}>
                                            {getRecIcon(record.recommendation)}
                                            {record.recommendation}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getResultIcon(record)}
                                        {pnl !== null && (
                                            <span className={`text-sm font-black ${pnl >= 0 ? 'text-solarized-green' : 'text-solarized-red'}`}>
                                                {pnl >= 0 ? '+' : ''}{pnl.toFixed(1)}%
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="bg-foreground/5 p-3 rounded-2xl border border-foreground/5">
                                        <p className="text-[10px] text-foreground/40 uppercase font-bold tracking-tighter mb-1">Entry</p>
                                        <p className="text-sm font-mono font-black text-foreground/60">
                                            {record.rec_price ? `$${parseFloat(String(record.rec_price)).toFixed(2)}` : '-'}
                                        </p>
                                    </div>
                                    <div className="bg-foreground/5 p-3 rounded-2xl border border-foreground/5">
                                        <p className="text-[10px] text-foreground/40 uppercase font-bold tracking-tighter mb-1">Current</p>
                                        <p className="text-sm font-mono font-black text-foreground">
                                            {record.actual_outcome ? `$${parseFloat(String(record.actual_outcome)).toFixed(2)}` : '-'}
                                        </p>
                                    </div>
                                    <div className="bg-foreground/5 p-3 rounded-2xl border border-foreground/5">
                                        <p className="text-[10px] text-foreground/40 uppercase font-bold tracking-tighter mb-1">Conviction</p>
                                        <p className="text-sm font-black text-solarized-violet">
                                            {record.conviction_score ? `${record.conviction_score}/10` : '-'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-[10px] font-mono font-bold text-foreground/30">{formatDate(record.created_at)}</span>
                                    {record.conviction_score && (
                                        <div className="w-24 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-solarized-blue to-solarized-violet rounded-full"
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
