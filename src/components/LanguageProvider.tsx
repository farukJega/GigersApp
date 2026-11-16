"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dicts, languages, type Lang } from "@/lib/i18n";
import { gigDict } from "@/lib/i18n/gig";
import { workDict } from "@/lib/i18n/work";
import { moreDict } from "@/lib/i18n/more";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, fallback?: string) => string;
};

const LangContext = createContext<Ctx>({
  lang: "en",
  setLang: () => {},
  t: (key, fallback) => fallback ?? key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved && languages.some((l) => l.code === saved)) setLangState(saved as Lang);
    } catch {}
  }, []);

  useEffect(() => {
    const meta = languages.find((l) => l.code === lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = meta?.rtl ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {}
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) =>
      dicts[lang][key] ??
      gigDict[lang]?.[key] ??
      workDict[lang]?.[key] ??
      moreDict[lang]?.[key] ??
      dicts.en[key] ??
      gigDict.en[key] ??
      workDict.en[key] ??
      fallback ??
      key,
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
