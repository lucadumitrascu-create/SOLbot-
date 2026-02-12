-- ============================================================
-- SOLbot Pro - Complete Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. USERS
-- ============================================================
drop table if exists volume_sessions cascade;
drop table if exists sniper_sessions cascade;
drop table if exists bundle_transactions cascade;
drop table if exists bundles cascade;
drop table if exists trades cascade;
drop table if exists bot_wallets cascade;
drop table if exists users cascade;

create table users (
  wallet_address text primary key,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'pro', 'whale')),
  subscription_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. BOT WALLETS
-- ============================================================
create table bot_wallets (
  id uuid primary key default uuid_generate_v4(),
  user_wallet text not null references users(wallet_address) on delete cascade,
  public_key text not null unique,
  encrypted_private_key text not null,
  label text not null default 'Untitled',
  sol_balance numeric(20, 9) not null default 0,
  created_at timestamptz not null default now()
);

create index idx_bot_wallets_user on bot_wallets(user_wallet);

-- ============================================================
-- 3. TRADES
-- ============================================================
create table trades (
  id uuid primary key default uuid_generate_v4(),
  user_wallet text not null references users(wallet_address) on delete cascade,
  bot_wallet_id uuid not null references bot_wallets(id) on delete cascade,
  token_mint text not null,
  side text not null check (side in ('buy', 'sell')),
  amount_sol numeric(20, 9) not null,
  amount_tokens numeric(30, 9),
  price_per_token numeric(30, 18),
  tx_signature text,
  status text not null default 'pending' check (status in ('pending', 'submitted', 'confirmed', 'failed', 'expired')),
  error_message text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index idx_trades_user on trades(user_wallet);
create index idx_trades_status on trades(status);
create index idx_trades_token on trades(token_mint);

-- ============================================================
-- 4. BUNDLES
-- ============================================================
create table bundles (
  id uuid primary key default uuid_generate_v4(),
  user_wallet text not null references users(wallet_address) on delete cascade,
  token_mint text not null,
  jito_bundle_id text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'landed', 'failed')),
  wallet_count int not null default 0,
  total_sol numeric(20, 9) not null default 0,
  created_at timestamptz not null default now()
);

create table bundle_transactions (
  id uuid primary key default uuid_generate_v4(),
  bundle_id uuid not null references bundles(id) on delete cascade,
  bot_wallet_id uuid not null references bot_wallets(id) on delete cascade,
  tx_signature text,
  status text not null default 'pending' check (status in ('pending', 'submitted', 'confirmed', 'failed', 'expired')),
  error_message text,
  created_at timestamptz not null default now()
);

create index idx_bundles_user on bundles(user_wallet);
create index idx_bundle_txs_bundle on bundle_transactions(bundle_id);

-- ============================================================
-- 5. SNIPER SESSIONS
-- ============================================================
create table sniper_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_wallet text not null references users(wallet_address) on delete cascade,
  token_mint text,
  deployer_address text,
  amount_sol numeric(20, 9) not null,
  max_market_cap numeric(30, 2),
  min_liquidity numeric(20, 2),
  auto_sell_multiplier numeric(5, 2),
  status text not null default 'watching' check (status in ('watching', 'triggered', 'completed', 'stopped')),
  trigger_tx text,
  created_at timestamptz not null default now()
);

create index idx_sniper_user on sniper_sessions(user_wallet);
create index idx_sniper_status on sniper_sessions(status);

-- ============================================================
-- 6. VOLUME SESSIONS
-- ============================================================
create table volume_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_wallet text not null references users(wallet_address) on delete cascade,
  token_mint text not null,
  total_volume_sol numeric(20, 9) not null default 0,
  rounds_total int not null default 0,
  rounds_completed int not null default 0,
  min_delay_ms int not null default 1000,
  max_delay_ms int not null default 5000,
  buy_sell_ratio numeric(5, 2) not null default 1.0,
  status text not null default 'running' check (status in ('running', 'paused', 'completed', 'stopped')),
  created_at timestamptz not null default now()
);

create index idx_volume_user on volume_sessions(user_wallet);
create index idx_volume_status on volume_sessions(status);

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================
alter table users enable row level security;
alter table bot_wallets enable row level security;
alter table trades enable row level security;
alter table bundles enable row level security;
alter table bundle_transactions enable row level security;
alter table sniper_sessions enable row level security;
alter table volume_sessions enable row level security;

-- Service role policies (API server uses service key)
create policy "Service manages users" on users for all using (true) with check (true);
create policy "Service manages bot_wallets" on bot_wallets for all using (true) with check (true);
create policy "Service manages trades" on trades for all using (true) with check (true);
create policy "Service manages bundles" on bundles for all using (true) with check (true);
create policy "Service manages bundle_txs" on bundle_transactions for all using (true) with check (true);
create policy "Service manages sniper" on sniper_sessions for all using (true) with check (true);
create policy "Service manages volume" on volume_sessions for all using (true) with check (true);

-- ============================================================
-- 8. UPDATED_AT TRIGGER
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on users
  for each row execute function update_updated_at();
