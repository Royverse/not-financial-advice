"use client";

import { AIAnalysis as AIAnalysisType } from "@/types";
import { motion } from "framer-motion";
import { TrendingUp, Activity, Target, ShieldCheck, AlertCircle } from "lucide-react";
import PromptViewer from "./PromptViewer";

interface AIAnalysisProps {
    analysis: AIAnalysisType | any;
}

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];
const fmt = (n: any) => (n != null ? `$${Number(n).toFixed(2)}` : null);

function renderValue(value: any): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
        return Object.entries(value)
            .map(([key, val]) => `${key.replace(/_/g, " ")}: ${val}`)
            .join("\n");
    }
    return String(value);
}

export default function AIAnalysis({ analysis }: AIAnalysisProps) {
    if (!analysis) return null;

    if (analysis.raw) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease }}
                className="glass-card p-5 rounded-2xl"
            >
                <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-[0.15em]">Raw Output</h2>
                </div>
                <pre className="whitespace-pre-wrap font-mono text-xs text-gray-500 bg-black/30 p-4 rounded-xl border border-white/[0.04] leading-relaxed">{analysis.raw}</pre>
            </motion.div>
        );
    }

    const verdictColors: Record<string, string> = {
        Buy: "border-l-emerald-400 bg-emerald-500/[0.04]",
        Sell: "border-l-red-400 bg-red-500/[0.04]",
        Hold: "border-l-amber-400 bg-amber-500/[0.04]",
    };

    const verdictText: Record<string, string> = {
        Buy: "text-emerald-400",
        Sell: "text-red-400",
        Hold: "text-amber-400",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="space-y-4"
        >
            {/* Verdict */}
            <div className={`glass-card p-5 rounded-2xl border-l-[3px] relative overflow-hidden ${verdictColors[analysis.recommendation] || verdictColors.Hold}`}>
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-600 mb-1">Verdict</h3>
                        <p className={`text-3xl font-black tracking-tight ${verdictText[analysis.recommendation] || verdictText.Hold}`}>
                            {analysis.recommendation}
                        </p>
                    </div>

                    {analysis.conviction_score && (
                        <div className="text-right">
                            <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-600 mb-1">Conviction</h3>
                            <div className="flex items-baseline gap-1 justify-end">
                                <span className="text-3xl font-black text-white tabular-nums font-mono">{analysis.conviction_score}</span>
                                <span className="text-sm text-gray-600 font-mono">/10</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Price Range */}
                {analysis.price_range_low && analysis.price_range_high && (
                    <div className="mt-5 flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-lg w-fit border border-white/[0.06]">
                        <Target className="h-3.5 w-3.5 text-indigo-400/60" />
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">5D Target:</span>
                        <span className="font-mono text-sm font-bold text-gray-300 tabular-nums">{fmt(analysis.price_range_low)} – {fmt(analysis.price_range_high)}</span>
                    </div>
                )}

                {/* TP / SL / RR */}
                {analysis.take_profit && analysis.stop_loss && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="bg-emerald-500/[0.06] p-3 rounded-lg border border-emerald-500/10">
                            <div className="text-[9px] text-emerald-500/60 font-mono font-bold uppercase tracking-[0.15em] mb-1">TP</div>
                            <div className="text-base font-mono text-emerald-400 font-bold tabular-nums">{fmt(analysis.take_profit)}</div>
                        </div>
                        <div className="bg-red-500/[0.06] p-3 rounded-lg border border-red-500/10">
                            <div className="text-[9px] text-red-500/60 font-mono font-bold uppercase tracking-[0.15em] mb-1">SL</div>
                            <div className="text-base font-mono text-red-400 font-bold tabular-nums">{fmt(analysis.stop_loss)}</div>
                        </div>
                        <div className="bg-white/[0.02] p-3 rounded-lg border border-white/[0.06]">
                            <div className="text-[9px] text-gray-500 font-mono font-bold uppercase tracking-[0.15em] mb-1">R/R</div>
                            <div className="text-base font-mono text-gray-300 font-bold tabular-nums">{analysis.risk_reward_ratio != null ? `${Number(analysis.risk_reward_ratio).toFixed(2)}x` : "—"}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Analysis Detail Cards */}
            <div className="grid md:grid-cols-2 gap-3">
                <div className="glass-card p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-3.5 w-3.5 text-indigo-400/50" />
                        <h3 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.15em]">Trend</h3>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{renderValue(analysis.trend)}</p>
                </div>

                <div className="glass-card p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-indigo-400/50" />
                        <h3 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.15em]">Support / Resistance</h3>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{renderValue(analysis.support_resistance)}</p>
                </div>

                <div className="glass-card p-4 rounded-xl md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-3.5 w-3.5 text-indigo-400/50" />
                        <h3 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.15em]">Projection</h3>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{renderValue(analysis.projection)}</p>
                </div>
            </div>

            {/* Transparency */}
            {analysis.debug_prompt && (
                <div className="glass-card p-4 rounded-xl border border-white/[0.04]">
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="h-3.5 w-3.5 text-gray-600" />
                        <h3 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.15em]">Transparency</h3>
                    </div>

                    {analysis.sentiment && (
                        <div className="mb-4 p-3 bg-black/20 rounded-lg border border-white/[0.04]">
                            <h4 className="text-[9px] font-mono font-bold text-gray-600 uppercase tracking-[0.2em] mb-2">Sentiment Signal</h4>
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className={`text-xs font-bold ${analysis.sentiment.sentiment === 'Bullish' ? 'text-emerald-400' :
                                    analysis.sentiment.sentiment === 'Bearish' ? 'text-red-400' : 'text-gray-400'
                                }`}>
                                    {analysis.sentiment.sentiment}
                                </span>
                                <span className="text-[10px] text-gray-600 font-mono tabular-nums">
                                    {(analysis.sentiment.score * 100).toFixed(0)}% conf.
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-500 italic font-mono leading-relaxed">
                                {analysis.sentiment.summary}
                            </p>
                        </div>
                    )}

                    <PromptViewer prompt={analysis.debug_prompt} />
                </div>
            )}
        </motion.div>
    );
}
