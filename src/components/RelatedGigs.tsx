"use client";

import { useGigs } from "@/lib/useGigs";
import { GigCard } from "./GigCard";
import { useLang } from "./LanguageProvider";

export function RelatedGigs({ category, excludeId }: { category: string; excludeId: number }) {
  const { t } = useLang();
  const { rows } = useGigs(100);
  const list = rows
    .filter((g) => g.id !== excludeId && g.status === 0 && g.meta?.category === category)
    .slice(0, 3);
  if (list.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 font-bold">{t("g_related", "Related gigs")}</h2>
      <div className="space-y-3">
        {list.map((g) => (
          <GigCard key={g.id} g={g} />
        ))}
      </div>
    </section>
  );
}
