"use client";

import { useState } from "react";
import { useStockData } from "@/hooks/useStockData";
import StockChart from "./StockChart";
import AIAnalysis from "./AIAnalysis";
import SentimentAnalysis from "./SentimentAnalysis";
import MarketScanner from "./MarketScanner";
import HistoryTable from "./HistoryTable";
import ApiStatus from "./ApiStatus";
import PipelineStatus from "./PipelineStatus";
import { Search, BarChart3, TrendingUp, Zap, LayoutGrid, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link"; // For docs link

export default function Dashboard() {
    const [symbol, setSymbol] = useState("AAPL");
    const { stockData, aiAnalysis, sentiment, loading, error, pipelineSteps, fetchStockData } = useStockData();
    const [view, setView] = useState("live"); // 'live' | 'scanner' | 'history'

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStockData(symbol);
    };

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Header & Controls */}
            <header className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 shrink-0">
                <div className="flex flex-col gap-2">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
                    >
                        not financial advice.
                    </motion.h1>
                    <p className="text-gray-400 text-sm font-medium tracking-wide">
                        institutional-grade vibes only ✨
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
                    <ApiStatus />

                    <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md w-full md:w-auto">
                        <button
                            onClick={() => setView("live")}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${view === "live"
                                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <TrendingUp className="h-4 w-4" />
                            Live Terminal
                        </button>
                        <button
                            onClick={() => setView("scanner")}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${view === "scanner"
                                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <Zap className="h-4 w-4" />
                            Scanner
                        </button>
                        <button
                            onClick={() => setView("history")}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${view === "history"
                                ? "bg-pink-500 text-white shadow-lg shadow-pink-500/25"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                            History
                        </button>
                    </div>

                    <Link
                        href="/docs"
                        className="p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-2xl border border-white/5 text-gray-400 hover:text-white transition group"
                        title="Technical Docs"
                    >
                        <BookOpen className="h-5 w-5 group-hover:scale-110 transition" />
                    </Link>
                </div>
            </header>

            {/* Main Content Area - Grid Layout */}
            <main className="flex-1 min-h-0 relative">
                {view === "live" && (
                    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto lg:overflow-hidden pb-20 lg:pb-0">
                        {/* Left Panel: Search & Analysis */}
                        <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
                            {/* Search Box */}
                            <motion.form
                                layout
                                onSubmit={handleSubmit}
                                className="glass-card p-2 rounded-2xl flex items-center gap-2 relative z-20 bg-slate-800/40"
                            >
                                <div className="p-3 bg-indigo-500/10 rounded-xl">
                                    <Search className="h-5 w-5 text-indigo-400" />
                                </div>
                                <input
                                    type="text"
                                    value={symbol}
                                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                    placeholder="ENTER TICKER (e.g. NVDA)"
                                    className="bg-transparent border-none outline-none text-white placeholder-gray-500 font-bold tracking-widest w-full h-full"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-bold transition disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                                >
                                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "VIBE CHECK"}
                                </button>
                            </motion.form>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Pipeline Status - Transparency */}
                            <PipelineStatus steps={pipelineSteps} isVisible={loading || pipelineSteps.length > 0} />

                            {/* Actions & Analysis */}
                            {stockData && stockData["Meta Data"] && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-6"
                                >
                                    <div className="glass-card p-6 rounded-3xl space-y-4 bg-slate-800/40">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h2 className="text-3xl font-black text-white">{stockData["Meta Data"]["2. Symbol"]}</h2>
                                                <p className="text-gray-400 text-xs font-mono">{stockData["Meta Data"]["3. Last Refreshed"]}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-indigo-400 uppercase">Last Close</p>
                                                <p className="text-2xl font-mono text-white">
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
                                <div className="glass-card p-8 rounded-3xl text-center space-y-4 bg-slate-800/20 border-dashed border-white/5">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                        <BarChart3 className="h-8 w-8 text-gray-600" />
                                    </div>
                                    <h3 className="text-gray-300 font-bold text-lg">System Online</h3>
                                    <p className="text-gray-500 text-sm max-w-xs mx-auto">
                                        drop a ticker symbol to pass the vibe check.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Right Panel: Chart */}
                        <div className="lg:col-span-8 h-full min-h-[500px]">
                            {stockData ? (
                                <motion.div
                                    layout
                                    className="glass-card h-full rounded-3xl p-6 flex flex-col relative overflow-hidden bg-slate-800/40"
                                >
                                    <StockChart data={stockData} />
                                </motion.div>
                            ) : (
                                <div className="h-full rounded-3xl border border-white/5 bg-slate-800/20 flex flex-col items-center justify-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                                        <BarChart3 className="h-24 w-24 text-gray-700 relative z-10" />
                                    </div>
                                    <p className="text-gray-600 font-medium tracking-widest text-sm uppercase">Waiting for Data Stream...</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {view === "scanner" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="h-full"
                    >
                        <MarketScanner />
                    </motion.div>
                )}

                {view === "history" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="h-full"
                    >
                        <HistoryTable />
                    </motion.div>
                )}
            </main>
        </div>
    );
}

// Add types for props to quiet lint if needed
interface DashboardProps { }
