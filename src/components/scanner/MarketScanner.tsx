"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Radar, List, CheckCircle2, XCircle, Clock, Activity, Target, TrendingDown, AlertTriangle, HelpCircle } from "lucide-react";
import Tooltip from "@/components/ui/Tooltip";

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
        if (absGap >= 15) return { level: 'HIGH', color: 'text-solarized-red bg-solarized-red/10 border-solarized-red/20', bar: 'bg-solarized-red' };
        if (absGap >= 8) return { level: 'MED', color: 'text-solarized-yellow bg-solarized-yellow/10 border-solarized-yellow/20', bar: 'bg-solarized-yellow' };
        return { level: 'LOW', color: 'text-solarized-green bg-solarized-green/10 border-solarized-green/20', bar: 'bg-solarized-green' };
    };

    // Fade Analytics
    const highFaders = candidates.filter(c => Math.abs(c.gap_percent) >= 15);
    const medFaders = candidates.filter(c => Math.abs(c.gap_percent) >= 8 && Math.abs(c.gap_percent) < 15);
    const fadeCorrelation = candidates.length > 0 && highFaders.length > 0
        ? ((highFaders.filter(h => h.rejection_reason || !opportunities.find(o => o.ticker === h.ticker && (o.ai_summary?.includes('Buy')))).length / highFaders.length) * 100).toFixed(0)
        : null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[500px] w-full max-w-full overflow-hidden">
            {/* Sidebar: Scan History */}
            <div className="lg:col-span-4 glass-card p-4 flex flex-col gap-4 overflow-hidden border-foreground/5 bg-foreground/5 w-full">
                <div className="flex items-center gap-2 px-2 pb-2 border-b border-foreground/10">
                    <Clock className="h-5 w-5 text-solarized-violet" />
                    <h3 className="font-bold text-foreground/60 uppercase tracking-wider text-sm">Scan History</h3>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar max-h-[300px] lg:max-h-none">
                    {loading && scans.length === 0 ? (
                        <div className="flex justify-center py-10 opacity-50">
                            <Activity className="h-6 w-6 animate-pulse text-solarized-violet" />
                        </div>
                    ) : scans.map((scan) => (
                        <button
                            key={scan.id}
                            onClick={() => handleScanSelect(scan.id)}
                            className={`w-full text-left p-3 rounded-xl transition flex flex-col gap-1 border ${selectedScan === scan.id
                                ? 'bg-solarized-violet/10 border-solarized-violet/20 text-foreground'
                                : 'bg-foreground/5 border-transparent hover:bg-foreground/10 text-foreground/40'
                                }`}
                        >
                            <div className="flex justify-between items-center text-xs">
                                <span className={`font-mono font-medium ${selectedScan === scan.id ? 'text-solarized-violet' : 'text-foreground/30'}`}>
                                    {formatDate(scan.created_at)}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${scan.status === 'completed'
                                    ? 'bg-solarized-green/10 text-solarized-green'
                                    : 'bg-solarized-red/10 text-solarized-red'
                                    }`}>
                                    {scan.status}
                                </span>
                            </div>
                            <div className="font-medium text-inherit flex justify-between items-center">
                                <span className="capitalize">{scan.scan_type.replace('_', ' ')}</span>
                                <span className="text-xs text-foreground/30 bg-foreground/5 px-2 py-0.5 rounded-md">
                                    {scan.tickers_found} found
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                <button
                    onClick={fetchScans}
                    className="w-full py-3 bg-foreground/5 hover:bg-foreground/10 rounded-xl text-xs font-bold text-foreground/40 border border-foreground/10 transition shadow-sm"
                >
                    Refresh List
                </button>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-8 min-w-0 max-w-full space-y-6 lg:overflow-y-auto pr-0 lg:pr-2 custom-scrollbar pb-20 w-full">
                {selectedScan ? (
                    <div className="space-y-6 w-full max-w-full overflow-hidden">
                        {/* Opportunities */}
                        <div className="space-y-4 w-full">
                            <div className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-solarized-green" />
                                <h3 className="font-bold text-foreground/60 uppercase tracking-wider text-sm">Valid Opportunities</h3>
                                {loadingDetails && <Activity className="h-4 w-4 animate-spin text-solarized-violet ml-2" />}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {opportunities.length === 0 && !loadingDetails && (
                                    <div className="col-span-full p-8 bg-foreground/5 border border-dashed border-foreground/10 rounded-2xl text-center text-foreground/40 font-medium">
                                        No high-conviction plays found.
                                    </div>
                                )}
                                {opportunities.map((op) => (
                                    <motion.div
                                        key={op.ticker}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-5 glass-card hover:bg-foreground/5 transition group border-l-4 border-l-solarized-green"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-xl bg-solarized-green/10 flex items-center justify-center font-black text-xl text-solarized-green">
                                                    {op.ticker}
                                                </div>
                                                <div>
                                                    <div className="text-xs text-solarized-green font-bold uppercase tracking-wide">Conviction</div>
                                                    <div className="text-2xl font-black text-foreground">{op.conviction_score}<span className="text-lg text-foreground/40 font-medium">/100</span></div>
                                                </div>
                                            </div>
                                            <CheckCircle2 className="h-6 w-6 text-solarized-green opacity-20 group-hover:opacity-100 transition" />
                                        </div>

                                        {op.take_profit && op.stop_loss && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                <span className="text-[10px] bg-solarized-green/10 text-solarized-green font-bold px-2 py-1 rounded-md uppercase tracking-wider">TP: ${op.take_profit}</span>
                                                <span className="text-[10px] bg-solarized-red/10 text-solarized-red font-bold px-2 py-1 rounded-md uppercase tracking-wider">SL: ${op.stop_loss}</span>
                                                {op.risk_reward_ratio && (
                                                    <span className="text-[10px] bg-solarized-blue/10 text-solarized-blue font-bold px-2 py-1 rounded-md uppercase tracking-wider border border-solarized-blue/20">R/R: {op.risk_reward_ratio}x</span>
                                                )}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                            <div className="bg-foreground/5 p-2 rounded-lg text-center border border-foreground/10 group/item transition-colors hover:border-solarized-violet/30">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <div className="text-[10px] text-foreground/40 uppercase font-bold">RVOL</div>
                                                    <Tooltip content="Relative Volume: Current volume vs 90-day average. >2.0x indicates unusual interest.">
                                                        <HelpCircle className="h-2.5 w-2.5 text-foreground/20 cursor-help" />
                                                    </Tooltip>
                                                </div>
                                                <div className="text-sm font-black text-solarized-violet">{op.rvol}x</div>
                                            </div>
                                            <div className="bg-foreground/5 p-2 rounded-lg text-center border border-foreground/10 group/item transition-colors hover:border-solarized-blue/30">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <div className="text-[10px] text-foreground/40 uppercase font-bold">Float</div>
                                                    <Tooltip content="Float Rotation: The percentage of tradable shares that have changed hands today.">
                                                        <HelpCircle className="h-2.5 w-2.5 text-foreground/20 cursor-help" />
                                                    </Tooltip>
                                                </div>
                                                <div className="text-sm font-black text-solarized-blue">{op.float_rotation}%</div>
                                            </div>
                                            <div className="bg-foreground/5 p-2 rounded-lg text-center border border-foreground/10 group/item transition-colors hover:border-solarized-magenta/30">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <div className="text-[10px] text-foreground/40 uppercase font-bold">Sent. V</div>
                                                    <Tooltip content="Sentiment Velocity: How fast positive/negative social sentiment is spreading.">
                                                        <HelpCircle className="h-2.5 w-2.5 text-foreground/20 cursor-help" />
                                                    </Tooltip>
                                                </div>
                                                <div className="text-sm font-black text-solarized-magenta">{op.sentiment_velocity}</div>
                                            </div>
                                        </div>

                                        <p className="text-xs text-foreground/40 leading-relaxed line-clamp-2 bg-foreground/5 p-2 rounded-lg">
                                            {op.ai_summary}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Fade Analysis Panel */}
                        {candidates.length > 0 && (
                            <div className="space-y-4 w-full">
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="h-5 w-5 text-solarized-red" />
                                    <h3 className="font-bold text-foreground/60 uppercase tracking-wider text-sm">Gainer Fade Analysis</h3>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-foreground/5 p-3 rounded-xl border border-foreground/10 text-center">
                                        <p className="text-[10px] text-foreground/40 uppercase font-bold tracking-widest">Total Scanned</p>
                                        <p className="text-2xl font-black text-foreground">{candidates.length}</p>
                                    </div>
                                    <div className="bg-solarized-red/10 p-3 rounded-xl border border-solarized-red/20 text-center">
                                        <p className="text-[10px] text-solarized-red/70 uppercase font-bold tracking-widest">High Fade Risk</p>
                                        <p className="text-2xl font-black text-solarized-red">{highFaders.length}</p>
                                        <p className="text-[10px] text-foreground/30">Gap ≥ 15%</p>
                                    </div>
                                    <div className="bg-solarized-yellow/10 p-3 rounded-xl border border-solarized-yellow/20 text-center">
                                        <p className="text-[10px] text-solarized-yellow/70 uppercase font-bold tracking-widest">Medium Fade Risk</p>
                                        <p className="text-2xl font-black text-solarized-yellow">{medFaders.length}</p>
                                        <p className="text-[10px] text-foreground/30">Gap 8-15%</p>
                                    </div>
                                    <div className="bg-foreground/5 p-3 rounded-xl border border-foreground/10 text-center">
                                        <p className="text-[10px] text-foreground/40 uppercase font-bold tracking-widest">Fade Rejection%</p>
                                        <p className="text-2xl font-black text-solarized-orange">{fadeCorrelation ?? '—'}%</p>
                                        <p className="text-[10px] text-foreground/30">High-gap → Hold/Reject</p>
                                    </div>
                                </div>

                                {highFaders.length > 0 && (
                                    <div className="p-3 bg-solarized-red/5 border border-solarized-red/10 rounded-xl flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 text-solarized-red mt-0.5 shrink-0" />
                                        <p className="text-xs text-foreground/40"><strong className="text-solarized-red">{fadeCorrelation}%</strong> of stocks that gapped ≥15% were <strong className="text-foreground/60">rejected or rated Hold</strong> by the AI. These are potential <strong className="text-solarized-orange">fade/short candidates</strong> — expect mean-reversion within 1-3 days.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Raw Candidates */}
                        <div className="space-y-4 w-full max-w-full overflow-hidden">
                            <div className="flex items-center gap-2">
                                <List className="h-5 w-5 text-foreground/40" />
                                <h3 className="font-bold text-foreground/60 uppercase tracking-wider text-sm">Filtering Logs</h3>
                            </div>

                            <div className="glass-card shadow-sm border-foreground/10 bg-transparent px-2 md:px-4 pb-4 max-w-full overflow-hidden">
                                <div className="overflow-x-auto custom-scrollbar w-full mt-4">
                                    <table className="min-w-[850px] w-full text-left text-xs md:text-sm">
                                        <thead className="bg-foreground/5 text-foreground/40 text-[10px] uppercase border-b border-foreground/10">
                                            <tr>
                                                <th className="px-5 py-3 font-bold">Ticker</th>
                                                <th className="px-5 py-3 font-bold text-center">Result</th>
                                                <th className="px-5 py-3 font-bold">Details</th>
                                                <th className="px-5 py-3 font-bold text-right">Gap %</th>
                                                <th className="px-5 py-3 font-bold text-center">Fade Risk</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-foreground/5 text-xs text-foreground/60">
                                            {candidates.map((cand) => {
                                                const fade = getFadeRisk(cand.gap_percent);
                                                return (
                                                    <tr key={cand.id} className="hover:bg-foreground/5 transition">
                                                        <td className="px-5 py-3 font-bold text-foreground">{cand.ticker}</td>
                                                        <td className="px-5 py-3 text-center">
                                                            {cand.rejection_reason ? (
                                                                <XCircle className="h-4 w-4 text-solarized-red mx-auto" />
                                                            ) : (
                                                                <CheckCircle2 className="h-4 w-4 text-solarized-green mx-auto" />
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            {cand.rejection_reason ? (
                                                                <span className="text-solarized-red/70 font-medium">{cand.rejection_reason}</span>
                                                            ) : (
                                                                <span className="text-solarized-green font-bold bg-solarized-green/10 px-2 py-0.5 rounded-full">Passed</span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3 text-right font-mono font-medium text-foreground/30">
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
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-foreground/20 space-y-4">
                        <Radar className="h-16 w-16 opacity-20" />
                        <p className="font-medium">Select a scan log to verify results</p>
                    </div>
                )}
            </div>
        </div>
    );
}
