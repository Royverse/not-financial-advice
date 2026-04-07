# 🏗️ StockTracker Architecture

This document provides a technical overview of the StockTracker platform, detailing its core components, data flow, and codebase organization.

## 🌌 System Overview

StockTracker is an autonomous stock analysis platform built with a modular, serverless architecture. It optimizes for real-time market data processing and sentiment analysis to provide objective trading insights.

```mermaid
graph TD
    %% Styling
    classDef external fill:#f9f9f9,stroke:#93a1a1,stroke-width:2px,color:#657b83
    classDef core fill:#eee8d5,stroke:#586e75,stroke-width:2px,color:#586e75
    classDef ui fill:#d33682,stroke:#d33682,stroke-width:2px,color:#fff
    classDef database fill:#268bd2,stroke:#268bd2,stroke-width:2px,color:#fff
    classDef engine fill:#6c71c4,stroke:#6c71c4,stroke-width:2px,color:#fff

    subgraph External["🌐 API Sources"]
        AV[Alpha Vantage<br/>Market Intelligence]:::external
        XP[Xpoz<br/>Social Sentiment]:::external
        GM[Gemini AI<br/>Analysis Engine]:::external
    end

    subgraph Core["⚡ Core Engine (src/lib)"]
        direction TB
        SCAN[Scanner Service]:::core
        METRICS[Metrics Engine]:::core
        
        subgraph Analysis["🧠 Analysis Pipeline"]
            E1[RVOL Technical Analysis]:::engine
            E2[Float Liquidity Monitoring]:::engine
            E3[Social Momentum Tracking]:::engine
        end
        
        DB[(Supabase<br/>State Persistence)]:::database
    end

    subgraph UI["📱 Application Layer (src/app)"]
        DASH[Dashboard Container]:::ui
        GALLERY[Market Scanner]:::ui
        PORT[Portfolio Management]:::ui
    end

    SCAN -->|Scan| AV
    SCAN --> Analysis
    Analysis -->|Technical Data| AV
    Analysis -->|Sentiment Data| XP
    Analysis -->|Contextual Analysis| GM
    GM -->|Conviction Scoring| DB
    DB --> DASH
    PORT -.->|Sync State| DB
```

## 📁 Codebase Structure

The project directory is structured for maintainability and scalability, separating core logic from UI components.

```mermaid
graph LR
    Root[src/] --> App[app/]
    Root --> Comp[components/]
    Root --> Lib[lib/]
    Root --> Hooks[hooks/]
    Root --> Cron[cron/]

    subgraph "Routing & Design Tokens"
        App --> Docs[Technical Docs]
        App --> Styles[globals.css]
        App --> Layout[Root Layout]
    end

    subgraph "UI Components"
        Comp --> Dashboard[Dashboard Feature]
        Comp --> Analysis[Analysis Views]
        Comp --> Scanner[Market Scanning]
        Comp --> PortComp[Portfolio View]
        Comp --> UI[Base UI Utilities]
    end

    subgraph "Core Logic"
        Lib --> Services[External Services]
        Services --> Gemini[Gemini AI]
        Services --> Supa[Supabase Client]
        Services --> AV_Svc[Alpha Vantage]
        Services --> Scan_Svc[Scanner Logic]
    end

    subgraph "Automated Operations"
        Cron --> Runner[Analysis Runner]
    end
```

## 🌊 Data Analysis Sequence

The analysis pipeline transforms raw market data into structured convictions through a multi-step process.

```mermaid
sequenceDiagram
    autonumber
    participant C as ⏰ Scheduled Trigger
    participant S as 🚀 Scanner Service
    participant AV as 💹 Market Intelligence
    participant X as 🐦 Social Sentiment
    participant AI as 🧠 AI Processor
    participant DB as 📁 Persistence Layer

    C->>S: INITIALIZE_SYNC
    S->>AV: FETCH_TOP_GAINERS (Intraday)
    AV-->>S: Ticker Symbols
    
    loop Per Target Symbol
        S->>AV: GET_TECHNICAL_METRICS (RVOL, Float)
        S->>X: GET_SOCIAL_SENTIMENT (Xpoz Momentum)
        S->>AI: PERFORM_CONTEXTUAL_ANALYSIS
        AI-->>S: CONVICTION_SCORE (0-10)
    end
    
    S->>DB: PERSIST_ANALYSIS_DATA
    Note over S,DB: Analysis results available in UI
```

## 🚥 API Reliability & Resilience

The platform includes resilience features to handle API availability and rate limiting.

| Source | Status | Resilience Strategy | Availability |
|--------|-----------|----------------|---------------------|
| Alpha Vantage | ✅ Active | Request Throttling | High |
| Xpoz | ✅ Active | Polling with Fallback | Medium |
| Gemini AI | ✅ Active | Error Recovery | High |

---
> "Objective, data-driven analysis for the modern market."
> 
> *Version: Phase 5 (Release Alpha)*
