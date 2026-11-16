"use client";

import { useState } from "react";
import { useSignMessage } from "wagmi";
import { keccak256, toHex } from "viem";
import { categories } from "@/lib/categories";
import { normalizeProfile, profileMessage, type Profile } from "@/lib/profile";
import { useLang } from "./LanguageProvider";

const field =
  "w-full rounded-xl border border-line bg-card2 px-3 py-2.5 text-sm outline-none focus:border-brand";
const lbl = "mb-1 block text-xs font-semibold text-muted";

export function ProfileForm({
  address,
  profile,
  onClose,
  onSaved,
}: {
  address: string;
  profile: Profile | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLang();
  const { signMessageAsync } = useSignMessage();
  const [f, setF] = useState({
    name: profile?.name ?? "",
    title: profile?.title ?? "",
    company: profile?.company ?? "",
    bio: profile?.bio ?? "",
    skills: (profile?.skills ?? []).join(", "),
    links: (profile?.links ?? []).join("\n"),
  });
  const [cats, setCats] = useState<string[]>(profile?.categories ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof f, v: string) => setF({ ...f, [k]: v });

  async function save() {
    setError("");
    setBusy(true);
    try {
      const n = normalizeProfile({
        ...f,
        skills: f.skills.split(","),
        links: f.links.split("\n"),
        categories: cats,
      });
      if (!n.ok) throw new Error(n.error);
      const time = Math.floor(Date.now() / 1000);
      const hash = keccak256(toHex(n.json));
      const signature = await signMessageAsync({ message: profileMessage(address, hash, time) });
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, profile: n.data, time, signature }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not save profile.");
      onSaved();
    } catch (e) {
      const m = e instanceof Error ? e.message : "Something went wrong.";
      setError(/rejected|denied/i.test(m) ? "You rejected the signature." : m.slice(0, 200));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-line bg-card p-4">
      <div><label className={lbl}>{t("p_name", "Display name")}</label><input className={field} maxLength={40} value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
      <div><label className={lbl}>{t("p_ptitle", "Professional title")}</label><input className={field} maxLength={80} value={f.title} onChange={(e) => set("title", e.target.value)} /></div>
      <div><label className={lbl}>{t("p_company", "Company or organization")}</label><input className={field} maxLength={80} value={f.company} onChange={(e) => set("company", e.target.value)} /></div>
      <div><label className={lbl}>{t("p_bio", "Biography")}</label><textarea className={field} rows={4} maxLength={600} value={f.bio} onChange={(e) => set("bio", e.target.value)} /></div>
      <div><label className={lbl}>{t("p_skills", "Skills (comma separated)")}</label><input className={field} value={f.skills} onChange={(e) => set("skills", e.target.value)} /></div>
      <div>
        <label className={lbl}>{t("p_cats", "Categories")}</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c, i) => {
            const on = cats.includes(c.slug);
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => setCats(on ? cats.filter((x) => x !== c.slug) : [...cats, c.slug])}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${on ? "border-brand bg-brand text-brand-ink" : "border-line text-muted"}`}
              >
                {t(`c${i}`, c.name)}
              </button>
            );
          })}
        </div>
      </div>
      <div><label className={lbl}>{t("p_links", "Portfolio links (one per line)")}</label><textarea className={field} rows={3} value={f.links} onChange={(e) => set("links", e.target.value)} placeholder="https://..." /></div>
      <p className="text-xs text-muted">{t("p_sign_note", "You will sign a message in your wallet. It costs no gas.")}</p>
      {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button className="rounded-xl border border-line py-3 text-sm font-bold" disabled={busy} onClick={onClose}>{t("w_cancel", "Cancel")}</button>
        <button className="rounded-xl bg-brand py-3 text-sm font-extrabold text-brand-ink disabled:opacity-50" disabled={busy} onClick={save}>{busy ? "..." : t("p_save", "Sign and save")}</button>
      </div>
    </div>
  );
}
