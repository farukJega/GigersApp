"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { ESCROW_ADDRESS, escrowAbi, USDC_DECIMALS } from "@/lib/contract";
import { arcTestnet } from "@/lib/arc";

const statusNames = ["Open", "In progress", "Completed", "Cancelled"];
const statusStyle = [
  "bg-brand/15 text-brand",
  "bg-warn/15 text-warn",
  "bg-ok/15 text-ok",
  "bg-line text-muted",
];

type GigTuple = readonly [string, string, string, bigint, bigint, bigint, bigint, number];

const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

export function GigList({ limit = 10 }: { limit?: number }) {
  const { data: count, isLoading: loadingCount } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: escrowAbi,
    functionName: "gigCount",
    chainId: arcTestnet.id,
  });

  const total = Number(count ?? 0);
  const ids = Array.from({ length: Math.min(total, limit) }, (_, i) => total - i);

  const { data, isLoading } = useReadContracts({
    contracts: ids.map((id) => ({
      address: ESCROW_ADDRESS,
      abi: escrowAbi,
      functionName: "gigs" as const,
      args: [BigInt(id)] as const,
      chainId: arcTestnet.id,
    })),
    query: { enabled: ids.length > 0 },
  });

  if (loadingCount || (ids.length > 0 && isLoading)) {
    return <div className="h-24 animate-pulse rounded-2xl border border-line bg-card" />;
  }

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-card p-8 text-center">
        <p className="font-semibold">No gigs yet</p>
        <p className="mt-1 text-sm text-muted">Be the first to post a funded gig on Arc Testnet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ids.map((id, i) => {
        const r = data?.[i];
        if (!r || r.status !== "success") return null;
        const g = r.result as unknown as GigTuple;
        const status = Number(g[7]);
        return (
          <div key={id} className="rounded-2xl border border-line bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">Gig #{id}</p>
                <p className="mt-0.5 text-xs text-muted">Client {short(g[0])}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[status] ?? statusStyle[3]}`}>
                {statusNames[status] ?? "Unknown"}
              </span>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <p className="text-2xl font-extrabold text-brand">
                {formatUnits(g[4], USDC_DECIMALS)} <span className="text-sm font-semibold text-muted">USDC</span>
              </p>
              <div className="text-right text-xs text-muted">
                <p>{String(g[5])} applicants</p>
                <p>Due {new Date(Number(g[3]) * 1000).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
