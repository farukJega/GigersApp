import { ConnectButton } from "@/components/ConnectButton";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-6">
      <header className="flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight">
          Gigers<span className="text-violet-400">App</span>
        </span>
        <ConnectButton />
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
          Live on Arc Testnet
        </span>
        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
          One Marketplace.
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
            Every Skill.
          </span>
          <br />
          Secure Payments.
        </h1>
        <p className="max-w-md text-slate-400">
          Hire freelancers or find work across 10 categories. Every reward is
          held in USDC escrow on-chain until the work is approved.
        </p>
      </section>
    </main>
  );
}
