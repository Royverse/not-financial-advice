"use client";

import Link from "next/link";
import { ArrowLeft, Book, ShieldCheck, Zap, BarChart3, Clock, Lock } from "lucide-react";
import { motion } from "framer-motion";
import Mermaid from "@/components/Mermaid";

const systemOverview = `
graph TD
    classDef external fill:#1e293b,stroke:#475569,stroke-width:2px,color:#e2e8f0
    classDef core fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#e0e7ff
    classDef ui fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#d1fae5
    classDef database fill:#7c2d12,stroke:#f97316,stroke-width:2px,color:#ffedd5
    classDef engine fill:#581c87,stroke:#a855f7,stroke-width:2px,color:#f3e8ff

    subgraph External["🌐 External APIs"]
        AV[Alpha Vantage<br/>Market Data]:::external
        XP[Xpoz<br/>Social Sentiment]:::external
        GM[Gemini AI<br/>Analysis Engine]:::external
    end

    subgraph Core["⚡ Core Logic"]
        direction TB
        CRON[Cron Scheduler<br/>3x Daily]:::core
        SCAN[Scanner Service]:::core
        
        subgraph Engines["🧠 3-Engine Analysis"]
            E1[RVOL Engine]:::engine
            E2[Float Rotation]:::engine
            E3[Sentiment Velocity]:::engine
        end
        
        DB[(Supabase<br/>Database)]:::database
    end

    subgraph UI["📱 Frontend"]
        DASH[Dashboard]:::ui
        HEALTH[Health Monitor]:::ui
        EXPORT[Excel Export]:::ui
    end

    CRON -->|Trigger| SCAN
    SCAN -->|Top Gainers| AV
    SCAN --> Engines
    E1 & E2 -->|Metrics| AV
    E3 -->|Social Data| XP
    Engines -->|Judge| GM
    GM -->|Conviction Score| DB
    DB --> DASH
    HEALTH -.->|Monitor| AV & XP & GM
`;

const dataFlow = `
sequenceDiagram
    autonumber
    participant C as ⏰ Cron
    participant S as 🚀 Scanner
    participant AV as 💹 Alpha Vantage
    participant X as 🐦 Xpoz
    participant AI as 🤖 Gemini
    participant DB as 📁 Supabase

    C->>S: WAKE_UP (9:30, 12:00, 16:00)
    S->>AV: FETCH_TOP_GAINERS
    AV-->>S: Symbols [AAPL, TSLA, NVDA...]
    
    loop Per Candidate
        S->>AV: FETCH_TECHNICALS
        S->>X: FETCH_SENTIMENT
        S->>AI: PERFORM_ANALYSIS
        AI-->>S: RECOMMENDATION
    end
    
    S->>DB: PERSIST_OPPORTUNITIES
`;

const mockMode = `
graph LR
    classDef check fill:#1e293b,stroke:#475569,color:#e2e8f0
    classDef real fill:#064e3b,stroke:#10b981,color:#d1fae5
    classDef mock fill:#7c2d12,stroke:#f97316,color:#ffedd5

    API[📡 API Call]:::check --> Check{Limit Hit?}:::check
    Check -->|No| Real[✅ Real Data]:::real
    Check -->|Yes| Mock[🚧 Mock Data]:::mock
    Mock --> Tag[🏷️ Tag: mock_intraday]:::mock
`;

export default function DocsPage() {
    return (
        <main className="min-h-screen text-gray-200 p-4 md:p-8 selection:bg-purple-500/30">
            {/* Background elements managed by globals.css */}

            <div className="relative z-10 max-w-5xl mx-auto space-y-12 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-gray-500 hover:text-white transition group font-medium"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition" />
                        Back to Dashboard
                    </Link>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-sm">
                        <Book className="h-4 w-4 text-purple-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Technical Documentation</span>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 text-center md:text-left"
                >
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                        System Architecture
                    </h1>
                    <p className="text-gray-400 text-xl max-w-2xl font-medium">
                        Under the hood of <span className="text-purple-400 font-bold">not-financial-advice</span>.
                    </p>
                </motion.div>

                {/* System Overview */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-200">System Overview</h2>
                    </div>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        The architecture is built on a decoupled service pattern, using scheduled crons to orchestrate data collection across multiple market intelligence providers.
                    </p>
                    <div className="glass-card p-2 rounded-3xl bg-black/20 border-white/5">
                        <Mermaid chart={systemOverview} />
                    </div>
                </section>

                {/* Data Flow */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
                            <Zap className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-200">Execution Pipeline</h2>
                    </div>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        The scanner executes 3 times daily (pre-market, mid-day, and post-market) to identify high-conviction momentum plays.
                    </p>
                    <div className="glass-card p-2 rounded-3xl bg-black/20 border-white/5">
                        <Mermaid chart={dataFlow} />
                    </div>
                </section>

                {/* API Strategy & Mock Mode */}
                <div className="grid md:grid-cols-2 gap-8">
                    <section className="space-y-6 p-8 glass-card rounded-3xl bg-white/5 border-white/10">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="h-6 w-6 text-green-400" />
                            <h2 className="text-xl font-bold text-gray-200">API Limit Management</h2>
                        </div>
                        <div className="space-y-4">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b border-gray-100/10">
                                        <th className="pb-2 font-bold uppercase text-xs">Stage</th>
                                        <th className="pb-2 font-bold uppercase text-xs text-center">Calls/Scan</th>
                                        <th className="pb-2 font-bold uppercase text-xs text-center">Daily</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-300">
                                    <tr className="border-b border-gray-100/5">
                                        <td className="py-3 font-medium">Discovery</td>
                                        <td className="py-3 text-center">1</td>
                                        <td className="py-3 text-center">3</td>
                                    </tr>
                                    <tr className="border-b border-gray-100/5">
                                        <td className="py-3 font-medium">Deep Dive</td>
                                        <td className="py-3 text-center">6</td>
                                        <td className="py-3 text-center">18</td>
                                    </tr>
                                    <tr className="font-bold text-white bg-white/5">
                                        <td className="py-3 pl-2 rounded-l-lg">Total</td>
                                        <td className="py-3 text-center">7</td>
                                        <td className="py-3 text-center rounded-r-lg">21</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-400 font-bold flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" />
                                <span>Optimized for free tier (25 calls/day)</span>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6 p-8 glass-card rounded-3xl bg-white/5 border-white/10">
                        <div className="flex items-center gap-3">
                            <Clock className="h-6 w-6 text-orange-400" />
                            <h2 className="text-xl font-bold text-gray-200">Mock Mode Fallback</h2>
                        </div>
                        <p className="text-sm text-gray-400 font-medium">
                            Automatic failover ensures system availability even when API thresholds are exceeded.
                        </p>
                        <div className="bg-black/20 rounded-2xl p-2 border border-white/5">
                            <Mermaid chart={mockMode} />
                        </div>
                    </section>
                </div>

                <footer className="pt-12 text-center text-gray-500 text-sm font-medium">
                    &copy; 2026 not-financial-advice
                </footer>
            </div>
        </main>
    );
}
