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
        <div className="glass-card rounded-3xl p-4 md:p-6 h-full flex flex-col overflow-hidden bg-slate-800/40">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
                        <History className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-gray-100">Analysis History</h2>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Track Record</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative group flex-1 sm:flex-none">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="appearance-none bg-white/5 border border-white/10 text-gray-300 text-sm font-medium rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                        >
                            <option value="">All</option>
                            {uniqueTickers.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                    </div>

                    <button
                        onClick={handleExport}
                        className="px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl text-sm font-bold transition flex items-center gap-1.5"
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Export</span>
                    </button>

                    <button
                        onClick={fetchHistory}
                        disabled={loading}
                        className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10 rounded-xl transition"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Desktop Table */}
            <div className="flex-1 overflow-auto rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm custom-scrollbar hidden md:block">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-white/5 text-gray-500 sticky top-0 backdrop-blur-md z-10 font-bold tracking-wider border-b border-white/10">
                        <tr>
                            <th className="px-5 py-3">Ticker</th>
                            <th className="px-5 py-3">Date</th>
                            <th className="px-5 py-3">Verdict</th>
                            <th className="px-5 py-3">Conviction</th>
                            <th className="px-5 py-3 text-center">Prediction</th>
                            <th className="px-5 py-3 text-center">Outcome</th>
                            <th className="px-5 py-3 text-center">Result</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {records.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium">
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <RefreshCw className="h-4 w-4 animate-spin" /> Loading data...
                                        </div>
                                    ) : (
                                        "No history found. Generate some alpha first!"
                                    )}
                                </td>
                            </tr>
                        ) : (
                            records.map((record) => (
                                <tr key={record.id} className="hover:bg-white/5 transition duration-150 group">
                                    <td className="px-5 py-3">
                                        <span className="font-black text-gray-200 bg-white/5 px-2 py-1 rounded-md">{record.ticker}</span>
                                    </td>
                                    <td className="px-5 py-3 text-gray-500 text-xs font-mono">
                                        {formatDate(record.created_at)}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${record.recommendation === 'Buy' ? 'bg-green-500/10 text-green-400' :
                                            record.recommendation === 'Sell' ? 'bg-red-500/10 text-red-400' :
                                                'bg-yellow-500/10 text-yellow-400'
                                            }`}>
                                            {record.recommendation}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        {record.conviction_score ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                                        style={{ width: `${Math.min((record.conviction_score ?? 0) * 10, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-gray-400">{record.conviction_score}/10</span>
                                            </div>
                                        ) : <span className="text-gray-600">-</span>}
                                    </td>
                                    <td className="px-5 py-3 font-mono font-medium text-gray-400 text-center">
                                        {record.rec_price ? `$${parseFloat(String(record.rec_price)).toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-5 py-3 font-mono font-bold text-gray-200 text-center">
                                        {record.actual_outcome ? `$${parseFloat(String(record.actual_outcome)).toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {getResultIcon(record)}
                                            {(() => {
                                                const pnl = getPnl(record);
                                                if (pnl === null) return null;
                                                return (
                                                    <span className={`text-xs font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
            <div className="flex-1 overflow-auto space-y-3 md:hidden custom-scrollbar pb-20">
                {records.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 font-medium">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <RefreshCw className="h-4 w-4 animate-spin" /> Loading data...
                            </div>
                        ) : (
                            "No history found. Generate some alpha first!"
                        )}
                    </div>
                ) : (
                    records.map((record) => {
                        const pnl = getPnl(record);
                        return (
                            <motion.div
                                key={record.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <span className="font-black text-lg text-gray-200 bg-white/5 px-2.5 py-1 rounded-lg">{record.ticker}</span>
                                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase ${record.recommendation === 'Buy' ? 'bg-green-500/10 text-green-400' :
                                            record.recommendation === 'Sell' ? 'bg-red-500/10 text-red-400' :
                                                'bg-yellow-500/10 text-yellow-400'
                                            }`}>
                                            {getRecIcon(record.recommendation)}
                                            {record.recommendation}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {getResultIcon(record)}
                                        {pnl !== null && (
                                            <span className={`text-sm font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {pnl >= 0 ? '+' : ''}{pnl.toFixed(1)}%
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Entry</p>
                                        <p className="text-sm font-mono font-bold text-gray-300">
                                            {record.rec_price ? `$${parseFloat(String(record.rec_price)).toFixed(2)}` : '-'}
                                        </p>
                                    </div>
                                    <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Current</p>
                                        <p className="text-sm font-mono font-bold text-gray-200">
                                            {record.actual_outcome ? `$${parseFloat(String(record.actual_outcome)).toFixed(2)}` : '-'}
                                        </p>
                                    </div>
                                    <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Conviction</p>
                                        <p className="text-sm font-bold text-purple-400">
                                            {record.conviction_score ? `${record.conviction_score}/10` : '-'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span className="font-mono">{formatDate(record.created_at)}</span>
                                    {record.conviction_score && (
                                        <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
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
