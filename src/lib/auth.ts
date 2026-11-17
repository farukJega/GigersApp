import { createHmac, timingSafeEqual } from "crypto";

function mac(payload: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error("Session is not configured");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function makeToken(address: string) {
  const exp = Math.floor(Date.now() / 1000) + 24 * 3600;
  const body = `${address.toLowerCase()}.${exp}`;
  return `${body}.${mac(body)}`;
}

export function addressFromRequest(req: Request): string | null {
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [addr, exp, sig] = parts;
  if (!/^0x[0-9a-f]{40}$/.test(addr) || !/^\d+$/.test(exp)) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  let expected: string;
  try {
    expected = mac(`${addr}.${exp}`);
  } catch {
    return null;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return addr;
}
