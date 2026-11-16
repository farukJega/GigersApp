"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Compass, Plus, LayoutDashboard, User } from "lucide-react";
import { useLang } from "./LanguageProvider";

const items = [
  { href: "/app", k: "nav_home", fb: "Home", Icon: LayoutGrid },
  { href: "/explore", k: "nav_explore", fb: "Explore", Icon: Compass },
  { href: "/create", k: "nav_post", fb: "Post Gig", Icon: Plus },
  { href: "/dashboard", k: "nav_dash", fb: "Dashboard", Icon: LayoutDashboard },
  { href: "/profile", k: "nav_profile", fb: "Profile", Icon: User },
];

export function BottomNav() {
  const path = usePathname();
  const { t } = useLang();
  if (path === "/") return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-5 px-1">
        {items.map(({ href, k, fb, Icon }) => {
          const active = path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-3 text-[11px] font-semibold ${active ? "text-brand" : "text-muted"}`}
            >
              <Icon size={21} strokeWidth={active ? 2.6 : 2} />
              {t(k, fb)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
