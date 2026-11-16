"use client";

import { useReadContract } from "wagmi";
import { ESCROW_ADDRESS, escrowAbi } from "@/lib/contract";
import { arcTestnet } from "@/lib/arc";
import { useLang } from "./LanguageProvider";

export function ChainStats() {
  const { t } = useLang();
  const { data, isLoading, isError } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: escrowAbi,
    functionName: "gigCount",
    chainId: arcTestnet.id,
  });

  const gigs = isLoading ? "..." : isError || data === undefined ? "-" : String(data);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="inv rounded-2xl border border-line p-4">
        <p className="text-xs text-muted">{t("s_gigs")}</p>
        <p className="mt-1 text-4xl font-extrabold text-brand">{gigs}</p>
      </div>
      <a
        href={`https://testnet.arcscan.app/address/${ESCROW_ADDRESS}`}
        target="_blank"
        rel="noreferrer"
        className="rounded-2xl border border-line bg-card p-4"
      >
        <p className="text-xs text-muted">{t("s_contract")}</p>
        <p className="mt-2 font-mono text-sm">{ESCROW_ADDRESS.slice(0, 8)}...{ESCROW_ADDRESS.slice(-4)}</p>
        <p className="mt-1 text-xs font-semibold text-brand">{t("s_view")}</p>
      </a>
    </div>
  );
}
