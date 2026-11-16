"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { arcTestnet } from "@/lib/arc";
import { useLang } from "./LanguageProvider";

const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

export function ConnectButton() {
  const { t } = useLang();
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();

  const base =
    "whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition active:scale-95 sm:px-4 sm:text-sm";

  if (!isConnected) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          className={`${base} bg-brand text-brand-ink`}
          disabled={isPending}
          onClick={() => connect({ connector: connectors[0] })}
        >
          {isPending ? t("connecting") : t("connect")}
        </button>
        {error && <p className="max-w-[220px] text-end text-xs text-red-400">{t("hint")}</p>}
      </div>
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
