"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card text-base transition active:scale-95"
    >
      {dark ? "\u2600" : "\u263E"}
    </button>
  );
}
