"use client";

import Link from "next/link";
import { ArrowLeft, Book, ShieldCheck, Zap, BarChart3, Clock, DollarSign, TrendingDown, Target, Github } from "lucide-react";
import { motion } from "framer-motion";
import Mermaid from "@/components/ui/Mermaid";

const systemOverview = `
graph TD
    classDef ai fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#e0e7ff
    classDef core fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#d1fae5
    classDef data fill:#7c2d12,stroke:#f97316,stroke-width:2px,color:#ffedd5

    DB[("Supabase<br/>Database")]:::data
    SCAN["Scanner & Engine<br/>(Metrics + Regimes)"]:::core
    AI["Tri-Tier AI<br/>(Groq/DeepSeek/Gemini)"]:::ai
    TRADE["Execution &<br/>Validation"]:::core
    LEARN["Post-Mortem<br/>Self-Learning"]:::ai

    SCAN -->|"Candidate Data"| AI
    AI -->|"Conviction Score"| TRADE
    TRADE -->|"Buy/Sell"| DB
    TRADE -->|"Closed Loss"| LEARN
    LEARN -->|"New Rules"| DB
    DB -->|"System Context"| AI
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
        <main className="min-h-screen text-gray-200 p-4 md:p-8 selection:bg-purple-500/30">
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
                    <a
                        href="https://github.com/Royverse/not-financial-advice"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-500 hover:text-white transition group font-medium"
                    >
                        <Github className="h-4 w-4 group-hover:scale-110 transition" />
                        GitHub Repo
                    </a>
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
                        Under the hood of <span className="text-purple-400 font-bold">not-financial-advice</span> — a 3-engine, AI-powered money maker.
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
                        The architecture orchestrates market intelligence through a Tri-Tier AI framework. It dynamically adjusts to macroeconomic regimes, filters candidates via strict Risk/Reward math, and uses DeepSeek R1 to autonomously learn from failed paper trades.
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
                            <h2 className="text-xl font-bold text-gray-200">Tri-Tier AI Strategy</h2>
                        </div>
                        <p className="text-sm text-gray-400 font-medium pb-2">
                            The system is powered by a multi-provider fallback architecture to bypass free-tier rate limits and prevent timeouts.
                        </p>
                        <div className="space-y-4">
                            <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm text-white">1. Groq (Llama 3 70B)</span>
                                    <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold bg-emerald-400/10 px-2 py-1 rounded">Primary Engine</span>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">Lightning-fast inference prevents 10s serverless timeouts.</p>
                                <div className="flex justify-between text-xs text-gray-400 font-mono">
                                    <span>30 Req/min</span>
                                    <span>12,000 Tokens/min</span>
                                </div>
                            </div>
                            
                            <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm text-white">2. Google (Gemini 2.0)</span>
                                    <span className="text-[10px] uppercase tracking-widest text-blue-400 font-bold bg-blue-400/10 px-2 py-1 rounded">Fallback Engine</span>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">High token limit safety net.</p>
                                <div className="flex justify-between text-xs text-gray-400 font-mono">
                                    <span>15 Req/min</span>
                                    <span>1,500 Req/day</span>
                                </div>
                            </div>

                            <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm text-white">3. OpenRouter (DeepSeek R1)</span>
                                    <span className="text-[10px] uppercase tracking-widest text-purple-400 font-bold bg-purple-400/10 px-2 py-1 rounded">Manual Select</span>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">Deep quantitative reasoning (Slow: Warning 10s limits).</p>
                                <div className="flex justify-between text-xs text-gray-400 font-mono">
                                    <span>20 Req/min</span>
                                    <span>~1,000 Req/day</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6 p-8 glass-card rounded-3xl bg-white/5 border-white/10">
                        <div className="flex items-center gap-3">
                            <Book className="h-6 w-6 text-orange-400" />
                            <h2 className="text-xl font-bold text-gray-200">The Self-Learning Matrix</h2>
                        </div>
                        <p className="text-sm text-gray-400 font-medium pb-2">
                            A fully autonomous money maker needs to evolve. We built a continuous feedback loop using the reasoning engine.
                        </p>
                        <ul className="space-y-4 text-sm text-gray-300">
                            <li className="flex gap-3 items-start">
                                <span className="bg-orange-500/20 text-orange-400 p-1 rounded">1</span>
                                <div>
                                    <strong className="text-white block">Algorithmic Post-Mortems</strong>
                                    When a Paper Trade hits a Stop Loss, DeepSeek R1 analyzes the failure.
                                </div>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="bg-orange-500/20 text-orange-400 p-1 rounded">2</span>
                                <div>
                                    <strong className="text-white block">Rule Generation</strong>
                                    The AI generates a permanent "Trading Rule" (e.g. "Do not buy gap ups in chop").
                                </div>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="bg-orange-500/20 text-orange-400 p-1 rounded">3</span>
                                <div>
                                    <strong className="text-white block">System Context Updates</strong>
                                    These rules are injected into future AI prompt weights so the same mistake is never repeated.
                                </div>
                            </li>
                        </ul>
                    </section>
                </div>

                {/* Macro Regime & Fade Thesis */}
                <div className="grid md:grid-cols-2 gap-8">
                    <section className="space-y-6 p-8 glass-card rounded-3xl bg-gradient-to-br from-blue-900/20 to-purple-900/10 border border-blue-500/20">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="h-6 w-6 text-blue-400" />
                            <h2 className="text-2xl font-bold text-gray-200">Dynamic Macro-Regime</h2>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            The system is no longer "blind" to broader market conditions. Every morning, DeepSeek R1 categorizes the SPY/QQQ into a specific regime (Bullish, Bearish, Choppy, Volatile). The intraday scanner automatically adjusts its conviction weights based on this bias—demanding higher volume in bearish conditions before firing a signal.
                        </p>
                    </section>

                    <section className="space-y-6 p-8 glass-card rounded-3xl bg-white/5 border-white/10 flex flex-col">
                        <div className="flex items-center gap-3">
                            <Clock className="h-6 w-6 text-orange-400" />
                            <h2 className="text-xl font-bold text-gray-200">Mock Mode & DB Protection</h2>
                        </div>
                        <p className="text-sm text-gray-400 font-medium">
                            When API limits are hit across all 3 providers, mock data is generated for UI display but is <strong className="text-orange-400">explicitly discarded</strong> from the database. DB pollution guards prevent fake data from corrupting historical analytics.
                        </p>
                        <div className="bg-black/20 rounded-2xl p-2 border border-white/5 flex-grow flex items-center justify-center">
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
                    &copy; 2026 not-financial-advice &middot; Phase 7 Architecture (Autonomous Money Maker)
                </footer>
            </div>
        </main>
    );
}
