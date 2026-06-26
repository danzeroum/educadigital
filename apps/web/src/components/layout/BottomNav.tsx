"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Início", emoji: "🏠" },
  { href: "/library", label: "Explorar", emoji: "🧭" },
  { href: "/review", label: "Revisão", emoji: "🔄" },
  { href: "/tutor", label: "Tutor", emoji: "💬" },
  { href: "/profile", label: "Perfil", emoji: "👤" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-surface/80 backdrop-blur-md border-t border-line pb-safe">
      <div className="flex items-center justify-around px-2 h-[80px]">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-inner transition-colors min-w-[48px]",
                active ? "text-green" : "text-ink-faint"
              )}
            >
              <span className="text-2xl leading-none">{tab.emoji}</span>
              <span className={cn("text-[11px] font-600", active ? "text-green" : "text-ink-muted")}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
