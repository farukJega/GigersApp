import { NextResponse } from "next/server";
import { keccak256, toHex } from "viem";
import { db } from "@/lib/db";
import { addressFromRequest } from "@/lib/auth";
import { canSeeFinal, loadGig, roleOf, type GigAccess } from "@/lib/access";
import { normalizeWork } from "@/lib/work";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
type Row = { hash: string; payload: string };

export async function POST(req: Request) {
  const me = addressFromRequest(req);
  if (!me) return fail("Sign in with your wallet first.", 401);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail("Invalid request.");
  }
  const n = normalizeWork(body);
  if (!n.ok) return fail(n.error);

  const gigId = Number(n.data.gigId);
  const gig = await loadGig(gigId);
  if (!gig) return fail("Could not verify the gig on-chain. Try again.", 502);
  if (roleOf(gig, me) !== "worker") return fail("Only the chosen freelancer can submit work.", 403);
  if (gig.status !== 1) return fail("This gig is not active.");
  if (gig.ms[n.data.index]?.status !== 0) return fail("This milestone is not waiting for work.");

  const hash = keccak256(toHex(n.json));
  try {
    const sql = db();
    if (n.data.files.length > 0) {
      const have = (await sql`
        select count(*)::int as n from gig_files
        where id = any(${n.data.files}::text[]) and gig_id = ${gigId} and kind = 'full'
      `) as { n: number }[];
      if ((have[0]?.n ?? 0) !== n.data.files.length)
        return fail("One of the images was not uploaded for this gig.");
    }
    await sql`
      insert into gig_work (hash, gig_id, payload) values (${hash}, ${gigId}, ${n.json})
      on conflict (hash) do nothing
    `;
  } catch {
    return fail("Could not save your work. Try again.", 500);
  }
  return NextResponse.json({ hash });
}

export async function GET(req: Request) {
  const me = addressFromRequest(req);
  if (!me) return NextResponse.json({}, { status: 401 });

  const raw = new URL(req.url).searchParams.get("hashes") ?? "";
  const hashes = raw
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter((h) => /^0x[0-9a-f]{64}$/.test(h))
    .slice(0, 20);
  if (hashes.length === 0) return NextResponse.json({});

  const out: Record<string, unknown> = {};
  try {
    const sql = db();
    const a = (await sql`select hash, payload from gig_work where hash = any(${hashes}::text[])`) as Row[];
    const b = (await sql`select hash, payload from gig_metadata where hash = any(${hashes}::text[])`) as Row[];
    const cache = new Map<number, GigAccess | null>();

    for (const row of [...a, ...b]) {
      const key = row.hash.toLowerCase();
      if (out[key]) continue;
      if (keccak256(toHex(row.payload)) !== key) continue;
      let p: Record<string, unknown>;
      try {
        p = JSON.parse(row.payload);
      } catch {
        continue;
      }
      if (typeof p.gigId !== "string" || typeof p.index !== "number") continue;

      const gid = Number(p.gigId);
      if (!cache.has(gid)) cache.set(gid, await loadGig(gid));
      const gig = cache.get(gid);
      if (!gig) continue;
      const role = roleOf(gig, me);
      if (!role) continue;
      if (gig.ms[p.index]?.workHash !== key) continue;

      const final = canSeeFinal(gig, role, p.index);
      const fl = Array.isArray(p.finalLinks) ? (p.finalLinks as string[]) : [];
      out[key] = {
        gigId: p.gigId,
        index: p.index,
        note: typeof p.note === "string" ? p.note : "",
        links: Array.isArray(p.links) ? p.links : [],
        files: Array.isArray(p.files) ? p.files : [],
        hasFinal: fl.length > 0,
        finalLinks: final ? fl : [],
      };
    }
    return NextResponse.json(out);
  } catch {
    return NextResponse.json({});
  }
}
