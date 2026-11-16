"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Compass, Plus } from "lucide-react";

const items = [
  { href: "/", label: "Home", Icon: LayoutGrid },
  { href: "/explore", label: "Explore", Icon: Compass },
  { href: "/create", label: "Post Gig", Icon: Plus },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-3 px-2">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-3 text-xs font-semibold ${active ? "text-brand" : "text-muted"}`}
            >
              <Icon size={22} strokeWidth={active ? 2.6 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
