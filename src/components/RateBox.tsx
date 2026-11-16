"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, useSignMessage } from "wagmi";
import { keccak256, toHex } from "viem";
import { ratingMessage, type RatingsResp } from "@/lib/rating";
import { useLang } from "./LanguageProvider";

export function RateBox({ gigId }: { gigId: string }) {
  const { t } = useLang();
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const qc = useQueryClient();
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const { data } = useQuery({
    queryKey: ["ratings-gig", gigId],
    queryFn: async () => {
      const res = await fetch(`/api/rating?gig=${gigId}`);
      return (await res.json()) as RatingsResp;
    },
  });

  const me = address?.toLowerCase();
  if (!me) return null;
  const mine = data?.ratings.find((r) => r.rater === me);
  if (mine) {
    return (
      <p className="rounded-2xl bg-ok/15 p-4 text-center text-sm font-bold text-ok">
        {t("g_rated", "You rated")}: {"★".repeat(mine.stars)}
      </p>
    );
  }

  async function submit() {
    setError("");
    setBusy(true);
    try {
      const time = Math.floor(Date.now() / 1000);
      const clean = comment.trim();
      const signature = await signMessageAsync({
        message: ratingMessage(gigId, me as string, stars, keccak256(toHex(clean)), time),
      });
      const res = await fetch("/api/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gigId, rater: me, stars, comment: clean, time, signature }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not save rating.");
      await qc.invalidateQueries({ queryKey: ["ratings-gig", gigId] });
    } catch (e) {
      const m = e instanceof Error ? e.message : "Something went wrong.";
      setError(/rejected|denied/i.test(m) ? "You rejected the signature." : m.slice(0, 200));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-line bg-card p-4">
      <p className="font-bold">{t("g_rate", "Rate this project")}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setStars(n)} className={`text-3xl ${n <= stars ? "text-brand" : "text-line"}`} aria-label={`${n}`}>
            ★
          </button>
        ))}
      </div>
      <textarea
        className="w-full rounded-xl border border-line bg-card2 px-3 py-2 text-sm outline-none focus:border-brand"
        rows={2}
        maxLength={300}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t("g_comment", "Comment (optional)")}
      />
      <p className="text-xs text-muted">{t("p_sign_note", "You will sign a message in your wallet. It costs no gas.")}</p>
      <button className="w-full rounded-xl bg-brand py-3 text-sm font-extrabold text-brand-ink disabled:opacity-50" disabled={busy} onClick={submit}>
        {busy ? "..." : t("g_rate_btn", "Sign and submit rating")}
      </button>
      {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
