"use client";

import { XpozSentiment } from "@/types";
import { motion } from "framer-motion";
import { Users, TrendingUp, TrendingDown, Minus, MessageCircle } from "lucide-react";

interface SentimentAnalysisProps {
    sentiment: XpozSentiment | null;
}

export default function SentimentAnalysis({ sentiment }: SentimentAnalysisProps) {
    if (!sentiment) return null;

    const getSentimentColor = (s: string) => {
        switch (s) {
            case "Bullish": return "text-green-400 bg-green-500/20 border-green-500/30";
            case "Bearish": return "text-red-400 bg-red-500/20 border-red-500/30";
            default: return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
        }
    };

    const getSentimentIcon = (s: string) => {
        switch (s) {
            case "Bullish": return <TrendingUp className="h-5 w-5" />;
            case "Bearish": return <TrendingDown className="h-5 w-5" />;
            default: return <Minus className="h-5 w-5" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 rounded-3xl space-y-4"
        >
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                    <Users className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-200">Social Sentiment</h2>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${getSentimentColor(sentiment.sentiment)}`}>
                        {getSentimentIcon(sentiment.sentiment)}
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Crowd Mood</p>
                        <p className={`text-lg font-black ${getSentimentColor(sentiment.sentiment).split(" ")[0]}`}>
                            {sentiment.sentiment}
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Confidence</p>
                    <p className="text-2xl font-black text-white">{(sentiment.score * 100).toFixed(0)}%</p>
                </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <p className="text-sm text-gray-300 leading-relaxed font-medium">
                    {sentiment.summary}
                </p>

                {sentiment.evidence && sentiment.evidence.length > 0 && (
                    <div className="pt-3 border-t border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageCircle className="h-3 w-3 text-gray-500" />
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Crowd Voices</p>
                        </div>
                        <ul className="space-y-2">
                            {sentiment.evidence.slice(0, 3).map((item, idx) => (
                                <li key={idx} className="text-xs text-gray-400 italic bg-white/5 p-2 rounded-lg border border-white/5">
                                    "{item}"
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 justify-end uppercase tracking-wider">
                <span>Volume: {sentiment.volume ?? 'N/A'}</span>
            </div>
        </motion.div>
    );
}
