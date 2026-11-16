"use client";

import { useQuery } from "@tanstack/react-query";
import { useReadContract, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { ESCROW_ADDRESS, escrowAbi, USDC_DECIMALS } from "@/lib/contract";
import { arcTestnet } from "@/lib/arc";
import { categories } from "@/lib/categories";
import type { GigMetadata } from "@/lib/metadata";

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

  const hashes = ids
    .map((_, i) => {
      const r = data?.[i];
      return r && r.status === "success" ? (r.result as unknown as GigTuple)[2] : null;
    })
    .filter((h): h is string => !!h);

  const { data: meta } = useQuery({
    queryKey: ["gig-meta", hashes.join(",")],
    enabled: hashes.length > 0,
    queryFn: async () => {
      const res = await fetch(`/api/metadata?hashes=${hashes.join(",")}`);
      return (await res.json()) as Record<string, GigMetadata>;
    },
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
        const m = meta?.[g[2].toLowerCase()];
        const catName = m ? categories.find((c) => c.slug === m.category)?.name : undefined;
        return (
          <div key={id} className="rounded-2xl border border-line bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-bold">{m?.title ?? `Gig #${id}`}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {catName ? `${catName} / ${m?.subcategory}` : "Details unavailable"}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[status] ?? statusStyle[3]}`}>
                {statusNames[status] ?? "Unknown"}
              </span>
            </div>

            {m && (
              <>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{m.description}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.quick && (
                    <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-semibold text-brand">Quick Gig</span>
                  )}
                  {m.skills.slice(0, 4).map((s) => (
                    <span key={s} className="rounded-full border border-line bg-card2 px-2.5 py-0.5 text-xs text-muted">{s}</span>
                  ))}
                </div>
              </>
            )}

            <div className="mt-3 flex items-end justify-between">
              <p className="text-2xl font-extrabold text-brand">
                {formatUnits(g[4], USDC_DECIMALS)} <span className="text-sm font-semibold text-muted">USDC</span>
              </p>
              <div className="text-right text-xs text-muted">
                <p>Client {short(g[0])}</p>
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
