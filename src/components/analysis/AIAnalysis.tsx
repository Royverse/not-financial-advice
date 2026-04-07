"use client";

import { AIAnalysis as AIAnalysisType } from "@/types";
import { motion } from "framer-motion";
import { TrendingUp, Activity, Target, ShieldCheck, AlertCircle } from "lucide-react";
import PromptViewer from "./PromptViewer";

interface AIAnalysisProps {
    analysis: AIAnalysisType | any;
}

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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-3xl"
            >
                <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="h-5 w-5 text-purple-400" />
                    <h2 className="text-xl font-bold text-gray-200">Raw Analysis</h2>
                </div>
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-400 bg-black/40 p-4 rounded-xl border border-white/10">{analysis.raw}</pre>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            {/* Recommendation Hero Card */}
            <div className={`
                glass-card p-6 rounded-3xl border-l-8 relative overflow-hidden
                ${analysis.recommendation === 'Buy' ? 'border-l-green-400 bg-green-500/10' :
                    analysis.recommendation === 'Sell' ? 'border-l-red-400 bg-red-500/10' :
                        'border-l-yellow-400 bg-yellow-500/10'}
            `}>
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-1">Verdict</h3>
                        <p className={`text-4xl font-black tracking-tighter
                            ${analysis.recommendation === 'Buy' ? 'text-green-400' :
                                analysis.recommendation === 'Sell' ? 'text-red-400' :
                                    'text-yellow-400'}
                        `}>
                            {analysis.recommendation}
                        </p>
                    </div>

                    {analysis.conviction_score && (
                        <div className="text-right">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-1">Conviction</h3>
                            <div className="flex items-center gap-2 justify-end">
                                <span className="text-3xl font-black text-white">{analysis.conviction_score}</span>
                                <span className="text-lg text-gray-500 font-medium">/10</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Price Range Badge */}
                {analysis.price_range_low && analysis.price_range_high && (
                    <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl w-fit border border-white/10 backdrop-blur-sm">
                        <Target className="h-4 w-4 text-purple-400" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Target (5d):</span>
                        <span className="font-mono font-bold text-gray-200">{fmt(analysis.price_range_low)} – {fmt(analysis.price_range_high)}</span>
                    </div>
                )}
                
                {/* Math targets */}
                {analysis.take_profit && analysis.stop_loss && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                         <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                              <div className="text-[10px] text-green-500/70 font-bold uppercase tracking-widest mb-1">Take Profit</div>
                              <div className="text-lg md:text-xl font-mono text-green-400 font-bold">{fmt(analysis.take_profit)}</div>
                         </div>
                         <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                              <div className="text-[10px] text-red-500/70 font-bold uppercase tracking-widest mb-1">Stop Loss</div>
                              <div className="text-lg md:text-xl font-mono text-red-400 font-bold">{fmt(analysis.stop_loss)}</div>
                         </div>
                         <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Risk/Reward</div>
                              <div className="text-lg md:text-xl font-mono text-gray-200 font-bold">{analysis.risk_reward_ratio != null ? `${Number(analysis.risk_reward_ratio).toFixed(2)}x` : "N/A"}</div>
                         </div>
                    </div>
                )}
            </div>

            {/* Analysis Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="glass-card p-5 rounded-3xl">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                        <h3 className="font-bold text-gray-200">Trend Analysis</h3>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">{renderValue(analysis.trend)}</p>
                </div>

                <div className="glass-card p-5 rounded-3xl">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                        <h3 className="font-bold text-gray-200">Support & Resistance</h3>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">{renderValue(analysis.support_resistance)}</p>
                </div>

                <div className="glass-card p-5 rounded-3xl md:col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                            <Activity className="h-4 w-4" />
                        </div>
                        <h3 className="font-bold text-gray-200">Strategy Projection</h3>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">{renderValue(analysis.projection)}</p>
                </div>
            </div>

            {/* Transparency Section */}
            {analysis.debug_prompt && (
                <div className="glass-card p-5 rounded-3xl border border-pink-500/20 bg-pink-900/5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400">
                            <Activity className="h-4 w-4" />
                        </div>
                        <h3 className="font-bold text-gray-200">AI Transparency</h3>
                    </div>

                    <p className="text-sm text-gray-400 mb-4">
                        View the exact prompt sent to the AI model and the raw sentiment data used for this analysis.
                    </p>

                    {analysis.sentiment && (
                        <div className="mb-4 p-4 bg-black/30 rounded-xl border border-white/5">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Social Sentiment Signal</h4>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-sm font-bold ${analysis.sentiment.sentiment === 'Bullish' ? 'text-green-400' :
                                        analysis.sentiment.sentiment === 'Bearish' ? 'text-red-400' : 'text-gray-400'
                                    }`}>
                                    {analysis.sentiment.sentiment}
                                </span>
                                <span className="text-xs text-gray-600">
                                    ({(analysis.sentiment.score * 100).toFixed(0)}% confidence)
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 italic">
                                "{analysis.sentiment.summary}"
                            </p>
                        </div>
                    )}

                    <PromptViewer prompt={analysis.debug_prompt} />
                </div>
            )}
        </motion.div>
    );
}
