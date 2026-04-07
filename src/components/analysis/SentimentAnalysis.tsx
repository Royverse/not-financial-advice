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
            case "Bullish": return "text-solarized-green bg-solarized-green/10 border-solarized-green/20";
            case "Bearish": return "text-solarized-red bg-solarized-red/10 border-solarized-red/20";
            default: return "text-solarized-yellow bg-solarized-yellow/10 border-solarized-yellow/20";
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
                <div className="p-2 bg-solarized-blue/10 rounded-lg text-solarized-blue">
                    <Users className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Social Sentiment</h2>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-foreground/5 border border-foreground/10 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${getSentimentColor(sentiment.sentiment)}`}>
                        {getSentimentIcon(sentiment.sentiment)}
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-foreground/40">Crowd Mood</p>
                        <p className={`text-lg font-black ${getSentimentColor(sentiment.sentiment).split(" ")[0]}`}>
                            {sentiment.sentiment}
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-wider text-foreground/40">Confidence</p>
                    <p className="text-2xl font-black text-foreground">{(sentiment.score * 100).toFixed(0)}%</p>
                </div>
            </div>

            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 space-y-3">
                <p className="text-sm text-foreground/60 leading-relaxed font-medium">
                    {sentiment.summary}
                </p>

                {sentiment.evidence && sentiment.evidence.length > 0 && (
                    <div className="pt-3 border-t border-foreground/10">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageCircle className="h-3 w-3 text-foreground/40" />
                            <p className="text-xs font-bold text-foreground/40 uppercase tracking-wide">Crowd Voices</p>
                        </div>
                        <ul className="space-y-2">
                            {sentiment.evidence.slice(0, 3).map((item, idx) => (
                                <li key={idx} className="text-xs text-foreground/40 italic bg-foreground/5 p-2 rounded-lg border border-foreground/10">
                                    "{item}"
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-foreground/40 justify-end uppercase tracking-wider">
                <span>Volume: {sentiment.volume ?? 'N/A'}</span>
            </div>
        </motion.div>
    );
}
