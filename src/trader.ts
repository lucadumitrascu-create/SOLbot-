import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { config } from "./config";

export interface TradeParams {
  /** Token mint address to buy/sell */
  tokenMint: string;
  /** Amount in SOL to spend (for buy) or token amount (for sell) */
  amount: number;
  /** "buy" or "sell" */
  side: "buy" | "sell";
}

/**
 * Example: send SOL to another address.
 * This is a building block — extend it with Jupiter/Raydium swap logic.
 */
export async function sendSol(
  connection: Connection,
  wallet: Keypair,
  recipientAddress: string,
  solAmount: number,
): Promise<string> {
  if (solAmount > config.maxSolPerTrade) {
    throw new Error(
      `Trade exceeds max: ${solAmount} SOL > ${config.maxSolPerTrade} SOL limit`,
    );
  }

  const recipient = new PublicKey(recipientAddress);
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: recipient,
      lamports: Math.round(solAmount * LAMPORTS_PER_SOL),
    }),
  );

  const signature = await sendAndConfirmTransaction(connection, transaction, [wallet]);
  console.log(`Sent ${solAmount} SOL -> ${recipientAddress}`);
  console.log(`  Tx: ${signature}`);
  return signature;
}

/**
 * Swap tokens using Jupiter Aggregator API.
 * Jupiter finds the best route across all Solana DEXes.
 */
export async function swapWithJupiter(
  connection: Connection,
  wallet: Keypair,
  params: TradeParams,
): Promise<string> {
  const SOL_MINT = "So11111111111111111111111111111111111111112";

  const inputMint = params.side === "buy" ? SOL_MINT : params.tokenMint;
  const outputMint = params.side === "buy" ? params.tokenMint : SOL_MINT;
  const amountLamports = Math.round(params.amount * LAMPORTS_PER_SOL);

  if (params.side === "buy" && params.amount > config.maxSolPerTrade) {
    throw new Error(
      `Trade exceeds max: ${params.amount} SOL > ${config.maxSolPerTrade} SOL limit`,
    );
  }

  // Step 1: Get quote from Jupiter
  const quoteUrl =
    `https://quote-api.jup.ag/v6/quote?` +
    `inputMint=${inputMint}&outputMint=${outputMint}` +
    `&amount=${amountLamports}&slippageBps=${config.slippageBps}`;

  console.log(`Fetching Jupiter quote (${params.side} ${params.amount} SOL)...`);
  const quoteRes = await fetch(quoteUrl);
  if (!quoteRes.ok) {
    throw new Error(`Jupiter quote failed: ${quoteRes.statusText}`);
  }
  const quoteData = await quoteRes.json();

  // Step 2: Get swap transaction
  const swapRes = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quoteData,
      userPublicKey: wallet.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
    }),
  });
  if (!swapRes.ok) {
    throw new Error(`Jupiter swap failed: ${swapRes.statusText}`);
  }
  const swapData = (await swapRes.json()) as { swapTransaction: string };

  // Step 3: Deserialize, sign, and send
  const swapTransactionBuf = Buffer.from(swapData.swapTransaction, "base64");
  const transaction = Transaction.from(swapTransactionBuf);
  transaction.sign(wallet);

  const rawTransaction = transaction.serialize();
  const signature = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: false,
    maxRetries: 2,
  });

  await connection.confirmTransaction(signature);
  console.log(`Swap confirmed: ${signature}`);
  return signature;
}
