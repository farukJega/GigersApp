import { NextResponse } from "next/server";
import { recoverMessageAddress } from "viem";
import { authMessage } from "@/lib/authmsg";
import { makeToken } from "@/lib/auth";

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

  let recovered: string;
  try {
    recovered = await recoverMessageAddress({
      message: authMessage(address, time),
      signature: signature as `0x${string}`,
    });
  } catch {
    return fail("Invalid signature.");
  }
  if (recovered.toLowerCase() !== address) return fail("Signature does not match your wallet.", 401);

  try {
    return NextResponse.json({ token: makeToken(address) });
  } catch {
    return fail("Sign-in is not configured on the server.", 500);
  }
}
