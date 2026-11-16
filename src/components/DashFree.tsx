"use client";

import Link from "next/link";
import { formatUnits } from "viem";
import { USDC_DECIMALS } from "@/lib/contract";
import { useApplied, useMilestonesFor, type Addr, type GigRow } from "@/lib/useGigs";
import { GigCard } from "./GigCard";
import { Empty, Section, Stat } from "./DashParts";
import { useLang } from "./LanguageProvider";

const ZERO = "0x0000000000000000000000000000000000000000";

export function DashFree({ me, rows }: { me: string; rows: GigRow[] }) {
  const { t } = useLang();
  const applied = useApplied(rows.map((g) => g.id), me as Addr);
  const worked = rows.filter((g) => g.worker.toLowerCase() === me);
  const ms = useMilestonesFor(worked.filter((g) => g.status === 1 || g.status === 2).map((g) => g.id));

  const myApps = rows.filter((g) => applied[g.id]);
  const active = worked.filter((g) => g.status === 1);
  const done = worked.filter((g) => g.status === 2);
  const toSubmit = active.filter((g) => (ms[g.id] ?? []).some((m) => m.status === 0));
  const now = Date.now() / 1000;
  const quick = rows.filter(
    (g) =>
      g.meta?.quick &&
      g.status === 0 &&
      g.deadline > now &&
      g.client.toLowerCase() !== me &&
      !applied[g.id]
  );

  let earned = BigInt(0);
  const history: { id: number; index: number; amount: bigint }[] = [];
  for (const g of worked)
    (ms[g.id] ?? []).forEach((m, i) => {
      if (m.status === 2) {
        earned += m.amount;
        history.push({ id: g.id, index: i, amount: m.amount });
      }
    });

  const badge = (g: GigRow) =>
    g.worker.toLowerCase() === me
      ? t("d_chosen", "Chosen")
      : g.worker.toLowerCase() !== ZERO
        ? t("d_notchosen", "Not chosen")
        : g.status === 0
          ? t("d_pending", "Pending")
          : t("d_closed", "Closed");

  const list = (items: GigRow[], withBadge = false) =>
    items.length === 0 ? (
      <Empty />
    ) : (
      items.map((g) => <GigCard key={g.id} g={g} badge={withBadge ? badge(g) : undefined} />)
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <Stat label={t("d_myapps", "My applications")} value={String(myApps.length)} />
        <Stat label={t("d_active", "Active")} value={String(active.length)} />
        <Stat label={t("d_done", "Completed")} value={String(done.length)} />
        <Stat label={t("d_earn", "Earnings")} value={`${formatUnits(earned, USDC_DECIMALS)}`} />
      </div>
      <Section title={t("d_submit", "Work to submit")} count={toSubmit.length}>{list(toSubmit)}</Section>
      <Section title={t("d_active", "Active")} count={active.length}>{list(active)}</Section>
      <Section title={t("d_myapps", "My applications")} count={myApps.length}>{list(myApps, true)}</Section>
      <Section title={t("d_quick", "Quick gigs")} count={quick.length}>{list(quick)}</Section>
      <Section title={t("d_payhist", "Payment history")} count={history.length}>
        {history.length === 0 ? (
          <Empty />
        ) : (
          history.map((h) => (
            <Link
              key={`${h.id}-${h.index}`}
              href={`/gig/${h.id}`}
              className="flex items-center justify-between rounded-xl border border-line bg-card p-3 text-sm"
            >
              <span>Gig #{h.id} / #{h.index + 1}</span>
              <span className="font-bold text-brand">+{formatUnits(h.amount, USDC_DECIMALS)} USDC</span>
            </Link>
          ))
        )}
      </Section>
    </div>
  );
}
