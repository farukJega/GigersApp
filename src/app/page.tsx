import Link from "next/link";
import { ShieldCheck, Layers, Link2, Scale, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChainStats } from "@/components/ChainStats";
import { CategoryIcon } from "@/components/CategoryIcon";
import { categories } from "@/lib/categories";

const steps = [
  { n: "01", t: "Post and fund", d: "The client describes the job and locks the full USDC reward in the escrow contract." },
  { n: "02", t: "Choose and work", d: "Freelancers apply on-chain. The client picks one, who then delivers milestone by milestone." },
  { n: "03", t: "Approve and get paid", d: "Each approved milestone is released straight to the freelancer. No middleman." },
];

const features = [
  { Icon: ShieldCheck, t: "USDC escrow", d: "Rewards are locked in the smart contract before any work starts." },
  { Icon: Layers, t: "Milestone payments", d: "Split bigger projects into milestones that are paid one by one." },
  { Icon: Link2, t: "Verifiable on-chain", d: "Every deposit and payment has a transaction you can check on ArcScan." },
  { Icon: Scale, t: "Dispute resolution", d: "If both sides disagree, an arbiter can resolve the disputed milestone." },
];

export default function Landing() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/app"
              className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-brand-ink transition active:scale-95"
            >
              Launch App
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        <section className="py-14 text-center sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-ok" />
            Live on Arc Testnet
          </span>
          <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
            One Marketplace.
            <br />
            <span className="text-brand">Every Skill.</span>
            <br />
            Secure Payments.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base text-muted sm:text-lg">
            Hire freelancers or find work across 10 categories. Every reward
            sits in USDC escrow on-chain until the work is approved.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/app"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-7 py-4 text-base font-extrabold text-brand-ink transition active:scale-95 sm:w-auto"
            >
              Launch App <ArrowRight size={18} />
            </Link>
            <Link
              href="/create"
              className="w-full rounded-2xl border border-line bg-card px-7 py-4 text-center text-base font-bold transition active:scale-95 sm:w-auto"
            >
              Post a Gig
            </Link>
          </div>
        </section>

        <ChainStats />

        <section className="mt-16">
          <h2 className="text-center text-2xl font-extrabold sm:text-3xl">How it works</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl border border-line bg-card p-5">
                <p className="text-3xl font-extrabold text-brand">{s.n}</p>
                <h3 className="mt-3 text-lg font-bold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-center text-2xl font-extrabold sm:text-3xl">Built for trust</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {features.map(({ Icon, t, d }) => (
              <div key={t} className="flex gap-4 rounded-2xl border border-line bg-card p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <Icon size={22} />
                </span>
                <div>
                  <h3 className="font-bold">{t}</h3>
                  <p className="mt-1 text-sm text-muted">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-center text-2xl font-extrabold sm:text-3xl">10 categories, every skill</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href="/explore"
                className="rounded-2xl border border-line bg-card p-4 transition active:scale-[0.97]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <CategoryIcon name={c.icon} />
                </span>
                <p className="mt-3 text-sm font-bold leading-snug">{c.name}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-line bg-card p-8 text-center">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Ready to get started?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Connect your wallet, grab test USDC from the Circle faucet, and try
            a funded gig on Arc Testnet.
          </p>
          <Link
            href="/app"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-brand px-7 py-4 font-extrabold text-brand-ink transition active:scale-95"
          >
            Launch App <ArrowRight size={18} />
          </Link>
        </section>

        <footer className="py-10 text-center text-xs text-muted">
          GigersApp runs on Arc Testnet. Test funds only, no real money.
        </footer>
      </main>
    </>
  );
}
