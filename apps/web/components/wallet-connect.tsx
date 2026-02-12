"use client";

import { useState, useCallback } from "react";
import { Button } from "./ui/button";
import { shortenAddress } from "@solbot/shared";
import { apiFetch } from "@/lib/utils";
import type { AuthChallenge, AuthResponse } from "@solbot/shared";

interface PhantomProvider {
  isPhantom: boolean;
  publicKey: { toBase58: () => string };
  connect: () => Promise<{ publicKey: { toBase58: () => string } }>;
  disconnect: () => Promise<void>;
  signMessage: (
    message: Uint8Array,
    encoding: string
  ) => Promise<{ signature: Uint8Array }>;
}

function getPhantom(): PhantomProvider | null {
  if (typeof window === "undefined") return null;
  const phantom = (window as Record<string, unknown>).solana as
    | PhantomProvider
    | undefined;
  if (phantom?.isPhantom) return phantom;
  return null;
}

export function WalletConnect() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const phantom = getPhantom();
      if (!phantom) {
        window.open("https://phantom.app/", "_blank");
        setError("Phantom wallet not found. Please install it.");
        return;
      }

      // Connect to Phantom
      const { publicKey } = await phantom.connect();
      const walletAddress = publicKey.toBase58();

      // Get challenge nonce from API
      const challenge = await apiFetch<AuthChallenge>(
        `/auth/challenge?wallet=${walletAddress}`
      );

      // Sign the message
      const encodedMessage = new TextEncoder().encode(challenge.message);
      const { signature } = await phantom.signMessage(encodedMessage, "utf8");

      // Verify signature with API
      const auth = await apiFetch<AuthResponse>("/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          wallet_address: walletAddress,
          signature: Buffer.from(signature).toString("base64"),
          nonce: challenge.nonce,
        }),
      });

      // Store JWT token
      localStorage.setItem("solbot_token", auth.token);
      setWallet(walletAddress);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const phantom = getPhantom();
    if (phantom) {
      await phantom.disconnect();
    }
    localStorage.removeItem("solbot_token");
    setWallet(null);
  }, []);

  if (wallet) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-[#14F195]" />
          <span className="text-sm font-mono">{shortenAddress(wallet)}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="glow" onClick={connect} disabled={loading}>
        {loading ? "Connecting..." : "Connect Wallet"}
      </Button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
