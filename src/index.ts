import { loadWallet, getConnection, printWalletInfo, requestDevnetAirdrop } from "./wallet";
import { sendSol, swapWithJupiter } from "./trader";
import { config } from "./config";

async function main() {
  console.log("\n  SOLbot - Solana Trading Bot\n");

  // Load wallet from .env private key
  const wallet = loadWallet();
  const connection = getConnection();

  // Show wallet info
  await printWalletInfo(connection, wallet);

  // --- Example usage (uncomment what you need) ---

  // 1. Airdrop on devnet (for testing)
  // await requestDevnetAirdrop(connection, wallet.publicKey, 1);

  // 2. Send SOL to an address
  // await sendSol(connection, wallet, "RecipientAddressHere", 0.01);

  // 3. Swap tokens via Jupiter (buy a token with SOL)
  // await swapWithJupiter(connection, wallet, {
  //   tokenMint: "TokenMintAddressHere",
  //   amount: 0.05,
  //   side: "buy",
  // });

  console.log("Bot is ready. Customize the logic above to start trading.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
