import { NextResponse } from "next/server";
import { keccak256 } from "viem";
import { db } from "@/lib/db";
import { addressFromRequest } from "@/lib/auth";
import { canSeeFinal, loadGig, roleOf } from "@/lib/access";

const MAX_FULL = 1_500_000;
const MAX_PREVIEW = 150_000;
const B64 = /^[A-Za-z0-9+/]+={0,2}$/;
const isJpeg = (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const me = addressFromRequest(req);
  if (!me) return fail("Sign in with your wallet first.", 401);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail("Invalid request.");
  }
  const gigId = typeof body.gigId === "string" ? body.gigId : "";
  const full = typeof body.full === "string" ? body.full : "";
  const preview = typeof body.preview === "string" ? body.preview : "";
  if (!/^\d{1,9}$/.test(gigId) || Number(gigId) < 1) return fail("Invalid gig.");
  if (full.length < 100 || full.length > 2_200_000 || !B64.test(full)) return fail("Image is missing or too large.");
  if (preview.length < 100 || preview.length > 250_000 || !B64.test(preview)) return fail("Preview is missing or too large.");

  const fb = Buffer.from(full, "base64");
  const pb = Buffer.from(preview, "base64");
  if (fb.length > MAX_FULL) return fail("Image is larger than 1.5 MB.");
  if (pb.length > MAX_PREVIEW) return fail("Preview is too large.");
  if (!isJpeg(fb) || !isJpeg(pb)) return fail("Only JPEG images are accepted.");

  const gig = await loadGig(Number(gigId));
  if (!gig) return fail("Could not verify the gig on-chain. Try again.", 502);
  if (roleOf(gig, me) !== "worker") return fail("Only the chosen freelancer can upload work.", 403);
  if (gig.status !== 1) return fail("This gig is not active.");

  const fullId = keccak256(new Uint8Array(fb));
  const previewId = keccak256(new Uint8Array(pb));
  try {
    const sql = db();
    const cnt = (await sql`
      select count(*)::int as n from gig_files where gig_id = ${Number(gigId)} and kind = 'full'
    `) as { n: number }[];
    if ((cnt[0]?.n ?? 0) >= 30) return fail("This gig reached its upload limit.");
    await sql`
      insert into gig_files (id, data, gig_id, kind, pair)
      values (${fullId}, ${full}, ${Number(gigId)}, 'full', null) on conflict (id) do nothing
    `;
    await sql`
      insert into gig_files (id, data, gig_id, kind, pair)
      values (${previewId}, ${preview}, ${Number(gigId)}, 'preview', ${fullId}) on conflict (id) do nothing
    `;
  } catch {
    return fail("Could not save the image. Try again.", 500);
  }
  return NextResponse.json({ id: fullId });
}

export async function GET(req: Request) {
  const me = addressFromRequest(req);
  if (!me) return new Response("Unauthorized", { status: 401 });

  const sp = new URL(req.url).searchParams;
  const id = (sp.get("id") ?? "").toLowerCase();
  if (!/^0x[0-9a-f]{64}$/.test(id)) return new Response("Not found", { status: 404 });
  const wantPreview = sp.get("v") === "preview";

  try {
    const sql = db();
    const rows = (await sql`
      select data, gig_id from gig_files where id = ${id} and kind = 'full'
    `) as { data: string; gig_id: number | null }[];
    if (rows.length === 0 || rows[0].gig_id == null) return new Response("Not found", { status: 404 });

    const gigId = Number(rows[0].gig_id);
    const gig = await loadGig(gigId);
    if (!gig) return new Response("Try again", { status: 502 });
    const role = roleOf(gig, me);
    if (!role) return new Response("Forbidden", { status: 403 });

    const works = (await sql`
      select hash, payload from gig_work where gig_id = ${gigId}
    `) as { hash: string; payload: string }[];
    let idx = -1;
    for (const w of works) {
      try {
        const p = JSON.parse(w.payload);
        if (
          Array.isArray(p.files) &&
          p.files.includes(id) &&
          typeof p.index === "number" &&
          gig.ms[p.index]?.workHash === w.hash.toLowerCase()
        )
          idx = p.index;
      } catch {}
    }

    const wantsFull = !wantPreview && (role === "worker" || (idx >= 0 && canSeeFinal(gig, role, idx)));
    let data = rows[0].data;
    let quality = "full";
    if (!wantsFull) {
      const pr = (await sql`
        select data from gig_files where kind = 'preview' and pair = ${id} limit 1
      `) as { data: string }[];
      if (pr.length === 0) return new Response("Preview not available", { status: 404 });
      data = pr[0].data;
      quality = "preview";
    }
    return new Response(new Uint8Array(Buffer.from(data, "base64")), {
      headers: {
        "Content-Type": "image/jpeg",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
        "Cache-Control": "private, no-store",
        "X-Gigers-Quality": quality,
      },
    });
  } catch {
    return new Response("Error", { status: 500 });
  }
}
