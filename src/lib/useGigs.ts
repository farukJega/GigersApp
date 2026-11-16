"use client";

import { useQuery } from "@tanstack/react-query";
import { useReadContract, useReadContracts } from "wagmi";
import { ESCROW_ADDRESS, escrowAbi } from "./contract";
import { arcTestnet } from "./arc";
import type { GigMetadata } from "./metadata";

export type Addr = `0x${string}`;
export type MilestoneT = { amount: bigint; workHash: string; submittedAt: bigint; status: number };
export type GigRow = {
  id: number;
  client: Addr;
  worker: Addr;
  hash: Addr;
  deadline: number;
  total: bigint;
  applicants: number;
  resolved: number;
  status: number;
  meta?: GigMetadata;
};

type GigTuple = readonly [Addr, Addr, Addr, bigint, bigint, bigint, bigint, number];

export function useGigs(max = 100) {
  const { data: count, isLoading: l1 } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: escrowAbi,
    functionName: "gigCount",
    chainId: arcTestnet.id,
  });
  const total = Number(count ?? 0);
  const ids = Array.from({ length: Math.min(total, max) }, (_, i) => total - i);

  const { data, isLoading: l2 } = useReadContracts({
    contracts: ids.map((id) => ({
      address: ESCROW_ADDRESS,
      abi: escrowAbi,
      functionName: "gigs" as const,
      args: [BigInt(id)] as const,
      chainId: arcTestnet.id,
    })),
    query: { enabled: ids.length > 0 },
  });

  const base: GigRow[] = [];
  ids.forEach((id, i) => {
    const r = data?.[i];
    if (!r || r.status !== "success") return;
    const g = r.result as unknown as GigTuple;
    base.push({
      id,
      client: g[0],
      worker: g[1],
      hash: g[2],
      deadline: Number(g[3]),
      total: g[4],
      applicants: Number(g[5]),
      resolved: Number(g[6]),
      status: Number(g[7]),
    });
  });

  const hashes = base.map((g) => g.hash);
  const { data: meta, isLoading: l3 } = useQuery({
    queryKey: ["gig-meta-all", hashes.join(",")],
    enabled: hashes.length > 0,
    queryFn: async () => {
      const res = await fetch(`/api/metadata?hashes=${hashes.join(",")}`);
      return (await res.json()) as Record<string, GigMetadata>;
    },
  });

  const rows: GigRow[] = base.map((g) => ({ ...g, meta: meta?.[g.hash.toLowerCase()] }));
  return { rows, total, isLoading: l1 || (ids.length > 0 && (l2 || l3)) };
}

export function useMilestonesFor(ids: number[]) {
  const { data } = useReadContracts({
    contracts: ids.map((id) => ({
      address: ESCROW_ADDRESS,
      abi: escrowAbi,
      functionName: "getMilestones" as const,
      args: [BigInt(id)] as const,
      chainId: arcTestnet.id,
    })),
    query: { enabled: ids.length > 0 },
  });
  const out: Record<number, MilestoneT[]> = {};
  ids.forEach((id, i) => {
    const r = data?.[i];
    if (r && r.status === "success") out[id] = r.result as unknown as MilestoneT[];
  });
  return out;
}

export function useApplied(ids: number[], me?: Addr) {
  const { data } = useReadContracts({
    contracts: ids.map((id) => ({
      address: ESCROW_ADDRESS,
      abi: escrowAbi,
      functionName: "hasApplied" as const,
      args: [BigInt(id), me as Addr] as const,
      chainId: arcTestnet.id,
    })),
    query: { enabled: !!me && ids.length > 0 },
  });
  const out: Record<number, boolean> = {};
  ids.forEach((id, i) => {
    const r = data?.[i];
    if (r && r.status === "success") out[id] = r.result === true;
  });
  return out;
}
