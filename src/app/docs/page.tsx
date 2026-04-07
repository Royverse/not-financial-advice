"use client";

import Link from "next/link";
import { ArrowLeft, Book, ShieldCheck, Zap, BarChart3, Clock, DollarSign, TrendingDown, Target } from "lucide-react";
import { motion } from "framer-motion";
import Mermaid from "@/components/ui/Mermaid";

const systemOverview = `
graph TD
    classDef external fill:#1e293b,stroke:#475569,stroke-width:2px,color:#e2e8f0
    classDef core fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#e0e7ff
    classDef ui fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#d1fae5
    classDef database fill:#7c2d12,stroke:#f97316,stroke-width:2px,color:#ffedd5
    classDef engine fill:#581c87,stroke:#a855f7,stroke-width:2px,color:#f3e8ff
    classDef money fill:#065f46,stroke:#34d399,stroke-width:2px,color:#d1fae5

    subgraph External["External APIs"]
        AV["Alpha Vantage<br/>Market Data"]:::external
        XP["Xpoz<br/>Social Sentiment"]:::external
        GM["Gemini Flash<br/>3:1 R/R Engine"]:::external
    end

    subgraph Core["Core Pipeline"]
        direction TB
        CRON["Cron Scheduler<br/>3x Daily"]:::core
        SCAN["Scanner Service<br/>Top Gainers + Active"]:::core

        subgraph Engines["3-Engine Analysis"]
            E1["RVOL Engine"]:::engine
            E2["Float Rotation"]:::engine
            E3["Sentiment Velocity"]:::engine
        end

        JUDGE["Conviction Score<br/>Weighted Algorithm"]:::core
        DB[("Supabase<br/>Database")]:::database
    end

    subgraph Money["Money Maker"]
        TP["Take-Profit Target"]:::money
        SL["Stop-Loss Target"]:::money
        RR["3:1 Risk/Reward Gate"]:::money
        PT["Paper Trades<br/>$1,000/position"]:::money
    end

    subgraph Validation["Outcome Validation"]
        VCRON["Validate Cron"]:::core
        WIN["closed_win"]:::money
        LOSS["closed_loss"]:::external
        EXP["expired"]:::external
    end

    subgraph UI["Frontend"]
        DASH["Dashboard"]:::ui
        SCANNER["Market Scanner"]:::ui
        HISTORY["History Table"]:::ui
        PORTFOLIO["Paper Portfolio"]:::ui
        HEALTH["Health Monitor"]:::ui
    end

    CRON --> SCAN
    SCAN -->|"Top Gainers"| AV
    SCAN --> Engines
    E1 & E2 -->|"Metrics"| AV
    E3 -->|"Social Data"| XP
    Engines --> JUDGE
    JUDGE -->|"Score + Data"| GM
    GM -->|"TP / SL / Verdict"| RR
    RR -->|"Pass"| DB
    RR -->|"Reject"| SCAN
    DB --> TP & SL
    DB -->|"Buy Signal"| PT
    VCRON -->|"Price Check"| AV
    VCRON --> WIN & LOSS & EXP
    DB --> DASH & SCANNER & HISTORY & PORTFOLIO
    HEALTH -.->|"Monitor"| AV & XP & GM
`;

const dataFlow = `
sequenceDiagram
    autonumber
    participant C as Cron
    participant S as Scanner
    participant AV as Alpha Vantage
    participant X as Xpoz
    participant AI as Gemini Flash
    participant DB as Supabase
    participant PT as Paper Trades

    C->>S: WAKE_UP (9:30, 12:00, 16:00)
    S->>AV: FETCH_TOP_GAINERS
    AV-->>S: Symbols + Gap%

    loop Per Candidate
        S->>AV: FETCH_TECHNICALS (RVOL, Float)
        S->>X: FETCH_SENTIMENT
        Note over S: Calculate Conviction Score
        S->>AI: ANALYZE (3:1 R/R Enforced)
        AI-->>S: {recommendation, take_profit, stop_loss}
        alt Mock/Rate-Limited Response
            S--xDB: DISCARD (DB Pollution Guard)
        else Valid Response
            S->>DB: PERSIST (opportunity + targets)
            alt recommendation == Buy
                DB->>PT: AUTO_OPEN ($1,000 position)
            end
        end
    end

    Note over C,PT: Later (Validation Cron)
    C->>DB: FETCH unvalidated recs
    loop Per Recommendation
        DB->>AV: FETCH_CURRENT_PRICE
        alt Price >= Take Profit
            DB->>PT: CLOSE (closed_win)
        else Price <= Stop Loss
            DB->>PT: CLOSE (closed_loss)
        else Age > 14 days
            DB->>PT: CLOSE (expired)
        end
    end
`;

const moneyMakerFlow = `
graph TD
    classDef pass fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#d1fae5
    classDef fail fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fecaca
    classDef calc fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#dbeafe
    classDef gate fill:#581c87,stroke:#a855f7,stroke-width:3px,color:#f3e8ff

    INPUT["Stock Data + Sentiment"]:::calc
    AI["Gemini Flash Analysis"]:::calc
    TP_CALC["Calculate Take Profit"]:::calc
    SL_CALC["Calculate Stop Loss"]:::calc
    RR_CHECK{"R/R >= 3:1?"}:::gate

    INPUT --> AI
    AI --> TP_CALC & SL_CALC
    TP_CALC & SL_CALC --> RR_CHECK
    RR_CHECK -->|"Yes"| BUY["BUY Signal<br/>+ Paper Trade"]:::pass
    RR_CHECK -->|"No"| HOLD["HOLD<br/>Rejected"]:::fail
`;

const paperTradeLifecycle = `
stateDiagram-v2
    [*] --> open: Buy Signal ($1,000)
    open --> closed_win: Price >= Take Profit
    open --> closed_loss: Price <= Stop Loss
    open --> expired: Age > 14 days
    closed_win --> [*]
    closed_loss --> [*]
    expired --> [*]
`;

const mockMode = `
graph LR
    classDef check fill:#1e293b,stroke:#475569,color:#e2e8f0
    classDef real fill:#064e3b,stroke:#10b981,color:#d1fae5
    classDef mock fill:#7c2d12,stroke:#f97316,color:#ffedd5

    API["API Call"]:::check --> Check{"Limit Hit?"}:::check
    Check -->|No| Real["Real Data"]:::real
    Check -->|Yes| Mock["Mock Data"]:::mock
    Mock --> Tag["Tag: mock_intraday"]:::mock
    Mock --> DISCARD["Discard from DB"]:::mock
`;

    export default function DocsPage() {
        return (
            <main className="min-h-screen text-gray-200 p-4 md:p-8">
                <div className="relative z-10 max-w-5xl mx-auto space-y-12 pb-20">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition group font-mono text-[11px] uppercase tracking-wider"
                        >
                            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition" />
                            Back to Terminal
                        </Link>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                            <Book className="h-3.5 w-3.5 text-indigo-400/60" />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-500">Architecture</span>
                        </div>
                    </div>
    
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 text-center md:text-left"
                    >
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
                            System Architecture
                        </h1>
                        <p className="text-gray-500 text-sm font-mono tracking-wide max-w-2xl">
                            Under the hood of <span className="text-indigo-400">nfa</span> — a 3-engine, AI-powered quantitative pipeline.
                        </p>
                    </motion.div>
    
                    {/* System Overview */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06] text-gray-400">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-200">System Overview</h2>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed font-medium">
                        The architecture uses scheduled crons to orchestrate data across market intelligence providers, filter through a 3-engine conviction algorithm, and enforce a strict 3:1 Risk/Reward gate via Gemini Flash before persisting any recommendation.
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
                        The scanner executes 3x daily. Mock/rate-limited responses are automatically discarded. Buy signals trigger $1,000 paper trades. A separate validation cron closes positions when TP, SL, or a 14-day expiry is hit.
                    </p>
                    <div className="glass-card p-2 rounded-3xl bg-black/20 border-white/5">
                        <Mermaid chart={dataFlow} />
                    </div>
                </section>

                {/* Money Maker */}
                <div className="grid md:grid-cols-2 gap-8">
                    <section className="space-y-6 p-8 glass-card rounded-3xl bg-white/5 border-white/10">
                        <div className="flex items-center gap-3">
                            <DollarSign className="h-6 w-6 text-emerald-400" />
                            <h2 className="text-xl font-bold text-gray-200">3:1 Risk/Reward Gate</h2>
                        </div>
                        <p className="text-sm text-gray-400 font-medium">
                            Gemini Flash is explicitly banned from recommending &quot;Buy&quot; unless the profit target is ≥ 3× the stop-loss risk. If the math doesn&apos;t pass, the AI must output &quot;Hold&quot;.
                        </p>
                        <div className="bg-black/20 rounded-2xl p-2 border border-white/5">
                            <Mermaid chart={moneyMakerFlow} />
                        </div>
                    </section>

                    <section className="space-y-6 p-8 glass-card rounded-3xl bg-white/5 border-white/10">
                        <div className="flex items-center gap-3">
                            <Target className="h-6 w-6 text-blue-400" />
                            <h2 className="text-xl font-bold text-gray-200">Paper Trade Lifecycle</h2>
                        </div>
                        <p className="text-sm text-gray-400 font-medium">
                            Every Buy signal auto-opens a $1,000 simulated position. The validation cron closes it when the price hits the AI&apos;s exact take-profit or stop-loss target, or after 14 days.
                        </p>
                        <div className="bg-black/20 rounded-2xl p-2 border border-white/5">
                            <Mermaid chart={paperTradeLifecycle} />
                        </div>
                    </section>
                </div>

                {/* API Strategy & Mock Mode */}
                <div className="grid md:grid-cols-2 gap-8">
                    <section className="space-y-6 p-8 glass-card rounded-3xl bg-white/5 border-white/10">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="h-6 w-6 text-green-400" />
                            <h2 className="text-xl font-bold text-gray-200">API Call Budget</h2>
                        </div>
                        <div className="space-y-4">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b border-gray-100/10">
                                        <th className="pb-2 font-bold uppercase text-xs">Stage</th>
                                        <th className="pb-2 font-bold uppercase text-xs text-center">Calls/Scan</th>
                                        <th className="pb-2 font-bold uppercase text-xs text-center">Daily (×3)</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-300">
                                    <tr className="border-b border-gray-100/5">
                                        <td className="py-3 font-medium">Discovery (Top Gainers)</td>
                                        <td className="py-3 text-center">1</td>
                                        <td className="py-3 text-center">3</td>
                                    </tr>
                                    <tr className="border-b border-gray-100/5">
                                        <td className="py-3 font-medium">Deep Dive (per candidate)</td>
                                        <td className="py-3 text-center">6</td>
                                        <td className="py-3 text-center">18</td>
                                    </tr>
                                    <tr className="border-b border-gray-100/5">
                                        <td className="py-3 font-medium">Validation (price checks)</td>
                                        <td className="py-3 text-center">10</td>
                                        <td className="py-3 text-center">10</td>
                                    </tr>
                                    <tr className="font-bold text-white bg-white/5">
                                        <td className="py-3 pl-2 rounded-l-lg">Total</td>
                                        <td className="py-3 text-center">17</td>
                                        <td className="py-3 text-center rounded-r-lg">31</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-400 font-bold flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" />
                                <span>Dual API keys rotate to stay within 50 calls/day</span>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6 p-8 glass-card rounded-3xl bg-white/5 border-white/10">
                        <div className="flex items-center gap-3">
                            <Clock className="h-6 w-6 text-orange-400" />
                            <h2 className="text-xl font-bold text-gray-200">Mock Mode & DB Protection</h2>
                        </div>
                        <p className="text-sm text-gray-400 font-medium">
                            When API limits are hit, mock data is generated for UI display but is <strong className="text-orange-400">explicitly discarded</strong> from the database. DB pollution guards prevent fake data from corrupting historical analytics.
                        </p>
                        <div className="bg-black/20 rounded-2xl p-2 border border-white/5">
                            <Mermaid chart={mockMode} />
                        </div>
                    </section>
                </div>

                {/* Gainer Fade Thesis */}
                <section className="space-y-6 p-8 glass-card rounded-3xl bg-gradient-to-br from-red-900/20 to-orange-900/10 border border-red-500/20">
                    <div className="flex items-center gap-3">
                        <TrendingDown className="h-6 w-6 text-red-400" />
                        <h2 className="text-2xl font-bold text-gray-200">The Gainer Fade Thesis</h2>
                    </div>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Empirical observation: stocks that gap up significantly on the daily Top Gainers list tend to <strong className="text-red-400">fade sharply</strong> within 1-3 days. The larger the gap, the higher the probability of mean-reversion.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4 text-center">
                        <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                            <p className="text-[10px] uppercase font-bold text-green-500/70 tracking-widest">Low Fade Risk</p>
                            <p className="text-2xl font-black text-green-400 my-1">3-8%</p>
                            <p className="text-xs text-gray-500">Moderate gap, sustainable momentum</p>
                        </div>
                        <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20">
                            <p className="text-[10px] uppercase font-bold text-yellow-500/70 tracking-widest">Medium Fade Risk</p>
                            <p className="text-2xl font-black text-yellow-400 my-1">8-15%</p>
                            <p className="text-xs text-gray-500">Overextended, watch for reversal</p>
                        </div>
                        <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                            <p className="text-[10px] uppercase font-bold text-red-500/70 tracking-widest">High Fade Risk</p>
                            <p className="text-2xl font-black text-red-400 my-1">15%+</p>
                            <p className="text-xs text-gray-500">Extreme gap, likely to retrace hard</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 italic">
                        The Scanner UI now highlights the &quot;Fade Risk&quot; level on each candidate card. High-gap candidates that the AI rejects as &quot;Hold&quot; are potential short/fade opportunities.
                    </p>
                </section>

                <footer className="pt-12 text-center text-gray-500 text-sm font-medium">
                    &copy; 2026 not-financial-advice &middot; Phase 5 Architecture
                </footer>
            </div>
        </main>
    );
}
