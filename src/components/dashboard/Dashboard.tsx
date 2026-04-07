"use client";

import { useState } from "react";
import { useStockData } from "@/hooks/useStockData";
import StockChart from "../ui/StockChart";
import AIAnalysis from "../analysis/AIAnalysis";
import SentimentAnalysis from "../analysis/SentimentAnalysis";
import MarketScanner from "../scanner/MarketScanner";
import HistoryTable from "../portfolio/HistoryTable";
import ApiStatus from "./ApiStatus";
import PipelineStatus from "./PipelineStatus";
import PaperPortfolio from "../portfolio/PaperPortfolio";
import { Search, BarChart3, TrendingUp, Zap, LayoutGrid, BookOpen, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function Dashboard() {
    const [symbol, setSymbol] = useState("AAPL");
    const { stockData, aiAnalysis, sentiment, loading, error, pipelineSteps, fetchStockData } = useStockData();
    const [view, setView] = useState("live");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStockData(symbol);
    };

    const tabs = [
        { id: "live", label: "Terminal", icon: TrendingUp },
        { id: "scanner", label: "Scanner", icon: Zap },
        { id: "history", label: "History", icon: LayoutGrid },
        { id: "portfolio", label: "Portfolio", icon: Briefcase },
    ];

    return (
        <div className="h-full flex flex-col gap-5">
            {/* Header */}
            <header className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 shrink-0">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease }}
                    className="flex items-baseline gap-3"
                >
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                        nfa<span className="text-indigo-400">.</span>
                    </h1>
                    <span className="text-[10px] font-mono text-gray-600 uppercase tracking-[0.2em] hidden sm:inline">
                        quantitative engine
                    </span>
                </motion.div>

                <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
                    <ApiStatus />

                    <div className="flex bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] w-full md:w-auto">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setView(tab.id)}
                                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 ${
                                        view === tab.id
                                            ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                                            : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] border border-transparent"
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <Link
                        href="/docs"
                        className="p-2.5 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl border border-white/[0.06] text-gray-500 hover:text-gray-300 transition group"
                        title="Technical Docs"
                    >
                        <BookOpen className="h-4 w-4 group-hover:scale-105 transition" />
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 min-h-0 relative">
                {view === "live" && (
                    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto lg:overflow-hidden pb-20 lg:pb-0">
                        {/* Left: Search & Analysis */}
                        <div className="lg:col-span-4 flex flex-col gap-5 h-full overflow-y-auto pr-1 custom-scrollbar">
                            {/* Command Input */}
                            <motion.form
                                layout
                                onSubmit={handleSubmit}
                                transition={{ duration: 0.2, ease }}
                                className="glass-card p-1.5 rounded-xl flex items-center gap-2 relative z-20"
                            >
                                <div className="p-2.5 bg-indigo-500/10 rounded-lg">
                                    <Search className="h-4 w-4 text-indigo-400" />
                                </div>
                                <input
                                    type="text"
                                    value={symbol}
                                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                    placeholder="> ENTER IDENTIFIER..."
                                    className="bg-transparent border-none outline-none text-white placeholder-gray-600 font-mono text-sm tracking-wider w-full h-full"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/20 rounded-lg text-xs font-bold tracking-wider transition disabled:opacity-40"
                                >
                                    {loading ? <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" /> : "ANALYZE"}
                                </button>
                            </motion.form>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3, ease }}
                                        className="bg-red-500/5 border border-red-500/15 text-red-400/80 px-4 py-3 rounded-xl text-xs font-medium font-mono"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <PipelineStatus steps={pipelineSteps} isVisible={loading || pipelineSteps.length > 0} />

                            {stockData && stockData["Meta Data"] && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.4, ease }}
                                    className="space-y-5"
                                >
                                    <div className="glass-card p-5 rounded-2xl space-y-3">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h2 className="text-2xl font-black text-white tracking-tight">{stockData["Meta Data"]["2. Symbol"]}</h2>
                                                <p className="text-gray-600 text-[10px] font-mono tracking-wider">{stockData["Meta Data"]["3. Last Refreshed"]}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Last Close</p>
                                                <p className="text-xl font-mono font-bold text-white tabular-nums">
                                                    ${stockData["Time Series (Daily)"] ? Object.values(stockData["Time Series (Daily)"])[0]?.["4. close"] : "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <AIAnalysis analysis={aiAnalysis} />
                                    <SentimentAnalysis sentiment={sentiment} />
                                </motion.div>
                            )}

                            {!stockData && !loading && (
                                <div className="glass-card p-10 rounded-2xl text-center space-y-4 border-dashed">
                                    <div className="w-14 h-14 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto border border-white/[0.06]">
                                        <BarChart3 className="h-6 w-6 text-gray-700" />
                                    </div>
                                    <div>
                                        <h3 className="text-gray-400 font-semibold text-sm">Engine Ready</h3>
                                        <p className="text-gray-600 text-xs mt-1 max-w-xs mx-auto font-mono">
                                            enter a ticker to begin analysis
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Chart */}
                        <div className="lg:col-span-8 h-full min-h-[500px]">
                            {stockData ? (
                                <motion.div
                                    layout
                                    transition={{ duration: 0.3, ease }}
                                    className="glass-card h-full rounded-2xl p-5 flex flex-col relative overflow-hidden"
                                >
                                    <StockChart data={stockData} />
                                </motion.div>
                            ) : (
                                <div className="h-full rounded-2xl border border-white/[0.04] bg-white/[0.01] flex flex-col items-center justify-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-500/[0.06] blur-2xl rounded-full" />
                                        <BarChart3 className="h-20 w-20 text-gray-800 relative z-10" />
                                    </div>
                                    <p className="text-gray-700 font-mono text-[10px] tracking-[0.3em] uppercase">Awaiting Data Feed</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {view === "scanner" && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease }}
                        className="h-full"
                    >
                        <MarketScanner />
                    </motion.div>
                )}

                {view === "history" && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease }}
                        className="h-full"
                    >
                        <HistoryTable />
                    </motion.div>
                )}

                {view === "portfolio" && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease }}
                        className="h-full overflow-y-auto pb-20 custom-scrollbar"
                    >
                        <PaperPortfolio />
                    </motion.div>
                )}
            </main>
        </div>
    );
}
