"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { History, RefreshCw, CheckCircle2, XCircle, Clock, ChevronDown, Download, Filter } from "lucide-react";

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
        return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getResultIcon = (record: HistoryRecord) => {
        if (record.is_correct === null) return <Clock className="h-4 w-4 text-gray-500" />;
        return record.is_correct
            ? <CheckCircle2 className="h-4 w-4 text-green-500" />
            : <XCircle className="h-4 w-4 text-red-500" />;
    };

    const uniqueTickers = [...new Set(records.map(r => r.ticker))];

    const handleExport = () => { window.location.href = '/api/export'; };

    return (
        <div className="glass-card rounded-3xl p-6 h-full flex flex-col overflow-hidden bg-slate-800/40">
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
                        <History className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-100">Analysis History</h2>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Track Record</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative group flex-1 md:flex-none">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="appearance-none bg-white/5 border border-white/10 text-gray-300 text-sm font-medium rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                        >
                            <option value="">All Tickers</option>
                            {uniqueTickers.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    </div>

                    <button
                        onClick={handleExport}
                        className="px-4 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl text-sm font-bold transition flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Export</span>
                    </button>

                    <button
                        onClick={fetchHistory}
                        disabled={loading}
                        className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10 rounded-xl transition"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm custom-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-white/5 text-gray-500 sticky top-0 backdrop-blur-md z-10 font-bold tracking-wider border-b border-white/10">
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
                                    <td className="px-6 py-4">
                                        <span className="font-black text-gray-200 bg-white/5 px-2 py-1 rounded-md">{record.ticker}</span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs font-mono">
                                        {formatDate(record.created_at)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${record.recommendation === 'Buy' ? 'bg-green-500/10 text-green-400' :
                                                record.recommendation === 'Sell' ? 'bg-red-500/10 text-red-400' :
                                                    'bg-yellow-500/10 text-yellow-400'
                                            }`}>
                                            {record.recommendation}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {record.conviction_score ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full"
                                                        style={{ width: `${(record.conviction_score / 10) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-gray-400">{record.conviction_score}</span>
                                            </div>
                                        ) : <span className="text-gray-600">-</span>}
                                    </td>
                                    <td className="px-6 py-4 font-mono font-medium text-gray-400 text-center">
                                        {record.rec_price ? `$${parseFloat(String(record.rec_price)).toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-gray-200 text-center">
                                        {record.actual_outcome ? `$${parseFloat(String(record.actual_outcome)).toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center">
                                            {getResultIcon(record)}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
