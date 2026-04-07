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

                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full xl:w-auto lg:flex-1 lg:justify-end">
                    <div className="hidden md:block flex-shrink-0">
                        <ApiStatus />
                    </div>

                    <div className="flex glass-card p-1 w-full md:w-auto overflow-x-auto custom-scrollbar border-foreground/5 shadow-none backdrop-blur-md max-w-[calc(100vw-2rem)]">
                        <button
                            onClick={() => setView("live")}
                            className={`flex-shrink-0 md:flex-none px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${view === "live"
                                ? "bg-solarized-blue/20 text-solarized-blue border border-solarized-blue/10 shadow-sm"
                                : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                                }`}
                        >
                            <TrendingUp className="h-4 w-4" />
                            <span>Live Terminal</span>
                        </button>
                        <button
                            onClick={() => setView("scanner")}
                            className={`flex-shrink-0 md:flex-none px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${view === "scanner"
                                ? "bg-solarized-violet/20 text-solarized-violet border border-solarized-violet/10 shadow-sm"
                                : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                                }`}
                        >
                            <Zap className="h-4 w-4" />
                            <span>Scanner</span>
                        </button>
                        <button
                            onClick={() => setView("history")}
                            className={`flex-shrink-0 md:flex-none px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${view === "history"
                                ? "bg-solarized-magenta/20 text-solarized-magenta border border-solarized-magenta/30 shadow-sm"
                                : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                                }`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                            <span>History</span>
                        </button>
                        <button
                            onClick={() => setView("portfolio")}
                            className={`flex-shrink-0 md:flex-none px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${view === "portfolio"
                                ? "bg-solarized-green/20 text-solarized-green border border-solarized-green/10 shadow-sm"
                                : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                                }`}
                        >
                            <Briefcase className="h-4 w-4" />
                            <span>Portfolio</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Link
                            href="/docs"
                            className="p-2.5 glass-card hover:bg-foreground/5 border-foreground/5 text-foreground/60 hover:text-foreground transition group shadow-none"
                            title="Technical Docs"
                        >
                            <BookOpen className="h-4 w-4 md:h-5 md:w-5 group-hover:scale-110 transition" />
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
                                className="glass-card p-2 flex items-center gap-2 relative z-20 shadow-none"
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
                                    className="px-6 py-3 bg-solarized-blue/10 text-solarized-blue border border-solarized-blue/30 hover:bg-solarized-blue/20 rounded-xl font-bold transition disabled:opacity-50 shadow-sm shadow-solarized-blue/10"
                                >
                                    {loading ? <div className="w-5 h-5 border-2 border-solarized-blue/30 border-t-solarized-blue rounded-full animate-spin" /> : "VIBE CHECK"}
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
                                    <div className="glass-card p-6 space-y-4 shadow-none">
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
                                <div className="glass-card h-[400px] flex flex-col items-center justify-center gap-6 relative overflow-hidden shadow-none">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-solarized-blue/20 blur-2xl rounded-full" />
                                        <BarChart3 className="h-20 w-20 text-foreground/10 relative z-10" />
                                    </div>
                                    <div className="text-center space-y-2 relative z-10">
                                        <h3 className="text-foreground/60 font-bold text-xl uppercase tracking-widest">System Online</h3>
                                        <p className="text-foreground/30 text-sm max-w-[200px] mx-auto font-medium">
                                            enter a ticker symbol to begin analysis.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Panel: Chart */}
                        <div className="lg:col-span-8 h-full min-h-[500px]">
                            {stockData ? (
                                <motion.div
                                    layout
                                    className="glass-card h-full p-6 flex flex-col relative overflow-hidden"
                                >
                                    <StockChart data={stockData} />
                                </motion.div>
                            ) : (
                                <div className="glass-card h-full flex flex-col items-center justify-center gap-6 relative overflow-hidden shadow-none">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-solarized-blue/20 blur-3xl rounded-full" />
                                        <BarChart3 className="h-32 w-32 text-foreground/5 relative z-10" />
                                    </div>
                                    <div className="text-center space-y-2 relative z-10">
                                        <h3 className="text-foreground/20 font-bold tracking-[0.3em] text-lg uppercase">Waiting for Data Stream</h3>
                                        <p className="text-foreground/10 text-xs font-mono">STANDBY — INITIALIZING ALPHA</p>
                                    </div>
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
