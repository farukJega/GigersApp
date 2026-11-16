"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "./ConnectButton";
import { useLang } from "./LanguageProvider";

export function MyProfileRedirect() {
  const { t } = useLang();
  const { address, isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected && address) router.replace(`/profile/${address}`);
  }, [isConnected, address, router]);

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-card p-8 text-center">
      <p className="font-semibold">{t("d_connect", "Connect your wallet to see your dashboard")}</p>
      <ConnectButton />
    </div>
  );
}
