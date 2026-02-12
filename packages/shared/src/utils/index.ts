// ============================================================
// SOLbot Pro - Shared Utilities
// ============================================================

/** Convert lamports to SOL */
export function lamportsToSol(lamports: number): number {
  return lamports / 1e9;
}

/** Convert SOL to lamports */
export function solToLamports(sol: number): number {
  return Math.round(sol * 1e9);
}

/** Format SOL amount for display */
export function formatSol(sol: number, decimals = 4): string {
  return sol.toFixed(decimals);
}

/** Format USD amount for display */
export function formatUsd(usd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usd);
}

/** Format large numbers with K/M/B suffixes */
export function formatCompact(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

/** Shorten a wallet address for display: ABC...XYZ */
export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/** Sleep for a given number of milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Generate a random delay between min and max milliseconds */
export function randomDelay(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

/** Retry a function with exponential backoff */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < maxRetries) {
        await sleep(baseDelayMs * Math.pow(2, i));
      }
    }
  }
  throw lastError;
}

/** Validate a Solana address (base58, 32-44 chars) */
export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/** Create the sign-in message for Phantom wallet auth */
export function createSignInMessage(nonce: string, domain: string): string {
  return [
    `Sign in to SOLbot Pro`,
    ``,
    `Domain: ${domain}`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`,
  ].join("\n");
}

/** Basis points to percentage */
export function bpsToPercent(bps: number): number {
  return bps / 100;
}

/** Percentage to basis points */
export function percentToBps(percent: number): number {
  return Math.round(percent * 100);
}
