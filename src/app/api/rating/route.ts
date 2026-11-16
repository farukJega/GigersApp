import { NextResponse } from "next/server";
import { keccak256, recoverMessageAddress, toHex } from "viem";
import { db } from "@/lib/db";
import { serverClient } from "@/lib/chain";
import { ESCROW_ADDRESS, escrowAbi } from "@/lib/contract";
import { ratingMessage, type RatingRow } from "@/lib/rating";

const ZERO = "0x0000000000000000000000000000000000000000";
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail("Invalid request.");
  }
  const gigId = typeof b.gigId === "string" ? b.gigId : "";
  const rater = typeof b.rater === "string" ? b.rater.toLowerCase() : "";
  const stars = typeof b.stars === "number" ? b.stars : 0;
  const comment = typeof b.comment === "string" ? b.comment.trim() : "";
  const time = typeof b.time === "number" ? b.time : 0;
  const signature = typeof b.signature === "string" ? b.signature : "";

  if (!/^\d{1,9}$/.test(gigId) || Number(gigId) < 1) return fail("Invalid gig.");
  if (!/^0x[0-9a-f]{40}$/.test(rater)) return fail("Invalid address.");
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return fail("Rating must be 1 to 5.");
  if (comment.length > 300) return fail("Comment must be 300 characters or less.");
  if (!/^0x[0-9a-fA-F]{130}$/.test(signature)) return fail("Invalid signature.");
  if (Math.abs(Date.now() / 1000 - time) > 600) return fail("Signature expired. Try again.");

  let recovered: string;
  try {
    recovered = await recoverMessageAddress({
      message: ratingMessage(gigId, rater, stars, keccak256(toHex(comment)), time),
      signature: signature as `0x${string}`,
    });
  } catch {
    return fail("Invalid signature.");
  }
  if (recovered.toLowerCase() !== rater) return fail("Signature does not match your wallet.", 401);

  let client = "";
  let worker = "";
  try {
    const gig = await serverClient.readContract({
      address: ESCROW_ADDRESS,
      abi: escrowAbi,
      functionName: "gigs",
      args: [BigInt(gigId)],
    });
    client = gig[0].toLowerCase();
    worker = gig[1].toLowerCase();
    if (Number(gig[7]) !== 2) return fail("You can rate only after the gig is completed.");
    const ms = await serverClient.readContract({
      address: ESCROW_ADDRESS,
      abi: escrowAbi,
      functionName: "getMilestones",
      args: [BigInt(gigId)],
    });
    if (!ms.some((m) => Number(m.status) === 2)) return fail("This gig has no paid milestone.");
  } catch {
    return fail("Could not verify the gig on-chain. Try again.", 502);
  }

  if (worker === ZERO) return fail("This gig has no freelancer.");
  if (rater !== client && rater !== worker) return fail("Only the client or the freelancer can rate.", 403);
  const ratee = rater === client ? worker : client;

  try {
    const sql = db();
    const exists = (await sql`
      select 1 from ratings where gig_id = ${Number(gigId)} and rater = ${rater}
    `) as unknown[];
    if (exists.length > 0) return fail("You already rated this gig.", 409);
    await sql`
      insert into ratings (gig_id, rater, ratee, stars, comment)
      values (${Number(gigId)}, ${rater}, ${ratee}, ${stars}, ${comment})
    `;
  } catch {
    return fail("Could not save rating. Try again.", 500);
  }
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const address = (sp.get("address") ?? "").toLowerCase();
  const gig = sp.get("gig") ?? "";
  try {
    const sql = db();
    let rows: RatingRow[] = [];
    if (/^0x[0-9a-f]{40}$/.test(address)) {
      rows = (await sql`
        select gig_id, rater, stars, comment from ratings
        where ratee = ${address} order by created_at desc limit 50
      `) as unknown as RatingRow[];
    } else if (/^\d{1,9}$/.test(gig)) {
      rows = (await sql`
        select gig_id, rater, stars, comment from ratings
        where gig_id = ${Number(gig)} order by created_at desc limit 10
      `) as unknown as RatingRow[];
    }
    const count = rows.length;
    const avg = count ? rows.reduce((a, r) => a + Number(r.stars), 0) / count : 0;
    return NextResponse.json({ ratings: rows, avg, count });
  } catch {
    return NextResponse.json({ ratings: [], avg: 0, count: 0 });
  }
}
