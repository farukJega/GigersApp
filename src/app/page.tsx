import Link from "next/link";
import { ShieldCheck, Layers, Link2, Scale, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ChainStats } from "@/components/ChainStats";
import { CategoryIcon } from "@/components/CategoryIcon";
import { T } from "@/components/T";
import { categories } from "@/lib/categories";

const steps = [
  { n: "01", k: "st1" },
  { n: "02", k: "st2" },
  { n: "03", k: "st3" },
];

const features = [
  { Icon: ShieldCheck, k: "f1" },
  { Icon: Layers, k: "f2" },
  { Icon: Link2, k: "f3" },
  { Icon: Scale, k: "f4" },
];

export default function Landing() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <Link
              href="/app"
              className="whitespace-nowrap rounded-xl bg-brand px-3 py-2 text-xs font-bold text-brand-ink transition active:scale-95 sm:px-4 sm:text-sm"
            >
              <T k="launch" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        <section className="py-14 text-center sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-ok" />
            <T k="live" />
          </span>
          <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
            <T k="h1" />
            <br />
            <span className="text-brand"><T k="h2" /></span>
            <br />
            <T k="h3" />
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base text-muted sm:text-lg">
            <T k="hero_sub" />
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/app"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-7 py-4 text-base font-extrabold text-brand-ink transition active:scale-95 sm:w-auto"
            >
              <T k="launch" /> <ArrowRight size={18} />
            </Link>
            <Link
              href="/create"
              className="w-full rounded-2xl border border-line bg-card px-7 py-4 text-center text-base font-bold transition active:scale-95 sm:w-auto"
            >
              <T k="post_gig" />
            </Link>
          </div>
        </section>

        <ChainStats />

        <section className="mt-16">
          <h2 className="text-center text-2xl font-extrabold sm:text-3xl"><T k="how" /></h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="inv rounded-2xl border border-line p-5">
                <p className="text-3xl font-extrabold text-brand">{s.n}</p>
                <h3 className="mt-3 text-lg font-bold"><T k={s.k} /></h3>
                <p className="mt-1 text-sm text-muted"><T k={`${s.k}d`} /></p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-center text-2xl font-extrabold sm:text-3xl"><T k="trust" /></h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {features.map(({ Icon, k }) => (
              <div key={k} className="flex gap-4 rounded-2xl border border-line bg-card p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <Icon size={22} />
                </span>
                <div>
                  <h3 className="font-bold"><T k={k} /></h3>
                  <p className="mt-1 text-sm text-muted"><T k={`${k}d`} /></p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-center text-2xl font-extrabold sm:text-3xl"><T k="cats10" /></h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((c, i) => (
              <Link
                key={c.slug}
                href="/explore"
                className="rounded-2xl border border-line bg-card p-4 transition active:scale-[0.97]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <CategoryIcon name={c.icon} />
                </span>
                <p className="mt-3 text-sm font-bold leading-snug"><T k={`c${i}`} fb={c.name} /></p>
              </Link>
            ))}
          </div>
        </section>

        <section className="inv mt-16 rounded-3xl border border-line p-8 text-center">
          <h2 className="text-2xl font-extrabold sm:text-3xl"><T k="ready" /></h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted"><T k="ready_d" /></p>
          <Link
            href="/app"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-brand px-7 py-4 font-extrabold text-brand-ink transition active:scale-95"
          >
            <T k="launch" /> <ArrowRight size={18} />
          </Link>
        </section>

        <footer className="py-10 text-center text-xs text-muted"><T k="foot" /></footer>
      </main>
    </>
  );
}
