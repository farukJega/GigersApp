"use client";

import Link from "next/link";
import { formatUnits } from "viem";
import { USDC_DECIMALS } from "@/lib/contract";
import { categories } from "@/lib/categories";
import type { GigRow } from "@/lib/useGigs";
import { useLang } from "./LanguageProvider";

const statusKeys = ["open", "inprog", "done", "cancelled"];
const statusStyle = [
  "bg-brand/15 text-brand",
  "bg-warn/15 text-warn",
  "bg-ok/15 text-ok",
  "bg-line text-muted",
];
const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

export function GigCard({ g, badge }: { g: GigRow; badge?: string }) {
  const { t } = useLang();
  const m = g.meta;
  const ci = m ? categories.findIndex((c) => c.slug === m.category) : -1;
  const catName = ci >= 0 ? t(`c${ci}`, categories[ci].name) : undefined;
  return (
    <Link
      href={`/gig/${g.id}`}
      className="block rounded-2xl border border-line bg-card p-4 transition active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold">{m?.title ?? `Gig #${g.id}`}</p>
          <p className="mt-0.5 text-xs text-muted">
            {catName ? `${catName} / ${m?.subcategory}` : t("unavail")}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[g.status] ?? statusStyle[3]}`}>
            {t(statusKeys[g.status] ?? "open")}
          </span>
          {badge && (
            <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] font-semibold text-muted">
              {badge}
            </span>
          )}
        </div>
      </div>
      {m && (
        <>
          <p className="mt-2 line-clamp-2 text-sm text-muted">{m.description}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {m.quick && (
              <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-semibold text-brand">Quick Gig</span>
            )}
            {m.skills.slice(0, 4).map((s) => (
              <span key={s} className="rounded-full border border-line bg-card2 px-2.5 py-0.5 text-xs text-muted">{s}</span>
            ))}
          </div>
        </>
      )}
      <div className="mt-3 flex items-end justify-between">
        <p className="text-2xl font-extrabold text-brand">
          {formatUnits(g.total, USDC_DECIMALS)} <span className="text-sm font-semibold text-muted">USDC</span>
        </p>
        <div className="text-end text-xs text-muted">
          <p>{t("client")} {short(g.client)}</p>
          <p>{g.applicants} {t("applicants")}</p>
          <p>{t("due")} {new Date(g.deadline * 1000).toLocaleDateString()}</p>
        </div>
      </div>
    </Link>
  );
}
