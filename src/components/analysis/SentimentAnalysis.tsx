"use client";

import { XpozSentiment } from "@/types";
import { motion } from "framer-motion";
import { Users, TrendingUp, TrendingDown, Minus, MessageCircle } from "lucide-react";

interface SentimentAnalysisProps {
    sentiment: XpozSentiment | null;
}

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function SentimentAnalysis({ sentiment }: SentimentAnalysisProps) {
    if (!sentiment) return null;

    const sentimentAccent = {
        Bullish: { text: "text-emerald-400", dot: "bg-emerald-400", icon: <TrendingUp className="h-4 w-4" /> },
        Bearish: { text: "text-red-400", dot: "bg-red-400", icon: <TrendingDown className="h-4 w-4" /> },
        Neutral: { text: "text-gray-400", dot: "bg-gray-400", icon: <Minus className="h-4 w-4" /> },
    };

    const accent = sentimentAccent[sentiment.sentiment as keyof typeof sentimentAccent] || sentimentAccent.Neutral;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease }}
            className="glass-card p-5 rounded-2xl space-y-4"
        >
            <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-gray-600" />
                <h2 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.15em]">Social Sentiment</h2>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${accent.dot}`} />
                    <div>
                        <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-gray-600">Crowd Mood</p>
                        <p className={`text-lg font-black ${accent.text}`}>
                            {sentiment.sentiment}
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-gray-600">Confidence</p>
                    <p className="text-xl font-black text-white font-mono tabular-nums">{(sentiment.score * 100).toFixed(0)}%</p>
                </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-3">
                <p className="text-xs text-gray-400 leading-relaxed">
                    {sentiment.summary}
                </p>

                {sentiment.evidence && sentiment.evidence.length > 0 && (
                    <div className="pt-3 border-t border-white/[0.04]">
                        <div className="flex items-center gap-1.5 mb-2">
                            <MessageCircle className="h-3 w-3 text-gray-600" />
                            <p className="text-[9px] font-mono font-bold text-gray-600 uppercase tracking-[0.2em]">Evidence</p>
                        </div>
                        <ul className="space-y-1.5">
                            {sentiment.evidence.slice(0, 3).map((item, idx) => (
                                <li key={idx} className="text-[11px] text-gray-500 italic bg-white/[0.02] px-3 py-2 rounded-lg border border-white/[0.03] font-mono leading-relaxed">
                                    &ldquo;{item}&rdquo;
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 text-[9px] font-mono text-gray-600 justify-end uppercase tracking-[0.2em]">
                <span>Vol: {sentiment.volume ?? 'N/A'}</span>
            </div>
        </motion.div>
    );
}
