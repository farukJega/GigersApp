"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useGigs } from "@/lib/useGigs";
import { ConnectButton } from "./ConnectButton";
import { DashClient } from "./DashClient";
import { DashFree } from "./DashFree";
import { useLang } from "./LanguageProvider";

export function DashboardView() {
  const { t } = useLang();
  const { address, isConnected } = useAccount();
  const { rows, isLoading } = useGigs(100);
  const [tab, setTab] = useState<"client" | "free">("client");

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-card p-8 text-center">
        <p className="font-semibold">{t("d_connect", "Connect your wallet to see your dashboard")}</p>
        <ConnectButton />
      </div>
    );
  }

  const me = address.toLowerCase();
  const tabBtn = (id: "client" | "free", label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`flex-1 rounded-xl py-2.5 text-sm font-bold ${tab === id ? "bg-brand text-brand-ink" : "text-muted"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">{t("d_title", "Dashboard")}</h1>
        <Link href={`/profile/${address}`} className="text-sm font-semibold text-brand">
          {t("d_settings", "Profile settings")}
        </Link>
      </div>
      <div className="flex gap-1 rounded-2xl border border-line bg-card p-1">
        {tabBtn("client", t("d_client", "Client"))}
        {tabBtn("free", t("d_free", "Freelancer"))}
      </div>
      {isLoading ? (
        <div className="h-24 animate-pulse rounded-2xl border border-line bg-card" />
      ) : tab === "client" ? (
        <DashClient me={me} rows={rows} />
      ) : (
        <DashFree me={me} rows={rows} />
      )}
    </div>
  );
}
