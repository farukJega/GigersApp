import { Header } from "@/components/Header";
import { GigList } from "@/components/GigList";
import { CategoryIcon } from "@/components/CategoryIcon";
import { categories } from "@/lib/categories";

export default function Explore() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-5">
        <section>
          <h1 className="mb-3 text-xl font-extrabold">Explore Gigs</h1>
          <GigList limit={20} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Browse by category</h2>
          <div className="space-y-3">
            {categories.map((c) => (
              <div key={c.slug} className="rounded-2xl border border-line bg-card p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
                    <CategoryIcon name={c.icon} />
                  </span>
                  <div>
                    <p className="font-bold">{c.name}</p>
                    <p className="text-xs text-muted">{c.desc}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.subs.map((s) => (
                    <span key={s} className="rounded-full border border-line bg-card2 px-3 py-1 text-xs text-muted">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
