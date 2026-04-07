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

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

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
        if (absGap >= 15) return { level: 'HIGH', color: 'text-red-400', dot: 'bg-red-400' };
        if (absGap >= 8) return { level: 'MED', color: 'text-amber-400', dot: 'bg-amber-400' };
        return { level: 'LOW', color: 'text-emerald-400', dot: 'bg-emerald-400' };
    };

    const highFaders = candidates.filter(c => Math.abs(c.gap_percent) >= 15);
    const medFaders = candidates.filter(c => Math.abs(c.gap_percent) >= 8 && Math.abs(c.gap_percent) < 15);
    const fadeCorrelation = candidates.length > 0 && highFaders.length > 0
        ? ((highFaders.filter(h => h.rejection_reason || !opportunities.find(o => o.ticker === h.ticker && (o.ai_summary?.includes('Buy')))).length / highFaders.length) * 100).toFixed(0)
        : null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full min-h-[500px]">
            {/* Scan History Sidebar */}
            <div className="lg:col-span-4 glass-card p-4 flex flex-col gap-3 overflow-hidden">
                <div className="flex items-center gap-2 px-1 pb-2 border-b border-white/[0.04]">
                    <Clock className="h-3.5 w-3.5 text-gray-600" />
                    <h3 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.15em]">Scan Log</h3>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                    {loading && scans.length === 0 ? (
                        <div className="flex justify-center py-10">
                            <Activity className="h-4 w-4 animate-pulse text-indigo-500/40" />
                        </div>
                    ) : scans.map((scan) => (
                        <button
                            key={scan.id}
                            onClick={() => handleScanSelect(scan.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg transition flex flex-col gap-0.5 border ${
                                selectedScan === scan.id
                                    ? 'bg-indigo-500/[0.08] border-indigo-500/20 text-white'
                                    : 'bg-transparent border-transparent hover:bg-white/[0.03] text-gray-500'
                            }`}
                        >
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="font-mono tabular-nums">{formatDate(scan.created_at)}</span>
                                <span className={`font-mono font-bold tracking-wider ${scan.status === 'completed' ? 'text-emerald-500/60' : 'text-red-400/60'}`}>
                                    {scan.status === 'completed' ? 'OK' : 'ERR'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-medium capitalize text-inherit">{scan.scan_type.replace('_', ' ')}</span>
                                <span className="text-[10px] text-gray-600 font-mono">{scan.tickers_found} found</span>
                            </div>
                        </button>
                    ))}
                </div>

                <button
                    onClick={fetchScans}
                    className="w-full py-2 bg-white/[0.03] hover:bg-white/[0.05] rounded-lg text-[10px] font-mono font-bold text-gray-500 border border-white/[0.04] transition uppercase tracking-wider"
                >
                    Refresh
                </button>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-8 space-y-5 overflow-y-auto custom-scrollbar pb-20">
                {selectedScan ? (
                    <>
                        {/* Opportunities */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Target className="h-3.5 w-3.5 text-emerald-500/50" />
                                <h3 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.15em]">Opportunities</h3>
                                {loadingDetails && <Activity className="h-3 w-3 animate-spin text-indigo-500/50 ml-1" />}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {opportunities.length === 0 && !loadingDetails && (
                                    <div className="col-span-full p-8 bg-white/[0.02] border border-dashed border-white/[0.06] rounded-xl text-center text-gray-600 font-mono text-xs">
                                        No high-conviction plays detected.
                                    </div>
                                )}
                                {opportunities.map((op) => (
                                    <motion.div
                                        key={op.ticker}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, ease }}
                                        className="glass-card p-4 rounded-xl border-l-2 border-l-emerald-500/40 hover:border-l-emerald-400/60 transition"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-10 w-10 rounded-lg bg-emerald-500/[0.08] flex items-center justify-center font-black text-sm text-emerald-400 font-mono border border-emerald-500/10">
                                                    {op.ticker}
                                                </div>
                                                <div>
                                                    <div className="text-[9px] text-gray-600 font-mono uppercase tracking-[0.15em]">Conviction</div>
                                                    <div className="text-xl font-black text-white font-mono tabular-nums">{op.conviction_score}<span className="text-sm text-gray-600">/100</span></div>
                                                </div>
                                            </div>
                                        </div>

                                        {op.take_profit && op.stop_loss && (
                                            <div className="flex gap-1.5 mb-3">
                                                <span className="text-[9px] bg-emerald-500/[0.08] text-emerald-400 font-mono font-bold px-2 py-0.5 rounded tracking-wider border border-emerald-500/10">TP ${op.take_profit}</span>
                                                <span className="text-[9px] bg-red-500/[0.08] text-red-400 font-mono font-bold px-2 py-0.5 rounded tracking-wider border border-red-500/10">SL ${op.stop_loss}</span>
                                                {op.risk_reward_ratio && (
                                                    <span className="text-[9px] bg-white/[0.03] text-gray-400 font-mono font-bold px-2 py-0.5 rounded tracking-wider border border-white/[0.06]">{op.risk_reward_ratio}x</span>
                                                )}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-3 gap-1.5 mb-3">
                                            {[
                                                { label: "RVOL", value: `${op.rvol}x`, color: "text-indigo-300" },
                                                { label: "Float", value: `${op.float_rotation}%`, color: "text-gray-300" },
                                                { label: "Sent", value: String(op.sentiment_velocity), color: "text-gray-300" },
                                            ].map(m => (
                                                <div key={m.label} className="bg-white/[0.02] p-2 rounded-lg text-center border border-white/[0.03]">
                                                    <div className="text-[8px] text-gray-600 uppercase font-mono font-bold tracking-wider">{m.label}</div>
                                                    <div className={`text-xs font-black font-mono tabular-nums ${m.color}`}>{m.value}</div>
                                                </div>
                                            ))}
                                        </div>

                                        <p className="text-[10px] text-gray-500 leading-relaxed bg-white/[0.02] p-2 rounded-lg border border-white/[0.03] line-clamp-2">
                                            {op.ai_summary}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Fade Analysis */}
                        {candidates.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="h-3.5 w-3.5 text-red-500/50" />
                                    <h3 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.15em]">Fade Analysis</h3>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {[
                                        { label: "Scanned", value: candidates.length, color: "text-white" },
                                        { label: "High Fade", value: highFaders.length, color: "text-red-400", sub: "≥15%" },
                                        { label: "Med Fade", value: medFaders.length, color: "text-amber-400", sub: "8-15%" },
                                        { label: "Reject %", value: `${fadeCorrelation ?? '—'}%`, color: "text-red-300", sub: "Gap→Hold" },
                                    ].map(s => (
                                        <div key={s.label} className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.04] text-center">
                                            <p className="text-[8px] text-gray-600 uppercase font-mono font-bold tracking-[0.2em]">{s.label}</p>
                                            <p className={`text-xl font-black font-mono tabular-nums ${s.color}`}>{s.value}</p>
                                            {s.sub && <p className="text-[9px] text-gray-700 font-mono">{s.sub}</p>}
                                        </div>
                                    ))}
                                </div>

                                {highFaders.length > 0 && (
                                    <div className="p-3 bg-red-500/[0.03] border border-red-500/[0.08] rounded-lg flex items-start gap-2">
                                        <AlertTriangle className="h-3.5 w-3.5 text-red-400/60 mt-0.5 shrink-0" />
                                        <p className="text-[10px] text-gray-500 leading-relaxed">
                                            <strong className="text-red-400/80">{fadeCorrelation}%</strong> of stocks gapping ≥15% were <strong className="text-gray-400">rejected or rated Hold</strong>. Potential <strong className="text-red-300/80">fade candidates</strong> — expect mean-reversion within 1-3 days.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Candidate Table */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <List className="h-3.5 w-3.5 text-gray-600" />
                                <h3 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.15em]">Filter Log</h3>
                            </div>

                            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-white/[0.02] text-[9px] uppercase border-b border-white/[0.04]">
                                        <tr className="text-gray-600 font-mono tracking-[0.15em]">
                                            <th className="px-4 py-2.5 font-bold">Ticker</th>
                                            <th className="px-4 py-2.5 font-bold text-center">Status</th>
                                            <th className="px-4 py-2.5 font-bold">Detail</th>
                                            <th className="px-4 py-2.5 font-bold text-right">Gap</th>
                                            <th className="px-4 py-2.5 font-bold text-center">Fade</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                        {candidates.map((cand) => {
                                            const fade = getFadeRisk(cand.gap_percent);
                                            return (
                                                <tr key={cand.id} className="hover:bg-white/[0.02] transition">
                                                    <td className="px-4 py-2.5 font-bold text-gray-300 font-mono">{cand.ticker}</td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        {cand.rejection_reason ? (
                                                            <XCircle className="h-3.5 w-3.5 text-red-400/50 mx-auto" />
                                                        ) : (
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/50 mx-auto" />
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        {cand.rejection_reason ? (
                                                            <span className="text-red-400/50 font-mono text-[10px]">{cand.rejection_reason}</span>
                                                        ) : (
                                                            <span className="text-emerald-400/60 font-mono text-[10px] font-bold">PASS</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-mono text-gray-500 tabular-nums">
                                                        {cand.gap_percent > 0 ? '+' : ''}{cand.gap_percent.toFixed(2)}%
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${fade.dot}`} />
                                                            <span className={`text-[9px] font-mono font-bold ${fade.color}`}>{fade.level}</span>
                                                        </div>
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
                    <div className="flex flex-col items-center justify-center h-full text-gray-700 space-y-3">
                        <Radar className="h-12 w-12 opacity-20" />
                        <p className="font-mono text-xs tracking-wider">Select a scan log</p>
                    </div>
                )}
            </div>
        </div>
    );
}
