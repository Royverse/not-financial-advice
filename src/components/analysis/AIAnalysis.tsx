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
                className="glass-card p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="h-5 w-5 text-solarized-violet" />
                    <h2 className="text-xl font-bold text-foreground">Raw Analysis</h2>
                </div>
                <pre className="whitespace-pre-wrap font-mono text-sm text-foreground/60 bg-foreground/5 p-4 rounded-xl border border-foreground/10">{analysis.raw}</pre>
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
                glass-card p-6 border-l-[12px] relative overflow-hidden shadow-none
                ${analysis.recommendation === 'Buy' ? 'border-l-solarized-green/40 bg-solarized-green/5' :
                    analysis.recommendation === 'Sell' ? 'border-l-solarized-red/40 bg-solarized-red/5' :
                        'border-l-solarized-yellow/40 bg-solarized-yellow/5'}
            `}>
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/40 mb-1">Verdict</h3>
                        <p className={`text-4xl font-black tracking-tighter
                            ${analysis.recommendation === 'Buy' ? 'text-solarized-green' :
                                analysis.recommendation === 'Sell' ? 'text-solarized-red' :
                                    'text-solarized-yellow'}
                        `}>
                            {analysis.recommendation}
                        </p>
                    </div>

                    {analysis.conviction_score && (
                        <div className="text-right">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/40 mb-1">Conviction</h3>
                            <div className="flex items-center gap-2 justify-end">
                                <span className="text-3xl font-black text-foreground">{analysis.conviction_score}</span>
                                <span className="text-lg text-foreground/40 font-medium">/10</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Price Range Badge */}
                {analysis.price_range_low && analysis.price_range_high && (
                    <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-foreground/5 rounded-xl w-fit border border-foreground/10 backdrop-blur-sm">
                        <Target className="h-4 w-4 text-solarized-violet" />
                        <span className="text-xs font-bold text-foreground/40 uppercase tracking-wide">Target (5d):</span>
                        <span className="font-mono font-bold text-foreground/80">{fmt(analysis.price_range_low)} – {fmt(analysis.price_range_high)}</span>
                    </div>
                )}
                
                {/* Math targets */}
                {analysis.take_profit && analysis.stop_loss && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                         <div className="bg-solarized-green/10 p-3 rounded-lg border border-solarized-green/20">
                              <div className="text-[10px] text-solarized-green font-bold uppercase tracking-widest mb-1 opacity-70">Take Profit</div>
                              <div className="text-lg md:text-xl font-mono text-solarized-green font-bold">{fmt(analysis.take_profit)}</div>
                         </div>
                         <div className="bg-solarized-red/10 p-3 rounded-lg border border-solarized-red/20">
                              <div className="text-[10px] text-solarized-red font-bold uppercase tracking-widest mb-1 opacity-70">Stop Loss</div>
                              <div className="text-lg md:text-xl font-mono text-solarized-red font-bold">{fmt(analysis.stop_loss)}</div>
                         </div>
                         <div className="bg-foreground/5 p-3 rounded-lg border border-foreground/10">
                              <div className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest mb-1">Risk/Reward</div>
                              <div className="text-lg md:text-xl font-mono text-foreground/80 font-bold">{analysis.risk_reward_ratio != null ? `${Number(analysis.risk_reward_ratio).toFixed(2)}x` : "N/A"}</div>
                         </div>
                    </div>
                )}
            </div>

            {/* Analysis Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-solarized-blue/10 rounded-lg text-solarized-blue">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                        <h3 className="font-bold text-foreground/80">Trend Analysis</h3>
                    </div>
                    <p className="text-sm text-foreground/60 leading-relaxed">{renderValue(analysis.trend)}</p>
                </div>

                <div className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-solarized-violet/10 rounded-lg text-solarized-violet">
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                        <h3 className="font-bold text-foreground/80">Support & Resistance</h3>
                    </div>
                    <p className="text-sm text-foreground/60 leading-relaxed">{renderValue(analysis.support_resistance)}</p>
                </div>

                <div className="glass-card p-5 md:col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-solarized-green/10 rounded-lg text-solarized-green">
                            <Activity className="h-4 w-4" />
                        </div>
                        <h3 className="font-bold text-foreground/80">Strategy Projection</h3>
                    </div>
                    <p className="text-sm text-foreground/60 leading-relaxed">{renderValue(analysis.projection)}</p>
                </div>
            </div>

            {/* Transparency Section */}
            {analysis.debug_prompt && (
                <div className="glass-card p-5 bg-solarized-magenta/5 shadow-none">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-solarized-magenta/10 rounded-lg text-solarized-magenta">
                            <Activity className="h-4 w-4" />
                        </div>
                        <h3 className="font-bold text-foreground/80">AI Transparency</h3>
                    </div>

                    <p className="text-sm text-foreground/40 mb-4">
                        View the exact prompt sent to the AI model and the raw sentiment data used for this analysis.
                    </p>

                    {analysis.sentiment && (
                        <div className="mb-4 p-4 bg-foreground/5 rounded-xl border border-foreground/10">
                            <h4 className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2">Social Sentiment Signal</h4>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-sm font-bold ${analysis.sentiment.sentiment === 'Bullish' ? 'text-solarized-green' :
                                        analysis.sentiment.sentiment === 'Bearish' ? 'text-solarized-red' : 'text-foreground/40'
                                    }`}>
                                    {analysis.sentiment.sentiment}
                                </span>
                                <span className="text-xs text-foreground/30">
                                    ({(analysis.sentiment.score * 100).toFixed(0)}% confidence)
                                </span>
                            </div>
                            <p className="text-xs text-foreground/40 italic">
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
