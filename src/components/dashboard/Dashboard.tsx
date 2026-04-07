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
import { ThemeToggle } from "../ui/ThemeToggle";
import { Search, BarChart3, TrendingUp, Zap, LayoutGrid, BookOpen, Briefcase } from "lucide-react";
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
            <header className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 shrink-0 px-2 lg:px-0">
                <div className="flex flex-col gap-1">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-3xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-solarized-blue via-solarized-violet to-solarized-magenta dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400"
                    >
                        not financial advice.
                    </motion.h1>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
                    <div className="hidden md:block">
                        <ApiStatus />
                    </div>

                    <div className="flex bg-solarized-base2/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl w-full md:w-auto overflow-x-auto custom-scrollbar">
                        <button
                            onClick={() => setView("live")}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${view === "live"
                                ? "bg-solarized-blue/20 text-solarized-blue border border-solarized-blue/30 shadow-sm"
                                : "text-foreground/60 hover:text-foreground hover:bg-white/5"
                                }`}
                        >
                            <TrendingUp className="h-4 w-4" />
                            <span>Live Terminal</span>
                        </button>
                        <button
                            onClick={() => setView("scanner")}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${view === "scanner"
                                ? "bg-solarized-violet/20 text-solarized-violet border border-solarized-violet/30 shadow-sm"
                                : "text-foreground/60 hover:text-foreground hover:bg-white/5"
                                }`}
                        >
                            <Zap className="h-4 w-4" />
                            <span>Scanner</span>
                        </button>
                        <button
                            onClick={() => setView("history")}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${view === "history"
                                ? "bg-solarized-magenta/20 text-solarized-magenta border border-solarized-magenta/30 shadow-sm"
                                : "text-foreground/60 hover:text-foreground hover:bg-white/5"
                                }`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                            <span>History</span>
                        </button>
                        <button
                            onClick={() => setView("portfolio")}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${view === "portfolio"
                                ? "bg-solarized-green/20 text-solarized-green border border-solarized-green/30 shadow-sm"
                                : "text-foreground/60 hover:text-foreground hover:bg-white/5"
                                }`}
                        >
                            <Briefcase className="h-4 w-4" />
                            <span>Portfolio</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/docs"
                            className="p-3 bg-solarized-base2/50 dark:bg-slate-800/50 hover:bg-white/10 rounded-2xl border border-white/5 text-foreground/60 hover:text-foreground transition group"
                            title="Technical Docs"
                        >
                            <BookOpen className="h-5 w-5 group-hover:scale-110 transition" />
                        </Link>
                        <ThemeToggle />
                    </div>
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
                                className="glass-card p-2 rounded-2xl flex items-center gap-2 relative z-20"
                            >
                                <div className="p-3 bg-solarized-blue/10 rounded-xl">
                                    <Search className="h-5 w-5 text-solarized-blue" />
                                </div>
                                <input
                                    type="text"
                                    value={symbol}
                                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                    placeholder="ENTER TICKER (e.g. NVDA)"
                                    className="bg-transparent border-none outline-none text-foreground placeholder-foreground/30 font-bold tracking-widest w-full h-full"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-3 bg-solarized-blue hover:bg-solarized-blue/80 text-white rounded-xl font-bold transition disabled:opacity-50 shadow-lg shadow-solarized-blue/20"
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
                                        className="bg-solarized-red/10 border border-solarized-red/20 text-solarized-red px-4 py-3 rounded-xl text-sm font-medium"
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
                                    <div className="glass-card p-6 rounded-3xl space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h2 className="text-3xl font-black text-foreground">{stockData["Meta Data"]["2. Symbol"]}</h2>
                                                <p className="text-foreground/40 text-xs font-mono">{stockData["Meta Data"]["3. Last Refreshed"]}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-solarized-blue uppercase">Last Close</p>
                                                <p className="text-2xl font-mono text-foreground">
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
                                <div className="glass-card p-8 rounded-3xl text-center space-y-4 border-dashed border-foreground/10 bg-transparent">
                                    <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mx-auto">
                                        <BarChart3 className="h-8 w-8 text-foreground/20" />
                                    </div>
                                    <h3 className="text-foreground/60 font-bold text-lg">System Online</h3>
                                    <p className="text-foreground/40 text-sm max-w-xs mx-auto">
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
                                    className="glass-card h-full rounded-3xl p-6 flex flex-col relative overflow-hidden"
                                >
                                    <StockChart data={stockData} />
                                </motion.div>
                            ) : (
                                <div className="h-full rounded-3xl border border-foreground/5 bg-foreground/5 flex flex-col items-center justify-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-solarized-blue/20 blur-xl rounded-full" />
                                        <BarChart3 className="h-24 w-24 text-foreground/10 relative z-10" />
                                    </div>
                                    <p className="text-foreground/20 font-medium tracking-widest text-sm uppercase">Waiting for Data Stream...</p>
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

                {view === "portfolio" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="h-full overflow-y-auto pb-20 custom-scrollbar"
                    >
                        <PaperPortfolio />
                    </motion.div>
                )}
            </main>
        </div>
    );
}

// Add types for props to quiet lint if needed
interface DashboardProps { }
