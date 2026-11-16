"use client";

import { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { formatUnits } from "viem";
import { categories } from "@/lib/categories";
import { USDC_DECIMALS } from "@/lib/contract";
import { useGigs } from "@/lib/useGigs";
import { GigCard } from "./GigCard";
import { useLang } from "./LanguageProvider";

const PAGE = 8;
const field =
  "w-full rounded-xl border border-line bg-card2 px-3 py-2.5 text-sm outline-none focus:border-brand";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${active ? "border-brand bg-brand text-brand-ink" : "border-line bg-card text-muted"}`}
    >
      {children}
    </button>
  );
}

export function ExploreView() {
  const { t } = useLang();
  const { rows, isLoading } = useGigs(100);
  const [q, setQ] = useState("");
  const [show, setShow] = useState(false);
  const [cat, setCat] = useState("");
  const [sub, setSub] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [until, setUntil] = useState("");
  const [quick, setQuick] = useState(false);
  const [active, setActive] = useState(false);
  const [sort, setSort] = useState("new");
  const [page, setPage] = useState({ key: "", count: PAGE });

  const key = [q, cat, sub, min, max, until, quick, active, sort].join("|");
  const visible = page.key === key ? page.count : PAGE;

  const [now, setNow] = useState(0);
  useEffect(() => { setNow(Date.now() / 1000); }, []);
  const needle = q.trim().toLowerCase();
  const minN = parseFloat(min);
  const maxN = parseFloat(max);
  const untilTs = until ? new Date(until + "T23:59:59").getTime() / 1000 : 0;
  const catObj = categories.find((c) => c.slug === cat);

  let list = rows.filter((g) => {
    const m = g.meta;
    const usdc = Number(formatUnits(g.total, USDC_DECIMALS));
    if (active && !(g.status === 0 && g.deadline > now)) return false;
    if (quick && !m?.quick) return false;
    if (cat && m?.category !== cat) return false;
    if (sub && m?.subcategory !== sub) return false;
    if (!Number.isNaN(minN) && usdc < minN) return false;
    if (!Number.isNaN(maxN) && usdc > maxN) return false;
    if (untilTs && g.deadline > untilTs) return false;
    if (needle) {
      if (!m) return false;
      const hay = [m.title, m.description, m.subcategory, ...m.skills].join(" ").toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
  if (sort === "high") list = [...list].sort((a, b) => (b.total > a.total ? 1 : b.total < a.total ? -1 : 0));
  if (sort === "soon") list = [...list].sort((a, b) => a.deadline - b.deadline);

  const shown = list.slice(0, visible);
  const filtered = !!(q || cat || sub || min || max || until || quick || active || sort !== "new");

  function clear() {
    setQ(""); setCat(""); setSub(""); setMin(""); setMax(""); setUntil("");
    setQuick(false); setActive(false); setSort("new");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">{t("explore_gigs")}</h1>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className={`${field} ps-10`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("x_search", "Search by title or keyword")}
          />
        </div>
        <button
          type="button"
          aria-label={t("x_filters", "Filters")}
          onClick={() => setShow(!show)}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${show ? "border-brand text-brand" : "border-line"} bg-card`}
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={!cat} onClick={() => { setCat(""); setSub(""); }}>{t("x_all", "All")}</Chip>
        {categories.map((c, i) => (
          <Chip key={c.slug} active={cat === c.slug} onClick={() => { setCat(c.slug); setSub(""); }}>
            {t(`c${i}`, c.name)}
          </Chip>
        ))}
      </div>

      {catObj && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip active={!sub} onClick={() => setSub("")}>{t("x_all", "All")}</Chip>
          {catObj.subs.map((s) => (
            <Chip key={s} active={sub === s} onClick={() => setSub(s)}>{s}</Chip>
          ))}
        </div>
      )}

      {show && (
        <div className="space-y-3 rounded-2xl border border-line bg-card p-4">
          <div className="grid grid-cols-2 gap-3">
            <input className={field} inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} placeholder={t("x_min", "Min USDC")} />
            <input className={field} inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value)} placeholder={t("x_max", "Max USDC")} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">{t("x_until", "Due before")}</label>
            <input type="date" className={field} value={until} onChange={(e) => setUntil(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">{t("x_sort", "Sort by")}</label>
            <select className={field} value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="new">{t("x_new", "Newest")}</option>
              <option value="high">{t("x_high", "Highest budget")}</option>
              <option value="soon">{t("x_soon", "Deadline soonest")}</option>
            </select>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-[#ea580c]" checked={active} onChange={(e) => setActive(e.target.checked)} />
            {t("x_open", "Active gigs only")}
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-[#ea580c]" checked={quick} onChange={(e) => setQuick(e.target.checked)} />
            {t("x_quick", "Quick Gigs only")}
          </label>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted">
        <span>{isLoading ? "..." : `${list.length} ${t("x_count", "gigs")}`}</span>
        {filtered && (
          <button type="button" className="font-semibold text-brand" onClick={clear}>
            {t("x_clear", "Clear filters")}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-2xl border border-line bg-card" />
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-card p-8 text-center">
          <p className="font-semibold">{rows.length === 0 ? t("no_gigs") : t("x_none", "No gigs match your filters")}</p>
          {rows.length === 0 && <p className="mt-1 text-sm text-muted">{t("no_gigs_d")}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((g) => (
            <GigCard key={g.id} g={g} />
          ))}
        </div>
      )}

      {list.length > visible && (
        <button
          type="button"
          onClick={() => setPage({ key, count: visible + PAGE })}
          className="w-full rounded-2xl border border-line bg-card py-3.5 font-bold"
        >
          {t("x_more", "Load more")}
        </button>
      )}
    </div>
  );
}
