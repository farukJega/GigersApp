"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { formatUnits, isAddress } from "viem";
import { categories } from "@/lib/categories";
import { USDC_DECIMALS } from "@/lib/contract";
import type { Profile } from "@/lib/profile";
import type { RatingsResp } from "@/lib/rating";
import { useGigs, useMilestonesFor } from "@/lib/useGigs";
import { Avatar } from "./Avatar";
import { GigCard } from "./GigCard";
import { ProfileForm } from "./ProfileForm";
import { useLang } from "./LanguageProvider";

const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-3">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-extrabold text-brand">{value}</p>
    </div>
  );
}

export function ProfileView() {
  const { t } = useLang();
  const params = useParams<{ address: string }>();
  const raw = params?.address ?? "";
  const valid = isAddress(raw);
  const addr = raw.toLowerCase();
  const { address: me } = useAccount();
  const isMe = !!me && me.toLowerCase() === addr;
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const { rows } = useGigs(100);

  const { data: profile } = useQuery({
    queryKey: ["profile", addr],
    enabled: valid,
    queryFn: async () => {
      const res = await fetch(`/api/profile?address=${addr}`);
      const j = await res.json();
      return (j.profile ?? null) as Profile | null;
    },
  });
  const { data: rating } = useQuery({
    queryKey: ["ratings", addr],
    enabled: valid,
    queryFn: async () => {
      const res = await fetch(`/api/rating?address=${addr}`);
      return (await res.json()) as RatingsResp;
    },
  });

  const posted = rows.filter((g) => g.client.toLowerCase() === addr);
  const worked = rows.filter((g) => g.worker.toLowerCase() === addr);
  const ms = useMilestonesFor(worked.filter((g) => g.status === 1 || g.status === 2).map((g) => g.id));

  if (!valid) {
    return <div className="rounded-2xl border border-dashed border-line bg-card p-8 text-center font-semibold">{t("p_invalid", "Invalid address")}</div>;
  }

  let earned = BigInt(0);
  const history: { id: number; index: number; amount: bigint }[] = [];
  for (const g of worked)
    (ms[g.id] ?? []).forEach((m, i) => {
      if (m.status === 2) {
        earned += m.amount;
        history.push({ id: g.id, index: i, amount: m.amount });
      }
    });
  const deposited = posted.filter((g) => g.status !== 3).reduce((a, g) => a + g.total, BigInt(0));
  const doneWork = worked.filter((g) => g.status === 2).length;
  const donePosted = posted.filter((g) => g.status === 2).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar address={addr} name={profile?.name} size={72} />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold">{profile?.name || short(addr)}</h1>
          {profile?.title && <p className="text-sm text-muted">{profile.title}</p>}
          {profile?.company && <p className="text-xs text-muted">{profile.company}</p>}
          <a
            href={`https://testnet.arcscan.app/address/${addr}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs font-semibold text-brand"
          >
            {short(addr)} · {t("p_view_scan", "View on ArcScan")}
          </a>
        </div>
      </div>

      <section>
        <p className="mb-2 text-xs font-bold text-ok">{t("p_onchain", "Verified on-chain")}</p>
        <div className="grid grid-cols-2 gap-3">
          <Tile label={t("p_posted", "Jobs posted")} value={String(posted.length)} />
          <Tile label={t("p_completed", "Jobs completed")} value={String(doneWork + donePosted)} />
          <Tile label={t("p_earned", "Total earned")} value={`${formatUnits(earned, USDC_DECIMALS)} USDC`} />
          <Tile label={t("p_deposited", "Total deposited")} value={`${formatUnits(deposited, USDC_DECIMALS)} USDC`} />
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold text-muted">{t("p_offchain", "Self-reported (off-chain)")}</p>
          {isMe && !editing && (
            <button className="text-sm font-semibold text-brand" onClick={() => setEditing(true)}>
              {t("p_edit", "Edit profile")}
            </button>
          )}
        </div>
        {editing ? (
          <ProfileForm
            address={addr}
            profile={profile ?? null}
            onClose={() => setEditing(false)}
            onSaved={async () => {
              await qc.invalidateQueries({ queryKey: ["profile", addr] });
              setEditing(false);
            }}
          />
        ) : !profile ? (
          <p className="rounded-2xl border border-dashed border-line bg-card p-5 text-center text-sm text-muted">{t("p_noprofile", "No profile details yet")}</p>
        ) : (
          <div className="space-y-3 rounded-2xl border border-line bg-card p-4 text-sm">
            {profile.bio && <p className="whitespace-pre-wrap text-muted">{profile.bio}</p>}
            {profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s) => (
                  <span key={s} className="rounded-full border border-line bg-card2 px-2.5 py-0.5 text-xs text-muted">{s}</span>
                ))}
              </div>
            )}
            {profile.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.categories.map((c) => {
                  const i = categories.findIndex((x) => x.slug === c);
                  return i >= 0 ? (
                    <span key={c} className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-semibold text-brand">{t(`c${i}`, categories[i].name)}</span>
                  ) : null;
                })}
              </div>
            )}
            {profile.links.filter((l) => /^https?:\/\//i.test(l)).map((l) => (
              <a key={l} href={l} target="_blank" rel="noopener noreferrer nofollow ugc" className="block break-all font-semibold text-brand">{l}</a>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-bold">
          {t("p_reviews", "Client feedback")}
          {rating && rating.count > 0 && (
            <span className="ms-2 text-sm font-semibold text-brand">★ {rating.avg.toFixed(1)} ({rating.count})</span>
          )}
        </h2>
        {!rating || rating.count === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-card p-5 text-center text-sm text-muted">{t("p_noreviews", "No reviews yet")}</p>
        ) : (
          <div className="space-y-2">
            {rating.ratings.map((r) => (
              <div key={`${r.gig_id}-${r.rater}`} className="rounded-xl border border-line bg-card p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-brand">{"★".repeat(r.stars)}</span>
                  <Link href={`/gig/${r.gig_id}`} className="text-xs text-muted">Gig #{r.gig_id}</Link>
                </div>
                {r.comment && <p className="mt-1 text-muted">{r.comment}</p>}
                <Link href={`/profile/${r.rater}`} className="mt-1 block font-mono text-xs text-muted">{short(r.rater)}</Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-bold">{t("p_hist", "Verified payment history")}</h2>
        {history.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-card p-5 text-center text-sm text-muted">{t("d_none", "Nothing here yet")}</p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <Link key={`${h.id}-${h.index}`} href={`/gig/${h.id}`} className="flex items-center justify-between rounded-xl border border-line bg-card p-3 text-sm">
                <span>Gig #{h.id} / #{h.index + 1}</span>
                <span className="font-bold text-brand">{formatUnits(h.amount, USDC_DECIMALS)} USDC</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {posted.length > 0 && (
        <section>
          <h2 className="mb-2 font-bold">{t("d_mygigs", "My gigs")}</h2>
          <div className="space-y-3">
            {posted.slice(0, 5).map((g) => (
              <GigCard key={g.id} g={g} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
