import { NextResponse } from "next/server";
import { keccak256, toHex } from "viem";
import { db } from "@/lib/db";
import { normalizeMetadata } from "@/lib/metadata";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const result = normalizeMetadata((body ?? {}) as Record<string, unknown>);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const hash = keccak256(toHex(result.json));
  try {
    const sql = db();
    await sql`
      insert into gig_metadata (hash, payload)
      values (${hash}, ${result.json})
      on conflict (hash) do update set payload = excluded.payload
    `;
  } catch {
    return NextResponse.json({ error: "Could not save gig details. Try again." }, { status: 500 });
  }
  return NextResponse.json({ hash });
}

// Public gig listings only. Submitted work is never returned from here.
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("hashes") ?? "";
  const hashes = raw
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter((h) => /^0x[0-9a-f]{64}$/.test(h))
    .slice(0, 100);
  if (hashes.length === 0) return NextResponse.json({});

  try {
    const sql = db();
    const rows = (await sql`
      select hash, payload from gig_metadata where hash = any(${hashes}::text[])
    `) as { hash: string; payload: string }[];
    const out: Record<string, unknown> = {};
    for (const row of rows) {
      if (keccak256(toHex(row.payload)) !== row.hash) continue;
      const p = JSON.parse(row.payload);
      if (typeof p.title === "string" && typeof p.category === "string" && p.gigId === undefined) {
        out[row.hash] = p;
      }
    }
    return NextResponse.json(out);
  } catch {
    return NextResponse.json({});
  }
}
