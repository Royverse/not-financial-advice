"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Radar, List, CheckCircle2, XCircle, Clock, Activity, Target, TrendingDown, AlertTriangle } from "lucide-react";

interface ScanLog {
    id: string;
    created_at: string;
    scan_type: string;
    tickers_found: number;
    status: string;
    duration_ms: number;
}

interface Candidate {
    id: string;
    ticker: string;
    price: number;
    volume: number;
    gap_percent: number;
    rejection_reason?: string;
}

interface Opportunity {
    ticker: string;
    rvol: number;
    float_rotation: number;
    sentiment_velocity: number;
    conviction_score: number;
    ai_summary: string;
    take_profit?: number;
    stop_loss?: number;
    risk_reward_ratio?: number;
}

export default function MarketScanner() {
    const [scans, setScans] = useState<ScanLog[]>([]);
    const [selectedScan, setSelectedScan] = useState<string | null>(null);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const fetchScans = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/history/scans');
            setScans(res.data.data || []);
            if (res.data.data?.length > 0 && !selectedScan) {
                handleScanSelect(res.data.data[0].id);
            }
        } catch (e) {
            console.error("Failed to fetch scans", e);
        } finally {
            setLoading(false);
        }
    };

    const handleScanSelect = async (scanId: string) => {
        setSelectedScan(scanId);
        setLoadingDetails(true);
        try {
            const res = await axios.get(`/api/history/scan-details?id=${scanId}`);
            setCandidates(res.data.candidates || []);
            setOpportunities(res.data.opportunities || []);
        } catch (e) {
            console.error("Failed to fetch scan details", e);
        } finally {
            setLoadingDetails(false);
        }
    };

    useEffect(() => { fetchScans(); }, []);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFadeRisk = (gap: number) => {
        const absGap = Math.abs(gap);
        if (absGap >= 15) return { level: 'HIGH', color: 'text-red-400 bg-red-500/10 border-red-500/20', bar: 'bg-red-500' };
        if (absGap >= 8) return { level: 'MED', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', bar: 'bg-yellow-500' };
        return { level: 'LOW', color: 'text-green-400 bg-green-500/10 border-green-500/20', bar: 'bg-green-500' };
    };

    // Fade Analytics
    const highFaders = candidates.filter(c => Math.abs(c.gap_percent) >= 15);
    const medFaders = candidates.filter(c => Math.abs(c.gap_percent) >= 8 && Math.abs(c.gap_percent) < 15);
    const fadeCorrelation = candidates.length > 0 && highFaders.length > 0
        ? ((highFaders.filter(h => h.rejection_reason || !opportunities.find(o => o.ticker === h.ticker && (o.ai_summary?.includes('Buy')))).length / highFaders.length) * 100).toFixed(0)
        : null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[500px]">
            {/* Sidebar: Scan History */}
            <div className="lg:col-span-4 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-4 flex flex-col gap-4 overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 px-2 pb-2 border-b border-white/10">
                    <Clock className="h-5 w-5 text-purple-400" />
                    <h3 className="font-bold text-gray-300 uppercase tracking-wider text-sm">Scan History</h3>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {loading && scans.length === 0 ? (
                        <div className="flex justify-center py-10 opacity-50">
                            <Activity className="h-6 w-6 animate-pulse text-purple-500" />
                        </div>
                    ) : scans.map((scan) => (
                        <button
                            key={scan.id}
                            onClick={() => handleScanSelect(scan.id)}
                            className={`w-full text-left p-3 rounded-xl transition flex flex-col gap-1 border ${selectedScan === scan.id
                                ? 'bg-purple-500/20 border-purple-500/30 text-white'
                                : 'bg-white/5 border-transparent hover:bg-white/10 text-gray-400'
                                }`}
                        >
                            <div className="flex justify-between items-center text-xs">
                                <span className={`font-mono font-medium ${selectedScan === scan.id ? 'text-purple-300' : 'text-gray-500'}`}>
                                    {formatDate(scan.created_at)}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${scan.status === 'completed'
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'bg-red-500/10 text-red-400'
                                    }`}>
                                    {scan.status}
                                </span>
                            </div>
                            <div className="font-medium text-inherit flex justify-between items-center">
                                <span className="capitalize">{scan.scan_type.replace('_', ' ')}</span>
                                <span className="text-xs text-gray-500 bg-black/20 px-2 py-0.5 rounded-md">
                                    {scan.tickers_found} found
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                <button
                    onClick={fetchScans}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-gray-400 border border-white/5 transition shadow-sm"
                >
                    Refresh List
                </button>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-8 space-y-6 overflow-y-auto pr-2 custom-scrollbar pb-20">
                {selectedScan ? (
                    <>
                        {/* Opportunities */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-green-400" />
                                <h3 className="font-bold text-gray-300 uppercase tracking-wider text-sm">Valid Opportunities</h3>
                                {loadingDetails && <Activity className="h-4 w-4 animate-spin text-purple-500 ml-2" />}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {opportunities.length === 0 && !loadingDetails && (
                                    <div className="col-span-full p-8 bg-white/5 border border-dashed border-white/10 rounded-2xl text-center text-gray-500 font-medium">
                                        No high-conviction plays found.
                                    </div>
                                )}
                                {opportunities.map((op) => (
                                    <motion.div
                                        key={op.ticker}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-5 glass-card rounded-2xl hover:bg-white/10 transition group border-l-4 border-l-green-400"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center font-black text-xl text-green-400">
                                                    {op.ticker}
                                                </div>
                                                <div>
                                                    <div className="text-xs text-green-400 font-bold uppercase tracking-wide">Conviction</div>
                                                    <div className="text-2xl font-black text-white">{op.conviction_score}<span className="text-lg text-gray-500 font-medium">/100</span></div>
                                                </div>
                                            </div>
                                            <CheckCircle2 className="h-6 w-6 text-green-500 opacity-20 group-hover:opacity-100 transition" />
                                        </div>

                                        {op.take_profit && op.stop_loss && (
                                            <div className="flex gap-2 mb-4">
                                                <span className="text-[10px] bg-green-500/20 text-green-400 font-bold px-2 py-1 rounded-md uppercase tracking-wider">TP: ${op.take_profit}</span>
                                                <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-2 py-1 rounded-md uppercase tracking-wider">SL: ${op.stop_loss}</span>
                                                {op.risk_reward_ratio && (
                                                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-1 rounded-md uppercase tracking-wider border border-indigo-500/20">R/R: {op.risk_reward_ratio}x</span>
                                                )}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                            <div className="bg-black/20 p-2 rounded-lg text-center border border-white/5">
                                                <div className="text-[10px] text-gray-500 uppercase font-bold">RVOL</div>
                                                <div className="text-sm font-black text-purple-400">{op.rvol}x</div>
                                            </div>
                                            <div className="bg-black/20 p-2 rounded-lg text-center border border-white/5">
                                                <div className="text-[10px] text-gray-500 uppercase font-bold">Float</div>
                                                <div className="text-sm font-black text-blue-400">{op.float_rotation}%</div>
                                            </div>
                                            <div className="bg-black/20 p-2 rounded-lg text-center border border-white/5">
                                                <div className="text-[10px] text-gray-500 uppercase font-bold">Sent. V</div>
                                                <div className="text-sm font-black text-pink-400">{op.sentiment_velocity}</div>
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 bg-white/5 p-2 rounded-lg">
                                            {op.ai_summary}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Fade Analysis Panel */}
                        {candidates.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="h-5 w-5 text-red-400" />
                                    <h3 className="font-bold text-gray-300 uppercase tracking-wider text-sm">Gainer Fade Analysis</h3>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Total Scanned</p>
                                        <p className="text-2xl font-black text-white">{candidates.length}</p>
                                    </div>
                                    <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-center">
                                        <p className="text-[10px] text-red-400/70 uppercase font-bold tracking-widest">High Fade Risk</p>
                                        <p className="text-2xl font-black text-red-400">{highFaders.length}</p>
                                        <p className="text-[10px] text-gray-600">Gap ≥ 15%</p>
                                    </div>
                                    <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20 text-center">
                                        <p className="text-[10px] text-yellow-400/70 uppercase font-bold tracking-widest">Medium Fade Risk</p>
                                        <p className="text-2xl font-black text-yellow-400">{medFaders.length}</p>
                                        <p className="text-[10px] text-gray-600">Gap 8-15%</p>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Fade Rejection%</p>
                                        <p className="text-2xl font-black text-orange-400">{fadeCorrelation ?? '—'}%</p>
                                        <p className="text-[10px] text-gray-600">High-gap → Hold/Reject</p>
                                    </div>
                                </div>

                                {highFaders.length > 0 && (
                                    <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                                        <p className="text-xs text-gray-400"><strong className="text-red-400">{fadeCorrelation}%</strong> of stocks that gapped ≥15% were <strong className="text-gray-300">rejected or rated Hold</strong> by the AI. These are potential <strong className="text-orange-400">fade/short candidates</strong> — expect mean-reversion within 1-3 days.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Raw Candidates */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <List className="h-5 w-5 text-gray-400" />
                                <h3 className="font-bold text-gray-300 uppercase tracking-wider text-sm">Filtering Logs</h3>
                            </div>

                            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl overflow-hidden shadow-sm">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 text-gray-400 text-[10px] uppercase border-b border-white/10">
                                        <tr>
                                            <th className="px-5 py-3 font-bold">Ticker</th>
                                            <th className="px-5 py-3 font-bold text-center">Result</th>
                                            <th className="px-5 py-3 font-bold">Details</th>
                                            <th className="px-5 py-3 font-bold text-right">Gap %</th>
                                            <th className="px-5 py-3 font-bold text-center">Fade Risk</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                                        {candidates.map((cand) => {
                                            const fade = getFadeRisk(cand.gap_percent);
                                            return (
                                                <tr key={cand.id} className="hover:bg-white/5 transition">
                                                    <td className="px-5 py-3 font-bold text-white">{cand.ticker}</td>
                                                    <td className="px-5 py-3 text-center">
                                                        {cand.rejection_reason ? (
                                                            <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                                                        ) : (
                                                            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        {cand.rejection_reason ? (
                                                            <span className="text-red-400/70 font-medium">{cand.rejection_reason}</span>
                                                        ) : (
                                                            <span className="text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded-full">Passed</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-right font-mono font-medium text-gray-500">
                                                        {cand.gap_percent > 0 ? '+' : ''}{cand.gap_percent.toFixed(2)}%
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${fade.color}`}>
                                                            {fade.level}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-4">
                        <Radar className="h-16 w-16 opacity-20" />
                        <p className="font-medium">Select a scan log to verify results</p>
                    </div>
                )}
            </div>
        </div>
    );
}
