import Link from "next/link";
import { Header } from "@/components/Header";
import { ChainStats } from "@/components/ChainStats";

const steps = [
  { n: "1", t: "Post and fund", d: "The client locks the full USDC reward in the escrow contract." },
  { n: "2", t: "Work and submit", d: "The chosen freelancer delivers the work, milestone by milestone." },
  { n: "3", t: "Approve and get paid", d: "Approved milestones are released on-chain. No middleman." },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-16">
        <section className="py-12 text-center sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-ok" />
            Live on Arc Testnet
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-6xl">
            One Marketplace.
            <br />
            <span className="bg-gradient-to-r from-brand2 to-brand bg-clip-text text-transparent">
              Every Skill.
            </span>
            <br />
            Secure Payments.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-muted">
            Hire freelancers or find work across 10 categories. Every reward is
            held in USDC escrow on-chain until the work is approved.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/explore"
              className="w-full rounded-2xl bg-gradient-to-r from-brand2 to-brand px-6 py-3.5 text-center font-semibold text-white transition active:scale-95 sm:w-auto"
            >
              Explore Gigs
            </Link>
            <Link
              href="/create"
              className="w-full rounded-2xl border border-line bg-card px-6 py-3.5 text-center font-semibold transition active:scale-95 sm:w-auto"
            >
              Post a Gig
            </Link>
          </div>
        </section>

        <ChainStats />

        <section className="mt-10 grid gap-3 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-line bg-card p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-card2 text-sm font-bold text-brand">
                {s.n}
              </span>
              <h3 className="mt-3 font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted">{s.d}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
