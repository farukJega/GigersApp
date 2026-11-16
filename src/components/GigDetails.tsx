"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import { formatUnits } from "viem";
import { ArrowLeft } from "lucide-react";
import { ESCROW_ADDRESS, USDC_DECIMALS, escrowAbi } from "@/lib/contract";
import { arcTestnet } from "@/lib/arc";
import { categories } from "@/lib/categories";
import type { GigMetadata } from "@/lib/metadata";
import { useLang } from "./LanguageProvider";
import { ConnectButton } from "./ConnectButton";

const ZERO = "0x0000000000000000000000000000000000000000";
const statusKeys = ["open", "inprog", "done", "cancelled"];
const statusStyle = [
  "bg-brand/15 text-brand",
  "bg-warn/15 text-warn",
  "bg-ok/15 text-ok",
  "bg-line text-muted",
];

type Addr = `0x${string}`;
type GigTuple = readonly [Addr, Addr, Addr, bigint, bigint, bigint, bigint, number];
type MilestoneT = { amount: bigint; workHash: string; submittedAt: bigint; status: number };

const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

function friendly(e: unknown) {
  const m =
    e instanceof Error
      ? ((e as { shortMessage?: string }).shortMessage ?? e.message)
      : "Something went wrong.";
  if (/user rejected|denied/i.test(m)) return "You rejected the request in your wallet.";
  return m.length > 220 ? m.slice(0, 220) + "..." : m;
}

export function GigDetails() {
  const { t } = useLang();
  const params = useParams<{ id: string }>();
  const idStr = params?.id ?? "";
  const valid = /^\d{1,9}$/.test(idStr) && Number(idStr) > 0;
  const id = BigInt(valid ? idStr : "0");

  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      { address: ESCROW_ADDRESS, abi: escrowAbi, functionName: "gigs" as const, args: [id] as const, chainId: arcTestnet.id },
      { address: ESCROW_ADDRESS, abi: escrowAbi, functionName: "getMilestones" as const, args: [id] as const, chainId: arcTestnet.id },
      { address: ESCROW_ADDRESS, abi: escrowAbi, functionName: "getApplicants" as const, args: [id] as const, chainId: arcTestnet.id },
    ],
    query: { enabled: valid },
  });

  const { data: appliedRaw, refetch: refetchApplied } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: escrowAbi,
    functionName: "hasApplied",
    args: address ? [id, address] : undefined,
    chainId: arcTestnet.id,
    query: { enabled: valid && !!address },
  });

  const g = data?.[0]?.result as unknown as GigTuple | undefined;
  const ms = ((data?.[1]?.result as unknown as readonly MilestoneT[] | undefined) ?? []) as readonly MilestoneT[];
  const applicants = ((data?.[2]?.result as unknown as readonly Addr[] | undefined) ?? []) as readonly Addr[];
  const hash = g?.[2];

  const { data: meta } = useQuery({
    queryKey: ["gig-meta-one", hash],
    enabled: !!hash && hash !== "0x0000000000000000000000000000000000000000000000000000000000000000",
    queryFn: async () => {
      const res = await fetch(`/api/metadata?hashes=${hash}`);
      const j = (await res.json()) as Record<string, GigMetadata>;
      return j[(hash as string).toLowerCase()] ?? null;
    },
  });

  const applied = appliedRaw === true;

  async function run(kind: "apply" | "accept", worker?: Addr) {
    setError("");
    setBusy(kind + (worker ?? ""));
    try {
      if (!publicClient) throw new Error("Connect your wallet first.");
      if (chainId !== arcTestnet.id) throw new Error(t("switch_net"));
      const tx =
        kind === "apply"
          ? await writeContractAsync({
              address: ESCROW_ADDRESS,
              abi: escrowAbi,
              functionName: "applyToGig",
              args: [id],
              chainId: arcTestnet.id,
            })
          : await writeContractAsync({
              address: ESCROW_ADDRESS,
              abi: escrowAbi,
              functionName: "acceptWorker",
              args: [id, worker as Addr],
              chainId: arcTestnet.id,
            });
      const rc = await publicClient.waitForTransactionReceipt({ hash: tx });
      if (rc.status !== "success") throw new Error("Transaction failed.");
      await refetch();
      await refetchApplied();
    } catch (e) {
      setError(friendly(e));
    } finally {
      setBusy("");
    }
  }

  const notFound = (
    <div className="rounded-2xl border border-dashed border-line bg-card p-8 text-center font-semibold">
      {t("g_notfound")}
    </div>
  );
  if (!valid) return notFound;
  if (isLoading || !g) return <div className="h-40 animate-pulse rounded-2xl border border-line bg-card" />;
  if (g[0].toLowerCase() === ZERO) return notFound;

  const status = Number(g[7]);
  const isOpen = status === 0;
  const expired = Number(g[3]) < Date.now() / 1000;
  const isClient = !!address && address.toLowerCase() === g[0].toLowerCase();
  const hasWorker = g[1].toLowerCase() !== ZERO;
  const ci = meta ? categories.findIndex((c) => c.slug === meta.category) : -1;
  const catName = ci >= 0 ? t(`c${ci}`, categories[ci].name) : undefined;
  const held =
    status === 3
      ? BigInt(0)
      : ms
          .filter((m) => m.status === 0 || m.status === 1 || m.status === 4)
          .reduce((a, m) => a + m.amount, BigInt(0));
  const msTitles = meta && meta.milestones.length === ms.length ? meta.milestones : null;

  let applyBlock: React.ReactNode;
  if (!isConnected) {
    applyBlock = (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-card p-5 text-center">
        <p className="text-sm font-semibold">{t("g_need_wallet")}</p>
        <ConnectButton />
      </div>
    );
  } else if (isClient) {
    applyBlock = <p className="rounded-2xl bg-card2 p-4 text-center text-sm text-muted">{t("g_own")}</p>;
  } else if (applied) {
    applyBlock = <p className="rounded-2xl bg-ok/15 p-4 text-center text-sm font-bold text-ok">{t("g_applied")}</p>;
  } else if (!isOpen) {
    applyBlock = <p className="rounded-2xl bg-card2 p-4 text-center text-sm text-muted">{t("g_closed")}</p>;
  } else if (expired) {
    applyBlock = <p className="rounded-2xl bg-card2 p-4 text-center text-sm text-muted">{t("g_expired")}</p>;
  } else {
    applyBlock = (
      <button
        className="w-full rounded-2xl bg-brand py-4 font-extrabold text-brand-ink transition active:scale-[0.98] disabled:opacity-50"
        disabled={!!busy}
        onClick={() => run("apply")}
      >
        {busy === "apply" ? "..." : t("g_apply")}
      </button>
    );
  }

  return (
    <div className="space-y-5">
      <Link href="/explore" className="inline-flex items-center gap-1 text-sm font-semibold text-muted">
        <ArrowLeft size={16} className="rtl:rotate-180" /> {t("nav_explore")}
      </Link>

      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-extrabold leading-tight">{meta?.title ?? `Gig #${idStr}`}</h1>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[status] ?? statusStyle[3]}`}>
            {t(statusKeys[status] ?? "open")}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {catName ? `${catName} / ${meta?.subcategory}` : t("unavail")}
        </p>
        {meta?.quick && (
          <span className="mt-2 inline-block rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-semibold text-brand">Quick Gig</span>
        )}
      </div>

      <div className="inv grid grid-cols-2 gap-4 rounded-2xl border border-line p-4">
        <div>
          <p className="text-xs text-muted">{t("g_budget")}</p>
          <p className="text-2xl font-extrabold text-brand">{formatUnits(g[4], USDC_DECIMALS)} <span className="text-sm text-muted">USDC</span></p>
        </div>
        <div>
          <p className="text-xs text-muted">{t("g_escrow")}</p>
          <p className="text-2xl font-extrabold">{formatUnits(held, USDC_DECIMALS)} <span className="text-sm text-muted">USDC</span></p>
        </div>
        <div>
          <p className="text-xs text-muted">{t("g_deadline")}</p>
          <p className="font-semibold">{new Date(Number(g[3]) * 1000).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted">{t("g_client")}</p>
          <p className="font-mono text-sm font-semibold">{short(g[0])}</p>
        </div>
      </div>

      {meta && (
        <>
          <section>
            <h2 className="mb-2 font-bold">{t("g_desc")}</h2>
            <p className="whitespace-pre-wrap text-sm text-muted">{meta.description}</p>
          </section>
          <section>
            <h2 className="mb-2 font-bold">{t("g_skills")}</h2>
            <div className="flex flex-wrap gap-1.5">
              {meta.skills.map((s) => (
                <span key={s} className="rounded-full border border-line bg-card2 px-3 py-1 text-xs text-muted">{s}</span>
              ))}
            </div>
          </section>
          {meta.links.length > 0 && (
            <section>
              <h2 className="mb-2 font-bold">{t("g_links")}</h2>
              <div className="space-y-1">
                {meta.links
                  .filter((l) => /^https?:\/\//i.test(l))
                  .map((l) => (
                    <a key={l} href={l} target="_blank" rel="noopener noreferrer nofollow ugc" className="block break-all text-sm font-semibold text-brand">
                      {l}
                    </a>
                  ))}
              </div>
            </section>
          )}
        </>
      )}

      <section>
        <h2 className="mb-2 font-bold">{t("g_milestones")}</h2>
        <div className="space-y-2">
          {ms.map((m, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-line bg-card p-3 text-sm">
              <span className="min-w-0 truncate">{msTitles?.[i] ?? `#${i + 1}`}</span>
              <span className="ms-3 shrink-0 text-end">
                <span className="block font-bold">{formatUnits(m.amount, USDC_DECIMALS)} USDC</span>
                <span className="block text-xs text-muted">
                  {status === 3 && m.status === 0 ? t("ms3") : t(`ms${m.status}`)}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {hasWorker && (
        <section className="rounded-2xl border border-line bg-card p-4">
          <p className="text-xs text-muted">{t("g_worker")}</p>
          <p className="font-mono text-sm font-semibold">{short(g[1])}</p>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-bold">{t("g_applicants")} ({String(g[5])})</h2>
        {applicants.length === 0 ? (
          <p className="text-sm text-muted">{t("g_no_app")}</p>
        ) : (
          <div className="space-y-2">
            {applicants.map((a) => (
              <div key={a} className="flex items-center justify-between rounded-xl border border-line bg-card p-3">
                <span className="font-mono text-sm">{short(a)}</span>
                {isClient && isOpen && (
                  <button
                    className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-brand-ink disabled:opacity-50"
                    disabled={!!busy}
                    onClick={() => run("accept", a)}
                  >
                    {busy === "accept" + a ? "..." : t("g_accept")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {applyBlock}
      {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
