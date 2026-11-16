"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { decodeEventLog, formatUnits, parseUnits } from "viem";
import { categories } from "@/lib/categories";
import { normalizeMetadata } from "@/lib/metadata";
import { arcTestnet } from "@/lib/arc";
import { ESCROW_ADDRESS, USDC_ADDRESS, USDC_DECIMALS, erc20Abi, escrowAbi } from "@/lib/contract";
import { ConnectButton } from "./ConnectButton";

const field =
  "w-full rounded-xl border border-line bg-card2 px-4 py-3 text-sm outline-none focus:border-brand";
const lbl = "mb-1.5 block text-xs font-semibold text-muted";

type Row = { title: string; amount: string };

function parseAmount(s: string): bigint | null {
  const v = s.trim();
  if (!/^\d+(\.\d{1,6})?$/.test(v)) return null;
  const n = parseUnits(v, USDC_DECIMALS);
  return n > BigInt(0) ? n : null;
}

function friendly(e: unknown) {
  const m =
    e instanceof Error
      ? ((e as { shortMessage?: string }).shortMessage ?? e.message)
      : "Something went wrong.";
  if (/user rejected|denied/i.test(m)) return "You rejected the request in your wallet.";
  return m.length > 220 ? m.slice(0, 220) + "..." : m;
}

export function CreateGigForm() {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const { writeContractAsync } = useWriteContract();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0].slug);
  const [subcategory, setSubcategory] = useState(categories[0].subs[0]);
  const [skills, setSkills] = useState("");
  const [links, setLinks] = useState("");
  const [quick, setQuick] = useState(false);
  const [rows, setRows] = useState<Row[]>([{ title: "Final delivery", amount: "" }]);
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [done, setDone] = useState<{ tx: string; gigId: string | null } | null>(null);

  const cat = categories.find((c) => c.slug === category) ?? categories[0];

  const { data: balance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: arcTestnet.id,
    query: { enabled: !!address },
  });

  const amounts = rows.map((r) => parseAmount(r.amount));
  const amountsOk = amounts.every((a) => a !== null);
  const total = amountsOk
    ? (amounts as bigint[]).reduce((a, b) => a + b, BigInt(0))
    : BigInt(0);
  const deadlineTs = deadline
    ? Math.floor(new Date(deadline + "T23:59:59").getTime() / 1000)
    : 0;

  const base = {
    title,
    description,
    category,
    subcategory,
    skills: skills.split(","),
    links: links.split("\n"),
    quick,
  };

  function goStep2() {
    const r = normalizeMetadata({ ...base, milestones: ["x"] });
    if (!r.ok) return setError(r.error);
    setError("");
    setStep(2);
  }

  function goStep3() {
    const r = normalizeMetadata({ ...base, milestones: rows.map((x) => x.title) });
    if (!r.ok) return setError(r.error);
    if (!amountsOk)
      return setError("Each milestone needs an amount above 0 (up to 6 decimals).");
    if (deadlineTs < Date.now() / 1000 + 3600)
      return setError("Pick a deadline in the future.");
    setError("");
    setStep(3);
  }

  function updateRow(i: number, patch: Partial<Row>) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function publish() {
    setError("");
    setBusy(true);
    try {
      if (!address || !publicClient) throw new Error("Connect your wallet first.");
      if (chainId !== arcTestnet.id) throw new Error("Switch your wallet to Arc Testnet.");
      if (balance !== undefined && balance < total)
        throw new Error("Your USDC balance is lower than the deposit.");

      const meta = normalizeMetadata({ ...base, milestones: rows.map((x) => x.title) });
      if (!meta.ok) throw new Error(meta.error);

      setPhase("Saving gig details...");
      const res = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meta.data),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not save gig details.");
      const hash = j.hash as `0x${string}`;

      const allowance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, ESCROW_ADDRESS],
      });
      if (allowance < total) {
        setPhase("Approve USDC spending in your wallet...");
        const approveTx = await writeContractAsync({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: "approve",
          args: [ESCROW_ADDRESS, total],
          chainId: arcTestnet.id,
        });
        setPhase("Waiting for approval...");
        const ar = await publicClient.waitForTransactionReceipt({ hash: approveTx });
        if (ar.status !== "success") throw new Error("USDC approval failed.");
      }

      setPhase("Confirm the escrow deposit in your wallet...");
      const tx = await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: "createGig",
        args: [hash, BigInt(deadlineTs), amounts as bigint[]],
        chainId: arcTestnet.id,
      });
      setPhase("Waiting for confirmation...");
      const rc = await publicClient.waitForTransactionReceipt({ hash: tx });
      if (rc.status !== "success")
        throw new Error("Transaction failed. Nothing was published.");

      let gigId: string | null = null;
      for (const log of rc.logs) {
        try {
          const ev = decodeEventLog({ abi: escrowAbi, data: log.data, topics: log.topics });
          if (ev.eventName === "GigCreated") gigId = String(ev.args.gigId);
        } catch {}
      }
      setDone({ tx, gigId });
    } catch (e) {
      setError(friendly(e));
    } finally {
      setBusy(false);
      setPhase("");
    }
  }

  if (done) {
    const url = `${arcTestnet.blockExplorers.default.url}/tx/${done.tx}`;
    return (
      <div className="rounded-2xl border border-line bg-card p-6 text-center">
        <p className="text-xl font-extrabold text-brand">Gig published and funded</p>
        {done.gigId && <p className="mt-1 text-sm text-muted">Gig #{done.gigId}</p>}
        <p className="mt-3 text-sm text-muted">
          {formatUnits(total, USDC_DECIMALS)} USDC is now held in escrow.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 block break-all text-sm font-semibold text-brand"
        >
          View transaction on ArcScan
        </a>
        <Link
          href="/explore"
          className="mt-5 block rounded-2xl bg-brand py-3.5 font-extrabold text-brand-ink"
        >
          View gigs
        </Link>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-card p-8 text-center">
        <p className="font-semibold">Connect your wallet to post a gig</p>
        <p className="mb-4 mt-1 text-sm text-muted">
          Your USDC reward is deposited into escrow when you publish.
        </p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    );
  }

  const lowBalance = balance !== undefined && balance < total;
  const primary =
    "w-full rounded-2xl bg-brand py-3.5 font-extrabold text-brand-ink transition active:scale-[0.98] disabled:opacity-50";
  const secondary =
    "w-full rounded-2xl border border-line bg-card py-3.5 font-bold transition active:scale-[0.98]";

  return (
    <div>
      <div className="mb-5 flex items-center gap-2">
        {["Details", "Budget", "Review"].map((t, i) => (
          <div key={t} className="flex flex-1 flex-col gap-1.5">
            <div className={`h-1.5 rounded-full ${step >= i + 1 ? "bg-brand" : "bg-line"}`} />
            <span className={`text-xs ${step === i + 1 ? "font-bold" : "text-muted"}`}>{t}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className={lbl}>Job title</label>
            <input className={field} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Design a logo for my crypto brand" />
          </div>
          <div>
            <label className={lbl}>Detailed description</label>
            <textarea className={field} rows={5} value={description} maxLength={5000} onChange={(e) => setDescription(e.target.value)} placeholder="What do you need done? Include requirements and deliverables." />
          </div>
          <div>
            <label className={lbl}>Main category</label>
            <select
              className={field}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                const c = categories.find((x) => x.slug === e.target.value);
                if (c) setSubcategory(c.subs[0]);
              }}
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Subcategory</label>
            <select className={field} value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>
              {cat.subs.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Required skills (comma separated)</label>
            <input className={field} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Figma, Illustrator, Branding" />
          </div>
          <div>
            <label className={lbl}>Reference links (optional, one per line)</label>
            <textarea className={field} rows={2} value={links} onChange={(e) => setLinks(e.target.value)} placeholder="https://..." />
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-line bg-card p-4">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[#ea580c]"
              checked={quick}
              onChange={(e) => {
                setQuick(e.target.checked);
                if (e.target.checked) setRows(rows.slice(0, 1));
              }}
            />
            <span>
              <span className="block text-sm font-bold">Quick Gig</span>
              <span className="block text-xs text-muted">A small job with a single payment, shown in the Quick Gigs filter.</span>
            </span>
          </label>
          <button className={primary} onClick={goStep2}>Continue</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Split the reward into milestones. The total deposit is the sum of all milestones.
          </p>
          {rows.map((r, i) => (
            <div key={i} className="space-y-2 rounded-2xl border border-line bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted">Milestone {i + 1}</span>
                {rows.length > 1 && (
                  <button className="text-xs font-semibold text-red-400" onClick={() => setRows(rows.filter((_, idx) => idx !== i))}>Remove</button>
                )}
              </div>
              <input className={field} value={r.title} maxLength={60} onChange={(e) => updateRow(i, { title: e.target.value })} placeholder="Milestone title" />
              <input className={field} inputMode="decimal" value={r.amount} onChange={(e) => updateRow(i, { amount: e.target.value })} placeholder="Amount in USDC" />
            </div>
          ))}
          <button
            className={secondary}
            disabled={quick || rows.length >= 10}
            onClick={() => setRows([...rows, { title: "", amount: "" }])}
          >
            + Add milestone
          </button>
          <div className="flex items-center justify-between rounded-xl bg-card2 p-4">
            <span className="text-sm text-muted">Total deposit</span>
            <span className="text-xl font-extrabold text-brand">{formatUnits(total, USDC_DECIMALS)} USDC</span>
          </div>
          <div>
            <label className={lbl}>Deadline</label>
            <input type="date" className={field} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className={secondary} onClick={() => { setError(""); setStep(1); }}>Back</button>
            <button className={primary} onClick={goStep3}>Review</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-line bg-card p-4 text-sm">
            <p className="text-lg font-extrabold">{title}</p>
            <p className="text-muted">{cat.name} / {subcategory}{quick ? " / Quick Gig" : ""}</p>
            <p className="text-muted">Skills: {skills.split(",").map((s) => s.trim()).filter(Boolean).join(", ")}</p>
            <p className="text-muted">Deadline: {deadline}</p>
            <div className="space-y-1 border-t border-line pt-3">
              {rows.map((r, i) => (
                <div key={i} className="flex justify-between">
                  <span>{r.title}</span>
                  <span className="font-semibold">{r.amount} USDC</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-extrabold">
              <span>Deposit required</span>
              <span className="text-brand">{formatUnits(total, USDC_DECIMALS)} USDC</span>
            </div>
          </div>
          <p className="text-xs text-muted">
            Your wallet balance: {balance === undefined ? "..." : formatUnits(balance, USDC_DECIMALS)} USDC. Network fees are paid separately in USDC. You will confirm up to two transactions: approve, then deposit.
          </p>
          {lowBalance && (
            <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-400">
              Your USDC balance is lower than the deposit. Get test USDC at faucet.circle.com.
            </p>
          )}
          {busy && <p className="rounded-xl bg-brand/10 p-3 text-sm font-semibold text-brand">{phase}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button className={secondary} disabled={busy} onClick={() => { setError(""); setStep(2); }}>Back</button>
            <button className={primary} disabled={busy || lowBalance} onClick={publish}>
              {busy ? "Working..." : "Publish and fund"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
