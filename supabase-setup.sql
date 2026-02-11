-- Run this in your Supabase SQL Editor to create the bot_wallets table + RLS

create table if not exists bot_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  public_key text not null,
  private_key text not null,
  phantom_wallet text,
  created_at timestamptz default now()
);

alter table bot_wallets enable row level security;

create policy "Users can read own wallet"
  on bot_wallets for select
  using (auth.uid() = user_id);

create policy "Users can insert own wallet"
  on bot_wallets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own wallet"
  on bot_wallets for update
  using (auth.uid() = user_id);
