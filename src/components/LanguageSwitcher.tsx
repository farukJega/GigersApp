"use client";

import { useState } from "react";
import { Globe, Check } from "lucide-react";
import { languages } from "@/lib/i18n";
import { useLang } from "./LanguageProvider";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={t("language")}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card transition active:scale-95"
      >
        <Globe size={18} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute end-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-line bg-card shadow-xl">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-4 py-3 text-sm hover:bg-card2"
              >
                <span className={lang === l.code ? "font-bold text-brand" : ""}>{l.label}</span>
                {lang === l.code && <Check size={16} className="text-brand" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
