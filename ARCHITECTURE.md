# 🏗️ StockTracker: Institutional-Grade Vibes Only

Welcome to the internal blueprints for the **StockTracker** platform. This is where the sauce is documented. No cap, just alpha.

## 🌌 System Overview

The application follows a modular, serverless architecture optimized for data-velocity and high-touch vibes.

```mermaid
graph TD
    %% Styling
    classDef external fill:#f9f9f9,stroke:#93a1a1,stroke-width:2px,color:#657b83
    classDef core fill:#eee8d5,stroke:#586e75,stroke-width:2px,color:#586e75
    classDef ui fill:#d33682,stroke:#d33682,stroke-width:2px,color:#fff
    classDef database fill:#268bd2,stroke:#268bd2,stroke-width:2px,color:#fff
    classDef engine fill:#6c71c4,stroke:#6c71c4,stroke-width:2px,color:#fff

    subgraph External["🌐 Alpha Sources"]
        AV[Alpha Vantage<br/>Market Intel]:::external
        XP[Xpoz<br/>Sentiment Pulse]:::external
        GM[Gemini AI<br/>Executive Brain]:::external
    end

    subgraph Core["⚡ The Engine (src/lib)"]
        direction TB
        SCAN[Scanner Service]:::core
        METRICS[Metrics Engine]:::core
        
        subgraph Analysis["🧠 Analysis Cluster"]
            E1[RVOL Analysis]:::engine
            E2[Float Monitoring]:::engine
            E3[Social Velocity]:::engine
        end
        
        DB[(Supabase<br/>State Persistence)]:::database
    end

    subgraph UI["📱 The Vibe (src/app)"]
        DASH[Dashboard Container]:::ui
        GALLERY[Scanner Gallery]:::ui
        PORT[Institutional Portfolio]:::ui
    end

    SCAN -->|Scan| AV
    SCAN --> Analysis
    Analysis -->|Metrics| AV
    Analysis -->|Sentiment| XP
    Analysis -->|Verdict| GM
    GM -->|Conviction| DB
    DB --> DASH
    PORT -.->|Sync| DB
```

## 📁 Codebase Structure (The Hierarchy)

Visualizing exactly how the sauce is organized in the `src/` directory.

```mermaid
graph LR
    Root[src/] --> App[app/]
    Root --> Comp[components/]
    Root --> Lib[lib/]
    Root --> Hooks[hooks/]
    Root --> Cron[cron/]

    subgraph "Navigation & Styles"
        App --> Docs[docs/]
        App --> Globals[globals.css]
        App --> Layout[layout.tsx]
    end

    subgraph "Feature Components"
        Comp --> Dashboard[dashboard/]
        Comp --> Analysis[analysis/]
        Comp --> Scanner[scanner/]
        Comp --> PortComp[portfolio/]
        Comp --> UI[ui/ ✨]
    end

    subgraph "Core Business Logic"
        Lib --> Services[services/]
        Lib --> Gemini[gemini.ts]
        Lib --> Supa[supabase.ts]
        Services --> AV_Svc[alpha-vantage.ts]
        Services --> Scan_Svc[scanner.ts]
    end

    subgraph "Automated Pipeline"
        Cron --> Runner[runner.ts]
    end
```

## 🌊 Data Analysis Sequence

How we transform raw data into institutional-grade convictions.

```mermaid
sequenceDiagram
    autonumber
    participant C as ⏰ Scheduled Trigger
    participant S as 🚀 Scanner Service
    participant AV as 💹 Market Data
    participant X as 🐦 Social Sentiment
    participant AI as 🧠 Gemini Brain
    participant DB as 📁 Supabase Hub

    C->>S: START_SYNC (Phase 5)
    S->>AV: FETCH_TOP_GAINERS (Filter: Hot Only)
    AV-->>S: Raw Payload (Ticker List)
    
    loop Per Alpha Candidate
        S->>AV: GET_TECHNICALS (RVOL, Relative Str)
        S->>X: GET_MOOD (Xpoz Velocity)
        S->>AI: VIBE_CHECK (Contextual Logic)
        AI-->>S: CONVICTION_SCORE (0-100)
    end
    
    S->>DB: PERSIST_ALPHA (Real-time Save)
    Note over S,DB: 🚀 Data is now live for UI
```

## 🚥 API Health & Mock Strategy

We don't do downtime. If we hit limits, we switch to "Intraday Vibe" (Mock Data).

| Source | Real Data | Mock Threshold | Current Reliability |
|--------|-----------|----------------|---------------------|
| Alpha Vantage | ✅ Live | 25 calls/day | High (Paid Tier compatible) |
| Xpoz | ✅ Live | Limit reached | Medium (Dynamic Poll) |
| Gemini AI | ✅ Live | Error fallback | Elite |

---
> "Institutional-grade vibes aren't built in a day, but they are tracked in milliseconds."
> 
> *Version: Phase 5 (Vibe Check Alpha)*
