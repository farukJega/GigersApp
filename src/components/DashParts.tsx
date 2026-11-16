"use client";

import { useLang } from "./LanguageProvider";

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-brand">{value}</p>
    </div>
  );
}

export function Empty() {
  const { t } = useLang();
  return (
    <p className="rounded-2xl border border-dashed border-line bg-card p-5 text-center text-sm text-muted">
      {t("d_none", "Nothing here yet")}
    </p>
  );
}

export function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 font-bold">
        {title}
        {count !== undefined && (
          <span className="rounded-full bg-card2 px-2 py-0.5 text-xs text-muted">{count}</span>
        )}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
