import { NextResponse } from "next/server";
import { keccak256, recoverMessageAddress, toHex } from "viem";
import { db } from "@/lib/db";
import { normalizeProfile, profileMessage } from "@/lib/profile";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail("Invalid request.");
  }
  const address = typeof b.address === "string" ? b.address.toLowerCase() : "";
  const time = typeof b.time === "number" ? b.time : 0;
  const signature = typeof b.signature === "string" ? b.signature : "";

  if (!/^0x[0-9a-f]{40}$/.test(address)) return fail("Invalid address.");
  if (!/^0x[0-9a-fA-F]{130}$/.test(signature)) return fail("Invalid signature.");
  if (Math.abs(Date.now() / 1000 - time) > 600) return fail("Signature expired. Try again.");

  const n = normalizeProfile((b.profile ?? {}) as Record<string, unknown>);
  if (!n.ok) return fail(n.error);

  const hash = keccak256(toHex(n.json));
  let recovered: string;
  try {
    recovered = await recoverMessageAddress({
      message: profileMessage(address, hash, time),
      signature: signature as `0x${string}`,
    });
  } catch {
    return fail("Invalid signature.");
  }
  if (recovered.toLowerCase() !== address) return fail("Signature does not match your wallet.", 401);

  try {
    const sql = db();
    await sql`
      insert into profiles (address, payload, updated_at)
      values (${address}, ${n.json}, now())
      on conflict (address) do update set payload = excluded.payload, updated_at = now()
    `;
  } catch {
    return fail("Could not save profile. Try again.", 500);
  }
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const address = (new URL(req.url).searchParams.get("address") ?? "").toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(address)) return NextResponse.json({ profile: null });
  try {
    const sql = db();
    const rows = (await sql`select payload from profiles where address = ${address}`) as {
      payload: string;
    }[];
    if (rows.length === 0) return NextResponse.json({ profile: null });
    return NextResponse.json({ profile: JSON.parse(rows[0].payload) });
  } catch {
    return NextResponse.json({ profile: null });
  }
}
