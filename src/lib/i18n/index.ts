import { en } from "./en";
import { ha } from "./ha";
import { yo } from "./yo";
import { ig } from "./ig";
import { ar } from "./ar";
import { pcm } from "./pcm";
import { fr } from "./fr";
import { zh } from "./zh";
import { hi } from "./hi";

export type Lang = "en" | "ha" | "yo" | "ig" | "ar" | "pcm" | "fr" | "zh" | "hi";

export const languages: { code: Lang; label: string; rtl?: boolean }[] = [
  { code: "en", label: "English" },
  { code: "ha", label: "Hausa" },
  { code: "yo", label: "Yorùbá" },
  { code: "ig", label: "Igbo" },
  { code: "ar", label: "العربية", rtl: true },
  { code: "pcm", label: "Pidgin" },
  { code: "fr", label: "Français" },
  { code: "zh", label: "中文" },
  { code: "hi", label: "हिन्दी" },
];

export const dicts: Record<Lang, Record<string, string>> = { en, ha, yo, ig, ar, pcm, fr, zh, hi };
