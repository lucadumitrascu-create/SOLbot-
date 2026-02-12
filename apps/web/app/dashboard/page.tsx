"use client";

import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "SOL Balance", value: "0.00", suffix: "SOL" },
  { label: "Bot Wallets", value: "0", suffix: "" },
  { label: "Active Sessions", value: "0", suffix: "" },
  { label: "Total Trades", value: "0", suffix: "" },
];

const tools = [
  {
    name: "Bundler",
    description: "Bundle multiple buy/sell transactions via Jito",
    status: "Coming Soon",
    color: "from-[#9945FF] to-[#7B3FE4]",
  },
  {
    name: "Sniper",
    description: "Auto-snipe new token launches and liquidity adds",
    status: "Coming Soon",
    color: "from-[#14F195] to-[#0BC175]",
  },
  {
    name: "Volume Bot",
    description: "Generate organic trading volume with multiple wallets",
    status: "Coming Soon",
    color: "from-[#FF6B6B] to-[#EE5A24]",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your wallets and trading tools.
          </p>
        </div>

        {/* Stats Row */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.value}
                  {stat.suffix && (
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      {stat.suffix}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Wallet Management */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Bot Wallets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-12">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    Connect your Phantom wallet to get started.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You&apos;ll be able to create and manage bot wallets from
                    here.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tools Grid */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Trading Tools</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <Card
                key={tool.name}
                className="group cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${tool.color}`}
                    >
                      <span className="text-sm font-bold text-white">
                        {tool.name[0]}
                      </span>
                    </div>
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                      {tool.status}
                    </span>
                  </div>
                  <CardTitle className="mt-3">{tool.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {tool.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
