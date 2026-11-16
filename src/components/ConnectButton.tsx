"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { arcTestnet } from "@/lib/arc";
import { useLang } from "./LanguageProvider";

const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

function explain(message: string) {
  if (/user rejected|denied|rejected/i.test(message))
    return "You rejected the connection in your wallet.";
  if (/provider not found/i.test(message))
    return "No wallet was found in this browser. Open this page inside your wallet app browser, or use WalletConnect.";
  return message.length > 160 ? message.slice(0, 160) + "..." : message;
}

function WalletModal({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  const { connect, connectors, isPending, error, reset, variables } = useConnect();

  useEffect(() => {
    reset();
  }, [reset]);

  const injectedLike = connectors.filter((c) => c.type === "injected");
  const discovered = injectedLike.filter((c) => c.id !== "injected");
  const generic = injectedLike.find((c) => c.id === "injected");
  const wc = connectors.find((c) => c.id === "walletConnect");
  const hasEth =
    typeof window !== "undefined" &&
    !!(window as unknown as { ethereum?: unknown }).ethereum;
  const browserWallets = discovered.length > 0 ? discovered : hasEth && generic ? [generic] : [];
  const pendingId = (variables?.connector as { id?: string } | undefined)?.id;

  const row =
    "flex w-full items-center gap-3 rounded-2xl border border-line bg-card2 px-4 py-3.5 text-start text-sm font-bold transition active:scale-[0.98] disabled:opacity-50";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl border border-line bg-card p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-extrabold">{t("wm_title", "Connect a wallet")}</p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2">
          {browserWallets.map((c) => (
            <button
              key={c.uid}
              type="button"
              className={row}
              disabled={isPending}
              onClick={() => connect({ connector: c })}
            >
              {c.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.icon} alt="" className="h-7 w-7 rounded-lg" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-brand">W</span>
              )}
              <span className="flex-1">{c.name}</span>
              {isPending && pendingId === c.id && <span className="text-xs text-muted">...</span>}
            </button>
          ))}

          {wc && (
            <button
              type="button"
              className={row}
              disabled={isPending}
              onClick={() => connect({ connector: wc })}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-brand">WC</span>
              <span className="flex-1">
                WalletConnect
                <span className="block text-xs font-normal text-muted">
                  {t("wm_wc", "Any wallet app, scan or open")}
                </span>
              </span>
              {isPending && pendingId === "walletConnect" && <span className="text-xs text-muted">...</span>}
            </button>
          )}
        </div>

        {browserWallets.length === 0 && (
          <p className="mt-3 text-sm text-muted">
            {wc
              ? t("wm_none", "No wallet was detected in this browser. Use WalletConnect, or open this page inside your wallet app browser.")
              : t("wm_none2", "No wallet was detected in this browser. Open this page inside your wallet app browser (MetaMask, Rabby).")}
          </p>
        )}

        {error && (
          <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">{explain(error.message)}</p>
        )}
      </div>
    </div>,
    document.body
  );
}

export function ConnectButton() {
  const { t } = useLang();
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isConnected) setOpen(false);
  }, [isConnected]);

  const base =
    "whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition active:scale-95 sm:px-4 sm:text-sm";

  if (!isConnected) {
    return (
      <>
        <button className={`${base} bg-brand text-brand-ink`} onClick={() => setOpen(true)}>
          <span className="sm:hidden">{t("connect_short", "Connect")}</span>
          <span className="hidden sm:inline">{t("connect")}</span>
        </button>
        {open && <WalletModal onClose={() => setOpen(false)} />}
      </>
    );
  }

  if (chainId !== arcTestnet.id) {
    return (
      <button
        className={`${base} bg-amber-500 text-black`}
        disabled={switching}
        onClick={() => switchChain({ chainId: arcTestnet.id })}
      >
        {switching ? "..." : t("switch_net")}
      </button>
    );
  }

  return (
    <button
      className={`${base} border border-line bg-card text-fg`}
      onClick={() => disconnect()}
      title="Disconnect"
    >
      {short(address!)}
    </button>
  );
}
