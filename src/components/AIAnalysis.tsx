"use client";

import { AIAnalysis as AIAnalysisType } from "@/types";
import { motion } from "framer-motion";
import { TrendingUp, Activity, Target, ShieldCheck, AlertCircle } from "lucide-react";

interface AIAnalysisProps {
    analysis: AIAnalysisType | any;
}

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
                        <span className="font-mono font-bold text-gray-200">${analysis.price_range_low} - ${analysis.price_range_high}</span>
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
        </motion.div>
    );
}
