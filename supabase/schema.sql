-- Enable the cron extension (Required for autonomous scheduling)
-- Note: This requires a supported Supabase project tier.
create extension if not exists pg_cron;

-- 1. Market Scans Table
-- Logs every execution of the "Dynamic Ticker Selection System"
create table public.market_scans (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  scan_type text check (scan_type in ('pre_market', 'intraday', 'after_hours')),
  tickers_found int default 0,
  status text default 'running' check (status in ('running', 'completed', 'failed')),
  duration_ms int
);

-- 2. Ticker Candidates Table
-- Stores the raw results from the "Wide Net" scanner (e.g., Top Gainers)
-- Use this for debugging why a stock was rejected or accepted.
create table public.ticker_candidates (
  id uuid default gen_random_uuid() primary key,
  scan_id uuid references public.market_scans(id),
  ticker text not null,
  price numeric,
  volume numeric, -- Raw volume at time of scan
  gap_percent numeric,
  rejection_reason text -- e.g., "Low Volume", "High Price", null if accepted
);

-- 3. Analyzed Opportunities Table (The "Shortlist")
-- These are the tickers that passed all filters and received AI Analysis.
create table public.analyzed_opportunities (
  id uuid default gen_random_uuid() primary key,
  scan_id uuid references public.market_scans(id),
  ticker text not null,
  
  -- The Engines Data
  rvol numeric, -- Relative Volume Ratio (e.g., 3.5)
  float_rotation numeric, -- Daily Vol / Float (e.g., 0.8)
  sentiment_velocity numeric, -- Change in sentiment score (e.g., +0.15)
  options_gamma_score numeric, -- Placeholder for future Options Engine
  
  -- The Verdict
  conviction_score int, -- 0-100 derived from the weighted algorithm
  ai_summary text, -- The "Senior Quant" qualitative take
  
  -- Trading Targets (Phase 3)
  take_profit numeric,
  stop_loss numeric,
  risk_reward_ratio numeric,
  
  -- Status
  is_watchlisted boolean default false, -- If true, added to main dashboard
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.market_scans enable row level security;
alter table public.ticker_candidates enable row level security;
alter table public.analyzed_opportunities enable row level security;

-- Create simple policies (Open for now, lock down later as needed)
create policy "Enable all access for anon" on public.market_scans for all using (true) with check (true);
create policy "Enable all access for anon" on public.ticker_candidates for all using (true) with check (true);
create policy "Enable all access for anon" on public.analyzed_opportunities for all using (true) with check (true);
