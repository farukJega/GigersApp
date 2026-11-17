"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Lock } from "lucide-react";
import { SecureImage } from "./SecureImage";
import { useLang } from "./LanguageProvider";

export type WorkOut = {
  gigId: string;
  index: number;
  note: string;
  links: string[];
  finalLinks: string[];
  hasFinal: boolean;
  files: string[];
};

function LinkRow({ url, canCopy }: { url: string; canCopy: boolean }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-card p-2">
      <span className="min-w-0 flex-1 break-all text-xs font-semibold text-brand">{url}</span>
      {canCopy && (
        <button
          type="button"
          aria-label="Copy"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setOk(true);
              setTimeout(() => setOk(false), 1500);
            } catch {}
          }}
        >
          {ok ? <Check size={14} /> : <Copy size={14} />}
        </button>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        aria-label="Open"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line"
      >
        <ExternalLink size={14} />
      </a>
    </div>
  );
}

export function WorkView({ w, paid }: { w: WorkOut; paid: boolean }) {
  const { t } = useLang();
  const safe = (l: string) => /^https?:\/\//i.test(l);
  const review = w.links.filter(safe);
  const finals = w.finalLinks.filter(safe);

  return (
    <div className="space-y-3 rounded-lg bg-card2 p-3">
      <p className="flex items-center gap-1 text-xs font-bold text-muted">
        <Lock size={12} /> {t("w_work")}
      </p>
      {w.note && <p className="whitespace-pre-wrap text-sm">{w.note}</p>}

      {w.files.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {w.files.map((id) => (
            <SecureImage key={id} id={id} paid={paid} />
          ))}
        </div>
      )}

      {review.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-muted">{t("w_review_links", "Review links")}</p>
          {review.map((l) => (
            <LinkRow key={l} url={l} canCopy={paid} />
          ))}
        </div>
      )}

      {finals.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-muted">{t("w_final_links", "Final delivery links")}</p>
          {finals.map((l) => (
            <LinkRow key={l} url={l} canCopy />
          ))}
        </div>
      ) : w.hasFinal ? (
        <p className="flex items-center gap-1 text-xs text-muted">
          <Lock size={12} /> {t("w_final_locked", "Final delivery links unlock after payment.")}
        </p>
      ) : null}
    </div>
  );
}
