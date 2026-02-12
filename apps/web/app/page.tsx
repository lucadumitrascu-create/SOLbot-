import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Bundler",
    description:
      "Bundle multiple transactions via Jito for simultaneous execution. Launch tokens with coordinated buys across wallets.",
    icon: "M4 6h16M4 12h16M4 18h16",
    gradient: "from-[#9945FF] to-[#7B3FE4]",
  },
  {
    title: "Sniper",
    description:
      "Monitor new token launches and liquidity pools. Auto-buy on detection with configurable filters and limits.",
    icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    gradient: "from-[#14F195] to-[#0BC175]",
  },
  {
    title: "Volume Bot",
    description:
      "Generate organic-looking trading volume across multiple wallets with randomized timing and amounts.",
    icon: "M3 3v18h18M7 16l4-8 4 4 4-6",
    gradient: "from-[#FF6B6B] to-[#EE5A24]",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(153,69,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(153,69,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground">
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-[#14F195]" />
              Built on Solana
            </div>

            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
              <span className="bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
                SOLbot Pro
              </span>
            </h1>

            <p className="mt-4 text-xl text-muted-foreground sm:text-2xl">
              Professional Solana Trading Toolkit
            </p>

            <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Bundle transactions, snipe launches, and generate volume — all
              from a single dashboard. Multi-wallet management with Phantom
              integration.
            </p>

            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button variant="glow" size="lg">
                  Launch App
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                View Docs
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Everything you need to trade
          </h2>
          <p className="mt-4 text-muted-foreground">
            Three powerful tools, one unified platform.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="gradient-border group rounded-xl p-6 transition-transform hover:scale-[1.02]"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${feature.gradient}`}
              >
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={feature.icon}
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-8 sm:px-6 lg:px-8">
          <span className="text-sm text-muted-foreground">
            SOLbot Pro &mdash; Use at your own risk.
          </span>
          <span className="text-sm text-muted-foreground">
            Powered by Solana
          </span>
        </div>
      </footer>
    </div>
  );
}
