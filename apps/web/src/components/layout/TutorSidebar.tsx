"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

const navItems = [
  { href: "/tutor/dashboard", label: "Dashboard", emoji: "📊" },
  { href: "/tutor/students", label: "Meus alunos", emoji: "👥" },
  { href: "/tutor/alerts", label: "Alertas", emoji: "🔔" },
  { href: "/tutor/analytics", label: "Análises", emoji: "📈" },
] as const;

export function TutorSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[236px] bg-bezel flex flex-col z-40">
      <div className="px-6 pt-8 pb-6 border-b border-white/10">
        <span className="font-display font-700 text-xl text-green-spring">EducaDigital</span>
        <p className="text-sidebar-inactive text-xs mt-1">Portal do Tutor</p>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-inner text-sm font-600 transition-all",
                active
                  ? "bg-[rgba(34,197,94,.16)] text-sidebar-active"
                  : "text-sidebar-inactive hover:text-surface hover:bg-white/5"
              )}
            >
              <span className="text-lg">{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-5 border-t border-white/10 flex items-center gap-3">
        <div className="h-9 w-9 rounded-squircle bg-green flex items-center justify-center text-white font-700 text-sm">
          {user?.displayName?.[0]?.toUpperCase() ?? "T"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-surface text-sm font-600 truncate">{user?.displayName ?? "Tutor"}</p>
          <p className="text-sidebar-inactive text-xs">Tutor</p>
        </div>
      </div>
    </aside>
  );
}
