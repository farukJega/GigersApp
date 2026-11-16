"use client";

import { useState } from "react";
import { usePublicClient, useWriteContract, useAccount } from "wagmi";
import { ESCROW_ADDRESS, escrowAbi } from "@/lib/contract";
import { arcTestnet } from "@/lib/arc";
import { useLang } from "./LanguageProvider";

export function CancelGig({ id, onDone }: { id: bigint; onDone: () => void }) {
  const { t } = useLang();
  const { chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const { writeContractAsync } = useWriteContract();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    setError("");
    setBusy(true);
    try {
      if (!publicClient) throw new Error("Connect your wallet first.");
      if (chainId !== arcTestnet.id) throw new Error(t("switch_net"));
      const tx = await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: "cancelGig",
        args: [id],
        chainId: arcTestnet.id,
      });
      const rc = await publicClient.waitForTransactionReceipt({ hash: tx });
      if (rc.status !== "success") throw new Error("Transaction failed.");
      onDone();
    } catch (e) {
      const m = e instanceof Error ? ((e as { shortMessage?: string }).shortMessage ?? e.message) : "Something went wrong.";
      setError(/user rejected|denied/i.test(m) ? "You rejected the request in your wallet." : m.slice(0, 200));
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      {!confirm ? (
        <button
          className="w-full rounded-xl border border-line py-3 text-sm font-bold text-red-400"
          onClick={() => setConfirm(true)}
        >
          {t("g_cancel", "Cancel gig and refund")}
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm">{t("g_cancel_q", "Refund the deposit and close this gig?")}</p>
          <div className="grid grid-cols-2 gap-2">
            <button className="rounded-xl border border-line py-2.5 text-sm font-bold" disabled={busy} onClick={() => setConfirm(false)}>
              {t("g_keep", "Keep gig")}
            </button>
            <button className="rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white disabled:opacity-50" disabled={busy} onClick={cancel}>
              {busy ? "..." : t("g_cancel_yes", "Yes, cancel")}
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
