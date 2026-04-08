"use client";

import { useState, useEffect, useRef } from "react";
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
import { Search, BarChart3, TrendingUp, Zap, LayoutGrid, BookOpen, Briefcase, Menu, X, LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link"; // For docs link
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import searchAnimation from "../../../public/Search Icon.json";
import paymentLoadingAnimation from "../../../public/Payment Loading.json";

export default function Dashboard() {
    const [symbol, setSymbol] = useState("AAPL");
    const { stockData, aiAnalysis, sentiment, loading, error, pipelineSteps, fetchStockData } = useStockData();
    const [view, setView] = useState("live"); // 'live' | 'scanner' | 'history'
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const paymentLottieRef = useRef<LottieRefCurrentProps>(null);

    useEffect(() => {
        if (paymentLottieRef.current) {
            paymentLottieRef.current.setSpeed(0.5);
        }
    }, [view, stockData]); // Re-run when switching views or data loads to ensure it's set on the new instance

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
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="overflow-visible">
                            <ApiStatus />
                        </div>

                        <div className="flex glass-card p-1 !rounded-2xl border-foreground/5 shadow-none backdrop-blur-md">
                            <button
                                onClick={() => setView("live")}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${view === "live"
                                    ? "bg-solarized-blue/20 text-solarized-blue border border-solarized-blue/10 shadow-sm"
                                    : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                                    }`}
                            >
                                <TrendingUp className="h-4 w-4" />
                                <span>Live Terminal</span>
                            </button>
                            <button
                                onClick={() => setView("scanner")}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${view === "scanner"
                                    ? "bg-solarized-violet/20 text-solarized-violet border border-solarized-violet/10 shadow-sm"
                                    : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                                    }`}
                            >
                                <Zap className="h-4 w-4" />
                                <span>Scanner</span>
                            </button>
                            <button
                                onClick={() => setView("history")}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${view === "history"
                                    ? "bg-solarized-magenta/20 text-solarized-magenta border border-solarized-magenta/30 shadow-sm"
                                    : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                                    }`}
                            >
                                <LayoutGrid className="h-4 w-4" />
                                <span>History</span>
                            </button>
                            <button
                                onClick={() => setView("portfolio")}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${view === "portfolio"
                                    ? "bg-solarized-green/20 text-solarized-green border border-solarized-green/10 shadow-sm"
                                    : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                                    }`}
                            >
                                <Briefcase className="h-4 w-4" />
                                <span>Portfolio</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Controls & Burger Trigger */}
                    <div className="flex md:hidden items-center justify-between w-full">
                        <div className="p-1 glass-card border-foreground/5 overflow-visible">
                            <ApiStatus />
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsMenuOpen(true)}
                                className="p-3 glass-card bg-solarized-blue/10 text-solarized-blue border-solarized-blue/20"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Utils (Docs & Theme) - Static on Desktop, Hidden on Mobile (put in menu) */}
                    <div className="hidden md:flex items-center gap-2 shrink-0">
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

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[1000] bg-solarized-base03/90 backdrop-blur-2xl md:hidden p-6 flex flex-col gap-8"
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-black text-solarized-blue tracking-tighter">Navigation</h2>
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="p-3 glass-card border-foreground/10 text-foreground/60"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                <MobileNavItem
                                    icon={TrendingUp}
                                    label="Live Terminal"
                                    active={view === "live"}
                                    color="solarized-blue"
                                    onClick={() => { setView("live"); setIsMenuOpen(false); }}
                                />
                                <MobileNavItem
                                    icon={Zap}
                                    label="Market Scanner"
                                    active={view === "scanner"}
                                    color="solarized-violet"
                                    onClick={() => { setView("scanner"); setIsMenuOpen(false); }}
                                />
                                <MobileNavItem
                                    icon={LayoutGrid}
                                    label="Analysis History"
                                    active={view === "history"}
                                    color="solarized-magenta"
                                    onClick={() => { setView("history"); setIsMenuOpen(false); }}
                                />
                                <MobileNavItem
                                    icon={Briefcase}
                                    label="Paper Portfolio"
                                    active={view === "portfolio"}
                                    color="solarized-green"
                                    onClick={() => { setView("portfolio"); setIsMenuOpen(false); }}
                                />
                            </div>

                            <div className="mt-auto border-t border-foreground/10 pt-8 flex items-center justify-between">
                                <Link
                                    href="/docs"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 text-foreground/60 font-medium"
                                >
                                    <BookOpen className="h-6 w-6" />
                                    <span>Technical Documentation</span>
                                </Link>
                                <ThemeToggle />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Main Content Area - Grid Layout */}
            <main className="flex-1 min-h-0 relative">
                {view === "live" && (
                    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto lg:overflow-hidden pb-20 lg:pb-0">
                        {/* Left Panel: Search & Analysis */}
                        <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto overflow-x-visible pr-2 custom-scrollbar">
                            {/* Search Box */}
                            <motion.form
                                layout
                                onSubmit={handleSubmit}
                                className="glass-card p-2 flex items-center gap-2 relative z-20 shadow-none flex-shrink-0 min-h-[64px]"
                            >
                                <div className="p-3 bg-solarized-blue/10 rounded-xl">
                                    <div className="w-5 h-5 flex items-center justify-center overflow-hidden relative">
                                        {loading ? (
                                            <div className="absolute pt-3 w-24 h-24 flex-shrink-0">
                                                <Lottie
                                                    animationData={searchAnimation}
                                                    loop={true}
                                                />
                                            </div>
                                        ) : (
                                            <Search className="h-5 w-5 text-solarized-blue" />
                                        )}
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={symbol}
                                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                    placeholder="ENTER TICKER (e.g. NVDA)"
                                    className="bg-transparent border-none outline-none text-foreground placeholder-foreground/30 font-bold tracking-widest w-full py-3 px-1"
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
                                    <div className="relative w-64 h-64 flex items-center justify-center">
                                        <div className="absolute inset-0 bg-solarized-blue/40 blur-3xl rounded-full" />
                                        <div className="relative z-10 w-full h-full opacity-40">
                                            <Lottie 
                                                lottieRef={paymentLottieRef}
                                                animationData={paymentLoadingAnimation} 
                                                loop={true} 
                                            />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-2 relative z-10">
                                        <h3 className="text-foreground/20 font-bold tracking-[0.3em] text-lg uppercase">Waiting for Data Stream</h3>
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

function MobileNavItem({ icon: Icon, label, active, onClick, color }: { icon: LucideIcon, label: string, active: boolean, onClick: () => void, color: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-4 p-5 rounded-3xl border transition-all text-left ${active
                ? `bg-${color}/10 border-${color}/30 text-${color}`
                : 'bg-foreground/5 border-transparent text-foreground/40'}`}
        >
            <Icon className="h-6 w-6" />
            <span className="text-lg font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}
