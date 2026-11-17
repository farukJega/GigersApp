import { serverClient } from "./chain";
import { ESCROW_ADDRESS, escrowAbi } from "./contract";

const ZERO = "0x0000000000000000000000000000000000000000";

export type GigAccess = {
  client: string;
  worker: string;
  arbiter: string;
  status: number;
  ms: { status: number; workHash: string }[];
};
export type Role = "client" | "worker" | "arbiter" | null;

export async function loadGig(gigId: number): Promise<GigAccess | null> {
  try {
    const id = BigInt(gigId);
    const [g, ms, arbiter] = await Promise.all([
      serverClient.readContract({ address: ESCROW_ADDRESS, abi: escrowAbi, functionName: "gigs", args: [id] }),
      serverClient.readContract({ address: ESCROW_ADDRESS, abi: escrowAbi, functionName: "getMilestones", args: [id] }),
      serverClient.readContract({ address: ESCROW_ADDRESS, abi: escrowAbi, functionName: "arbiter" }),
    ]);
    if (g[0].toLowerCase() === ZERO) return null;
    return {
      client: g[0].toLowerCase(),
      worker: g[1].toLowerCase(),
      arbiter: String(arbiter).toLowerCase(),
      status: Number(g[7]),
      ms: ms.map((m) => ({ status: Number(m.status), workHash: String(m.workHash).toLowerCase() })),
    };
  } catch {
    return null;
  }
}

export function roleOf(g: GigAccess, addr: string): Role {
  if (g.worker !== ZERO && addr === g.worker) return "worker";
  if (addr === g.client) return "client";
  if (addr === g.arbiter) return "arbiter";
  return null;
}

// Full-quality files and final deliverables: worker always, client after payment, arbiter in dispute or after payment.
export function canSeeFinal(g: GigAccess, role: Role, idx: number) {
  if (role === "worker") return true;
  const st = g.ms[idx]?.status;
  if (role === "client") return st === 2;
  if (role === "arbiter") return st === 2 || st === 4;
  return false;
}
