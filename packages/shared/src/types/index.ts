// ============================================================
// SOLbot Pro - Shared Type Definitions
// ============================================================

// --- User & Auth ---

export interface User {
  wallet_address: string;
  created_at: string;
  subscription_tier: SubscriptionTier;
  subscription_expires_at: string | null;
}

export type SubscriptionTier = "free" | "pro" | "whale";

export interface AuthChallenge {
  nonce: string;
  message: string;
  expires_at: string;
}

export interface AuthPayload {
  wallet_address: string;
  signature: string;
  nonce: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// --- Bot Wallets ---

export interface BotWallet {
  id: string;
  user_wallet: string;
  public_key: string;
  encrypted_private_key: string;
  label: string;
  sol_balance: number;
  created_at: string;
}

// --- Trading ---

export interface TokenInfo {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  supply: number;
  price_usd: number | null;
  market_cap: number | null;
  liquidity_usd: number | null;
}

export interface TradeConfig {
  token_mint: string;
  amount_sol: number;
  slippage_bps: number;
  priority_fee_lamports: number;
}

export type TradeStatus =
  | "pending"
  | "submitted"
  | "confirmed"
  | "failed"
  | "expired";

export interface TradeRecord {
  id: string;
  user_wallet: string;
  bot_wallet: string;
  token_mint: string;
  side: "buy" | "sell";
  amount_sol: number;
  amount_tokens: number | null;
  price_per_token: number | null;
  tx_signature: string | null;
  status: TradeStatus;
  error_message: string | null;
  created_at: string;
  confirmed_at: string | null;
}

// --- Bundler ---

export interface BundleConfig {
  token_mint: string;
  wallets: string[];
  amount_sol_per_wallet: number;
  slippage_bps: number;
  delay_ms: number;
  jito_tip_lamports: number;
}

export interface BundleResult {
  id: string;
  bundle_id: string | null;
  status: "pending" | "sent" | "landed" | "failed";
  transactions: BundleTransaction[];
}

export interface BundleTransaction {
  wallet: string;
  tx_signature: string | null;
  status: TradeStatus;
  error: string | null;
}

// --- Volume Bot ---

export interface VolumeConfig {
  token_mint: string;
  wallets: string[];
  total_volume_sol: number;
  rounds: number;
  min_delay_ms: number;
  max_delay_ms: number;
  buy_sell_ratio: number;
}

export interface VolumeSession {
  id: string;
  user_wallet: string;
  config: VolumeConfig;
  status: "running" | "paused" | "completed" | "stopped";
  rounds_completed: number;
  total_volume_sol: number;
  created_at: string;
}

// --- Sniper ---

export interface SniperConfig {
  token_mint: string | null;
  deployer_address: string | null;
  amount_sol: number;
  max_market_cap: number | null;
  min_liquidity: number | null;
  auto_sell_multiplier: number | null;
  wallets: string[];
}

export interface SniperSession {
  id: string;
  user_wallet: string;
  config: SniperConfig;
  status: "watching" | "triggered" | "completed" | "stopped";
  trigger_tx: string | null;
  created_at: string;
}

// --- API Responses ---

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

// --- WebSocket Events ---

export type WsEvent =
  | { type: "trade_update"; payload: TradeRecord }
  | { type: "bundle_update"; payload: BundleResult }
  | { type: "volume_update"; payload: VolumeSession }
  | { type: "sniper_update"; payload: SniperSession }
  | { type: "balance_update"; payload: { wallet: string; sol_balance: number } }
  | { type: "error"; payload: { message: string } };
