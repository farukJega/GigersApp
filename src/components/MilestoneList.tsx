"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { formatUnits } from "viem";
import { ESCROW_ADDRESS, USDC_DECIMALS, escrowAbi } from "@/lib/contract";
import { arcTestnet } from "@/lib/arc";
import type { WorkSubmission } from "@/lib/work";
import { useLang } from "./LanguageProvider";
import { FileAttach, WorkFiles } from "./FileAttach";

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
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [links, setLinks] = useState("");
  const [files, setFiles] = useState<string[]>([]);

  const { data: arbiter } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: escrowAbi,
    functionName: "arbiter",
    chainId: arcTestnet.id,
  });

  const hashes = ms.map((m) => m.workHash).filter((h) => h && h !== ZERO_HASH);
  const { data: works } = useQuery({
    queryKey: ["work", hashes.join(",")],
    enabled: hashes.length > 0,
    queryFn: async () => {
      const res = await fetch(`/api/work?hashes=${hashes.join(",")}`);
      return (await res.json()) as Record<string, WorkSubmission>;
    },
  });

  const me = address?.toLowerCase();
  const isClient = !!me && me === client.toLowerCase();
  const isWorker = !!me && me === worker.toLowerCase();
  const isArbiter = !!me && typeof arbiter === "string" && me === arbiter.toLowerCase();

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
      const res = await fetch("/api/work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gigId: String(id), index, note, links: links.split("\n"), files }),
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
  const btn =
    "rounded-lg px-3 py-2 text-xs font-bold transition active:scale-95 disabled:opacity-50";
  const field =
    "w-full rounded-xl border border-line bg-card2 px-3 py-2 text-sm outline-none focus:border-brand";

  const call = (fn: "approveMilestone" | "refundMilestone" | "claimAfterTimeout" | "raiseDispute", i: number) =>
    writeContractAsync({
      address: ESCROW_ADDRESS,
      abi: escrowAbi,
      functionName: fn,
      args: [id, BigInt(i)],
      chainId: arcTestnet.id,
    });

  return (
    <div className="space-y-2">
      {ms.map((m, i) => {
        const w = works?.[m.workHash.toLowerCase()];
        const claimAt = Number(m.submittedAt) + 7 * DAY;
        const daysLeft = Math.max(1, Math.ceil((claimAt - now) / DAY));
        const canClaim = now > claimAt;
        const canRefund = now > Number(deadline) + 3 * DAY;
        const statusKey = gigStatus === 3 && m.status === 0 ? "ms3" : `ms${m.status}`;

        return (
          <div key={i} className="space-y-3 rounded-xl border border-line bg-card p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="min-w-0 truncate">{titles?.[i] ?? `#${i + 1}`}</span>
              <span className="ms-3 shrink-0 text-end">
                <span className="block font-bold">{formatUnits(m.amount, USDC_DECIMALS)} USDC</span>
                <span className="block text-xs text-muted">{t(statusKey)}</span>
              </span>
            </div>

            {w && (
              <div className="rounded-lg bg-card2 p-3">
                <p className="mb-1 text-xs font-bold text-muted">{t("w_work")}</p>
                {w.note && <p className="whitespace-pre-wrap text-sm">{w.note}</p>}
                <WorkFiles ids={w.files ?? []} />
                {(w.links ?? [])
                  .filter((l) => /^https?:\/\//i.test(l))
                  .map((l) => (
                    <a
                      key={l}
                      href={l}
                      target="_blank"
                      rel="noopener noreferrer nofollow ugc"
                      className="mt-1 block break-all text-sm font-semibold text-brand"
                    >
                      {l}
                    </a>
                  ))}
              </div>
            )}

            {isWorker && active && m.status === 0 &&
              (open === i ? (
                <div className="space-y-2">
                  <p className="font-bold">{t("w_sub_title")}</p>
                  <textarea className={field} rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("w_note_ph")} />
                  <textarea className={field} rows={2} value={links} onChange={(e) => setLinks(e.target.value)} placeholder={t("w_links_ph")} />
                  <FileAttach files={files} onChange={setFiles} />
                  <p className="text-xs text-muted">{t("w_public")}</p>
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
                {!isClient && !isWorker && <p className="text-xs text-muted">{t("w_wait_client")}</p>}
              </div>
            )}

            {m.status === 4 &&
              (isArbiter ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={`${btn} bg-brand text-brand-ink`}
                    disabled={!!busy}
                    onClick={() =>
                      send(`rp${i}`, () =>
                        writeContractAsync({ address: ESCROW_ADDRESS, abi: escrowAbi, functionName: "resolveDispute", args: [id, BigInt(i), true], chainId: arcTestnet.id })
                      )
                    }
                  >
                    {busy === `rp${i}` ? "..." : t("w_pay_worker")}
                  </button>
                  <button
                    className={`${btn} border border-line bg-card`}
                    disabled={!!busy}
                    onClick={() =>
                      send(`rr${i}`, () =>
                        writeContractAsync({ address: ESCROW_ADDRESS, abi: escrowAbi, functionName: "resolveDispute", args: [id, BigInt(i), false], chainId: arcTestnet.id })
                      )
                    }
                  >
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
