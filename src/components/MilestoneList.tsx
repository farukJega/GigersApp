"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { formatUnits } from "viem";
import { ESCROW_ADDRESS, USDC_DECIMALS, escrowAbi } from "@/lib/contract";
import { arcTestnet } from "@/lib/arc";
import { useLang } from "./LanguageProvider";
import { useSession } from "./SessionProvider";
import { FileAttach } from "./FileAttach";
import { WorkView, type WorkOut } from "./WorkView";

type Addr = `0x${string}`;
type MilestoneT = { amount: bigint; workHash: string; submittedAt: bigint; status: number };

const ZERO_HASH = "0x" + "0".repeat(64);
const DAY = 86400;

function friendly(e: unknown) {
  const m =
    e instanceof Error
      ? ((e as { shortMessage?: string }).shortMessage ?? e.message)
      : "Something went wrong.";
  if (/user rejected|denied/i.test(m)) return "You rejected the request in your wallet.";
  return m.length > 220 ? m.slice(0, 220) + "..." : m;
}

export function MilestoneList({
  id,
  client,
  worker,
  deadline,
  gigStatus,
  ms,
  titles,
  onChanged,
}: {
  id: bigint;
  client: Addr;
  worker: Addr;
  deadline: bigint;
  gigStatus: number;
  ms: readonly MilestoneT[];
  titles: string[] | null;
  onChanged: () => void;
}) {
  const { t } = useLang();
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const { writeContractAsync } = useWriteContract();
  const { token, signIn, busy: signing, error: signErr } = useSession();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [links, setLinks] = useState("");
  const [finals, setFinals] = useState("");
  const [files, setFiles] = useState<string[]>([]);

  const { data: arbiter } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: escrowAbi,
    functionName: "arbiter",
    chainId: arcTestnet.id,
  });

  const hashes = ms.map((m) => m.workHash).filter((h) => h && h !== ZERO_HASH);
  const statusKey = ms.map((m) => m.status).join("");
  const { data: works } = useQuery({
    queryKey: ["work", hashes.join(","), statusKey, token],
    enabled: hashes.length > 0 && !!token,
    queryFn: async () => {
      const res = await fetch(`/api/work?hashes=${hashes.join(",")}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return {} as Record<string, WorkOut>;
      return (await res.json()) as Record<string, WorkOut>;
    },
  });

  const me = address?.toLowerCase();
  const isClient = !!me && me === client.toLowerCase();
  const isWorker = !!me && me === worker.toLowerCase();
  const isArbiter = !!me && typeof arbiter === "string" && me === arbiter.toLowerCase();
  const isParty = isClient || isWorker || isArbiter;

  async function send(key: string, fn: () => Promise<Addr>) {
    setError("");
    setBusy(key);
    try {
      if (!publicClient) throw new Error("Connect your wallet first.");
      if (chainId !== arcTestnet.id) throw new Error(t("switch_net"));
      const tx = await fn();
      const rc = await publicClient.waitForTransactionReceipt({ hash: tx });
      if (rc.status !== "success") throw new Error("Transaction failed.");
      onChanged();
    } catch (e) {
      setError(friendly(e));
    } finally {
      setBusy("");
    }
  }

  async function submitWork(index: number) {
    setError("");
    setBusy(`sub${index}`);
    try {
      if (!publicClient) throw new Error("Connect your wallet first.");
      if (chainId !== arcTestnet.id) throw new Error(t("switch_net"));
      const tk = token ?? (await signIn());
      if (!tk) throw new Error("Sign in with your wallet to submit work.");
      const res = await fetch("/api/work", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tk}` },
        body: JSON.stringify({
          gigId: String(id),
          index,
          note,
          links: links.split("\n"),
          finalLinks: finals.split("\n"),
          files,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not save your work.");
      const tx = await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: "submitWork",
        args: [id, BigInt(index), j.hash as Addr],
        chainId: arcTestnet.id,
      });
      const rc = await publicClient.waitForTransactionReceipt({ hash: tx });
      if (rc.status !== "success") throw new Error("Transaction failed.");
      setOpen(null);
      setNote("");
      setLinks("");
      setFinals("");
      setFiles([]);
      onChanged();
    } catch (e) {
      setError(friendly(e));
    } finally {
      setBusy("");
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const active = gigStatus === 1;
  const btn = "rounded-lg px-3 py-2 text-xs font-bold transition active:scale-95 disabled:opacity-50";
  const field = "w-full rounded-xl border border-line bg-card2 px-3 py-2 text-sm outline-none focus:border-brand";

  const call = (fn: "approveMilestone" | "refundMilestone" | "claimAfterTimeout" | "raiseDispute", i: number) =>
    writeContractAsync({
      address: ESCROW_ADDRESS,
      abi: escrowAbi,
      functionName: fn,
      args: [id, BigInt(i)],
      chainId: arcTestnet.id,
    });

  const resolve = (i: number, payWorker: boolean) =>
    writeContractAsync({
      address: ESCROW_ADDRESS,
      abi: escrowAbi,
      functionName: "resolveDispute",
      args: [id, BigInt(i), payWorker],
      chainId: arcTestnet.id,
    });

  return (
    <div className="space-y-2">
      {ms.map((m, i) => {
        const w = works?.[m.workHash.toLowerCase()];
        const hasWork = m.workHash !== ZERO_HASH;
        const claimAt = Number(m.submittedAt) + 7 * DAY;
        const daysLeft = Math.max(1, Math.ceil((claimAt - now) / DAY));
        const canClaim = now > claimAt;
        const canRefund = now > Number(deadline) + 3 * DAY;
        const statusName = gigStatus === 3 && m.status === 0 ? "ms3" : `ms${m.status}`;

        return (
          <div key={i} className="space-y-3 rounded-xl border border-line bg-card p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="min-w-0 truncate">{titles?.[i] ?? `#${i + 1}`}</span>
              <span className="ms-3 shrink-0 text-end">
                <span className="block font-bold">{formatUnits(m.amount, USDC_DECIMALS)} USDC</span>
                <span className="block text-xs text-muted">{t(statusName)}</span>
              </span>
            </div>

            {hasWork &&
              (w ? (
                <WorkView w={w} paid={m.status === 2} />
              ) : !isParty ? (
                <p className="text-xs text-muted">
                  {t("w_private", "Submitted work is private to the client and the freelancer.")}
                </p>
              ) : !token ? (
                <div className="space-y-1">
                  <button
                    className={`${btn} w-full border border-line bg-card2`}
                    disabled={signing}
                    onClick={() => signIn()}
                  >
                    {signing ? "..." : t("w_signin", "Sign in to view submitted work")}
                  </button>
                  {signErr && <p className="text-xs text-red-400">{signErr}</p>}
                </div>
              ) : null)}

            {isWorker && active && m.status === 0 &&
              (open === i ? (
                <div className="space-y-2">
                  <p className="font-bold">{t("w_sub_title")}</p>
                  <textarea className={field} rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("w_note_ph")} />
                  <FileAttach files={files} onChange={setFiles} gigId={String(id)} />
                  <div>
                    <p className="mb-1 text-xs font-semibold text-muted">{t("w_review_links", "Review links")}</p>
                    <textarea className={field} rows={2} value={links} onChange={(e) => setLinks(e.target.value)} placeholder={t("w_links_ph")} />
                    <p className="mt-1 text-xs text-muted">{t("w_review_hint", "The client can open these right away. Do not put the final files here.")}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold text-muted">{t("w_final_links", "Final delivery links")}</p>
                    <textarea className={field} rows={2} value={finals} onChange={(e) => setFinals(e.target.value)} placeholder="https://drive.google.com/..." />
                    <p className="mt-1 text-xs text-muted">{t("w_final_hint", "Shown to the client only after you are paid.")}</p>
                  </div>
                  <p className="text-xs text-muted">{t("w_priv_note", "Only the client, you and the arbiter can see this work. Images are shown to the client as watermarked previews until payment.")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button className={`${btn} border border-line bg-card`} disabled={!!busy} onClick={() => setOpen(null)}>
                      {t("w_cancel")}
                    </button>
                    <button className={`${btn} bg-brand text-brand-ink`} disabled={!!busy} onClick={() => submitWork(i)}>
                      {busy === `sub${i}` ? "..." : t("w_send")}
                    </button>
                  </div>
                </div>
              ) : (
                <button className={`${btn} w-full bg-brand text-brand-ink`} onClick={() => setOpen(i)}>
                  {t("w_submit")}
                </button>
              ))}

            {isClient && active && m.status === 0 &&
              (canRefund ? (
                <button className={`${btn} border border-line bg-card`} disabled={!!busy} onClick={() => send(`ref${i}`, () => call("refundMilestone", i))}>
                  {busy === `ref${i}` ? "..." : t("w_refund")}
                </button>
              ) : (
                <p className="text-xs text-muted">{t("w_wait_worker")}</p>
              ))}

            {m.status === 1 && (
              <div className="flex flex-wrap items-center gap-2">
                {isClient && (
                  <button className={`${btn} bg-brand text-brand-ink`} disabled={!!busy} onClick={() => send(`app${i}`, () => call("approveMilestone", i))}>
                    {busy === `app${i}` ? "..." : t("w_approve")}
                  </button>
                )}
                {isWorker &&
                  (canClaim ? (
                    <button className={`${btn} bg-brand text-brand-ink`} disabled={!!busy} onClick={() => send(`clm${i}`, () => call("claimAfterTimeout", i))}>
                      {busy === `clm${i}` ? "..." : t("w_claim")}
                    </button>
                  ) : (
                    <span className="text-xs text-muted">{t("w_claim_in")} {daysLeft} {t("w_days")}</span>
                  ))}
                {(isClient || isWorker) && (
                  <button className={`${btn} border border-line bg-card`} disabled={!!busy} onClick={() => send(`dsp${i}`, () => call("raiseDispute", i))}>
                    {busy === `dsp${i}` ? "..." : t("w_dispute")}
                  </button>
                )}
                {!isParty && <p className="text-xs text-muted">{t("w_wait_client")}</p>}
              </div>
            )}

            {m.status === 4 &&
              (isArbiter ? (
                <div className="grid grid-cols-2 gap-2">
                  <button className={`${btn} bg-brand text-brand-ink`} disabled={!!busy} onClick={() => send(`rp${i}`, () => resolve(i, true))}>
                    {busy === `rp${i}` ? "..." : t("w_pay_worker")}
                  </button>
                  <button className={`${btn} border border-line bg-card`} disabled={!!busy} onClick={() => send(`rr${i}`, () => resolve(i, false))}>
                    {busy === `rr${i}` ? "..." : t("w_refund_client")}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted">{t("w_wait_arbiter")}</p>
              ))}
          </div>
        );
      })}
      {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
