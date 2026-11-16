import Link from "next/link";
import { Header } from "@/components/Header";
import { ChainStats } from "@/components/ChainStats";
import { GigList } from "@/components/GigList";
import { CategoryIcon } from "@/components/CategoryIcon";
import { T } from "@/components/T";
import { categories } from "@/lib/categories";

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-5">
        <ChainStats />

        <Link
          href="/create"
          className="block rounded-2xl bg-brand py-4 text-center text-base font-extrabold text-brand-ink transition active:scale-[0.98]"
        >
          <T k="post_gig" />
        </Link>

        <section>
          <h2 className="mb-3 text-lg font-bold"><T k="categories" /></h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
                <p className="mt-1 text-xs text-muted">{c.subs.length} <T k="services" /></p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold"><T k="latest" /></h2>
            <Link href="/explore" className="text-sm font-semibold text-brand"><T k="view_all" /></Link>
          </div>
          <GigList limit={5} />
        </section>
      </main>
    </>
  );
}
