"use client";

import { useLang } from "./LanguageProvider";

export function T({ k, fb }: { k: string; fb?: string }) {
  const { t } = useLang();
  return <>{t(k, fb)}</>;
}
