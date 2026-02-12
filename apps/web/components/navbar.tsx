"use client";

import Link from "next/link";
import { WalletConnect } from "./wallet-connect";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#9945FF] to-[#14F195]">
            <span className="text-sm font-bold text-white">S</span>
          </div>
          <span className="text-lg font-bold">
            SOL<span className="text-[#14F195]">bot</span>{" "}
            <span className="text-xs text-muted-foreground">PRO</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Docs
          </Link>
        </div>

        <WalletConnect />
      </div>
    </nav>
  );
}
