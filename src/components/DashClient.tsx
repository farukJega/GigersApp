"use client";

import { formatUnits } from "viem";
import { USDC_DECIMALS } from "@/lib/contract";
import { useMilestonesFor, type GigRow } from "@/lib/useGigs";
import { GigCard } from "./GigCard";
import { Empty, Section, Stat } from "./DashParts";
import { useLang } from "./LanguageProvider";

export function DashClient({ me, rows }: { me: string; rows: GigRow[] }) {
  const { t } = useLang();
  const mine = rows.filter((g) => g.client.toLowerCase() === me);
  const ms = useMilestonesFor(mine.filter((g) => g.status === 1 || g.status === 2).map((g) => g.id));

  const open = mine.filter((g) => g.status === 0);
  const active = mine.filter((g) => g.status === 1);
  const done = mine.filter((g) => g.status === 2);
  const withApplicants = open.filter((g) => g.applicants > 0);
  const review = active.filter((g) => (ms[g.id] ?? []).some((m) => m.status === 1));
  const disputes = active.filter((g) => (ms[g.id] ?? []).some((m) => m.status === 4));
  let paid = BigInt(0);
  for (const g of mine) for (const m of ms[g.id] ?? []) if (m.status === 2) paid += m.amount;

  const list = (items: GigRow[]) =>
    items.length === 0 ? <Empty /> : items.map((g) => <GigCard key={g.id} g={g} />);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <Stat label={t("d_posted", "Posted")} value={String(mine.length)} />
        <Stat label={t("d_open", "Open")} value={String(open.length)} />
        <Stat label={t("d_active", "Active")} value={String(active.length)} />
        <Stat label={t("d_done", "Completed")} value={String(done.length)} />
      </div>
      <div className="inv rounded-2xl border border-line p-4">
        <p className="text-xs text-muted">{t("d_paid", "Total paid out")}</p>
        <p className="text-2xl font-extrabold text-brand">
          {formatUnits(paid, USDC_DECIMALS)} <span className="text-sm text-muted">USDC</span>
        </p>
      </div>
      <Section title={t("d_review", "Needs your review")} count={review.length}>{list(review)}</Section>
      <Section title={t("d_apps", "Applicants")} count={withApplicants.length}>{list(withApplicants)}</Section>
      <Section title={t("d_active", "Active")} count={active.length}>{list(active)}</Section>
      <Section title={t("d_disputes", "Disputes")} count={disputes.length}>{list(disputes)}</Section>
      <Section title={t("d_mygigs", "My gigs")} count={mine.length}>{list(mine)}</Section>
    </div>
  );
}
