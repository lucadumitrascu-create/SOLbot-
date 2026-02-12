-- Run this in your Supabase SQL Editor
-- Phantom Wallet-based auth (no Supabase Auth)

-- Drop old table if it exists (was linked to auth.users)
drop table if exists bot_wallets;

-- Users table (wallet-based, no email/password)
create table if not exists users (
  wallet_address text primary key,
  created_at timestamptz default now()
);

-- Bot wallets table
create table if not exists bot_wallets (
  wallet_address text primary key references users(wallet_address) on delete cascade,
  public_key text not null,
  private_key text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table users enable row level security;
alter table bot_wallets enable row level security;

-- Permissive policies (security enforced by Express server middleware)
create policy "Server manages users" on users for all using (true) with check (true);
create policy "Server manages bot_wallets" on bot_wallets for all using (true) with check (true);
