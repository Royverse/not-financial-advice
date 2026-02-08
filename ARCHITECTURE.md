# StockNova 2.0 Architecture

This document provides visual diagrams of the StockNova trading intelligence platform.

## System Overview

```mermaid
graph TD
    %% Styling
    classDef external fill:#2d3748,stroke:#4a5568,stroke-width:2px,color:#fff
    classDef core fill:#2c5282,stroke:#4299e1,stroke-width:2px,color:#fff
    classDef ui fill:#276749,stroke:#48bb78,stroke-width:2px,color:#fff
    classDef database fill:#744210,stroke:#ed8936,stroke-width:2px,color:#fff
    classDef engine fill:#44337a,stroke:#9f7aea,stroke-width:2px,color:#fff

    subgraph External["🌐 External APIs"]
        AV[Alpha Vantage<br/>Market Data]:::external
        XP[Xpoz<br/>Social Sentiment]:::external
        GM[Gemini AI<br/>Analysis Engine]:::external
    end

    subgraph Core["⚡ StockNova Core"]
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
```

## Data Flow Sequence

```mermaid
sequenceDiagram
    autonumber
    participant C as ⏰ Cron (3x/Day)
    participant S as 🚀 Scanner
    participant AV as 💹 Alpha Vantage
    participant X as 🐦 Xpoz
    participant AI as 🤖 Gemini
    participant DB as 📁 Supabase

    C->>S: WAKE_UP (9:30, 12:00, 16:00)
    S->>AV: FETCH_TOP_GAINERS
    AV-->>S: Symbols [AAPL, TSLA, NVDA...]
    
    loop Per Hot Candidate (Top 2)
        S->>AV: FETCH_TECHNICALS (RVOL, Float)
        S->>X: FETCH_SENTIMENT (Recent Posts)
        S->>AI: PERFORM_ANALYSIS (Combined Data)
        AI-->>S: RECOMMENDATION + SCORE
    end
    
    S->>DB: PERSIST_OPPORTUNITIES
```

## API Limit Strategy

| Component | Calls/Scan | 3 Scans/Day |
|-----------|------------|-------------|
| Discovery | 1 | 3 |
| Deep Dive (2 tickers × 3 calls) | 6 | 18 |
| **Total** | **7** | **21** |

> ✅ Fits within 25 calls/day free tier limit

## Mock Mode

When API limits are hit, the system automatically switches to mock data:

```mermaid
graph LR
    classDef check fill:#2d3748,stroke:#4a5568,color:#fff
    classDef real fill:#276749,stroke:#48bb78,color:#fff
    classDef mock fill:#744210,stroke:#ed8936,color:#fff

    API[📡 API Call]:::check --> Check{Limit Hit?}:::check
    Check -->|No| Real[✅ Real Data]:::real
    Check -->|Yes| Mock[🚧 Mock Data]:::mock
    Mock --> Tag[🏷️ Tag: mock_intraday]:::mock
```
