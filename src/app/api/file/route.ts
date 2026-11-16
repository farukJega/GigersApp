import { NextResponse } from "next/server";
import { keccak256 } from "viem";
import { db } from "@/lib/db";

const MAX_BYTES = 1_500_000;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const data = (body as { data?: unknown } | null)?.data;
  if (typeof data !== "string" || data.length < 100 || data.length > 2_200_000)
    return NextResponse.json({ error: "Image is missing or too large." }, { status: 400 });
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data))
    return NextResponse.json({ error: "Invalid image data." }, { status: 400 });

  const buf = Buffer.from(data, "base64");
  if (buf.length > MAX_BYTES)
    return NextResponse.json({ error: "Image is larger than 1.5 MB." }, { status: 400 });
  if (!(buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff))
    return NextResponse.json({ error: "Only JPEG images are accepted." }, { status: 400 });

  const id = keccak256(new Uint8Array(buf));
  try {
    const sql = db();
    await sql`insert into gig_files (id, data) values (${id}, ${data}) on conflict (id) do nothing`;
  } catch {
    return NextResponse.json({ error: "Could not save the image. Try again." }, { status: 500 });
  }
  return NextResponse.json({ id });
}

export async function GET(req: Request) {
  const id = (new URL(req.url).searchParams.get("id") ?? "").toLowerCase();
  if (!/^0x[0-9a-f]{64}$/.test(id)) return new Response("Not found", { status: 404 });
  try {
    const sql = db();
    const rows = (await sql`select data from gig_files where id = ${id}`) as { data: string }[];
    if (rows.length === 0) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(Buffer.from(rows[0].data, "base64")), {
      headers: {
        "Content-Type": "image/jpeg",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Error", { status: 500 });
  }
}
