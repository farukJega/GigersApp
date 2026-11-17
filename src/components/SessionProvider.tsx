"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { authMessage } from "@/lib/authmsg";

type Ctx = {
  token: string | null;
  signIn: () => Promise<string | null>;
  busy: boolean;
  error: string;
};

const SessionContext = createContext<Ctx>({
  token: null,
  signIn: async () => null,
  busy: false,
  error: "",
});

const key = (a: string) => `gigers-token-${a.toLowerCase()}`;

function stored(address?: string) {
  if (!address) return null;
  try {
    const t = sessionStorage.getItem(key(address));
    if (!t) return null;
    return Number(t.split(".")[1]) > Date.now() / 1000 ? t : null;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setToken(stored(address));
    setError("");
  }, [address]);

  const signIn = useCallback(async () => {
    if (!address) {
      setError("Connect your wallet first.");
      return null;
    }
    const existing = stored(address);
    if (existing) {
      setToken(existing);
      return existing;
    }
    setBusy(true);
    setError("");
    try {
      const time = Math.floor(Date.now() / 1000);
      const signature = await signMessageAsync({ message: authMessage(address, time) });
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, time, signature }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Sign-in failed.");
      try {
        sessionStorage.setItem(key(address), j.token);
      } catch {}
      setToken(j.token as string);
      return j.token as string;
    } catch (e) {
      const m = e instanceof Error ? e.message : "Sign-in failed.";
      setError(/rejected|denied/i.test(m) ? "You rejected the signature." : m.slice(0, 160));
      return null;
    } finally {
      setBusy(false);
    }
  }, [address, signMessageAsync]);

  const value = useMemo(() => ({ token, signIn, busy, error }), [token, signIn, busy, error]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
