"use client";

import { useReadContract } from "wagmi";
import { ESCROW_ADDRESS, escrowAbi } from "@/lib/contract";
import { arcTestnet } from "@/lib/arc";

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

export function ChainStats() {
  const { data, isLoading, isError } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: escrowAbi,
    functionName: "gigCount",
    chainId: arcTestnet.id,
  });

  const gigs = isLoading ? "..." : isError || data === undefined ? "-" : String(data);

  return (
    <div className="grid grid-cols-3 gap-3">
      <Tile label="Gigs on-chain" value={gigs} />
      <Tile label="Network" value="Arc" />
      <Tile label="Payments" value="USDC" />
    </div>
  );
}
