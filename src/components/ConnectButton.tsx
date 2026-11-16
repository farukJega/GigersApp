"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { arcTestnet } from "@/lib/arc";

const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();

  const base =
    "rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-95";

  if (!isConnected) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          className={`${base} bg-brand text-brand-ink`}
          disabled={isPending}
          onClick={() => connect({ connector: connectors[0] })}
        >
          {isPending ? "Connecting..." : "Connect Wallet"}
        </button>
        {error && (
          <p className="max-w-[220px] text-right text-xs text-red-400">
            Open this page inside your wallet app browser (MetaMask).
          </p>
        )}
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
        {switching ? "Switching..." : "Switch to Arc Testnet"}
      </button>
    );
  }

  return (
    <button
      className={`${base} border border-line bg-card text-fg`}
      onClick={() => disconnect()}
      title="Click to disconnect"
    >
      {short(address!)}
    </button>
  );
}
