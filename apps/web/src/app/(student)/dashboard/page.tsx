"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { XPCard } from "@/components/features/gamification/XPCard";
import { StreakBadge } from "@/components/features/gamification/StreakBadge";
import { LearningPathCard, type PathItem } from "@/components/features/dashboard/LearningPathCard";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/store/auth.store";

const MOCK_ITEMS: PathItem[] = [
  {
    id: "1", title: "Frações: o que são e como usar no dia a dia",
    mediaType: "video", durationMin: 12, status: "completed", resourceId: "r1",
  },
  {
    id: "2", title: "Exercícios de frações equivalentes",
    mediaType: "exercise", durationMin: 8, status: "in_progress", resourceId: "r2",
  },
  {
    id: "3", title: "Texto: A importância das frações na culinária",
    mediaType: "text", durationMin: 6, status: "available", resourceId: "r3",
  },
  {
    id: "4", title: "Números decimais: conexão com frações",
    mediaType: "video", durationMin: 15, status: "locked", resourceId: "r4",
  },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const name = user?.displayName ?? "Aluna";
  const xp = user?.xpTotal ?? 1450;
  const streak = user?.streakDays ?? 7;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const completedCount = MOCK_ITEMS.filter((i) => i.status === "completed").length;
  const totalCount = MOCK_ITEMS.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="px-4 pt-14 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11">
            <AvatarFallback className="text-lg">{name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-display font-700 text-[20px] text-ink leading-tight">
              {greeting}, {name} 🌱
            </p>
            <p className="text-ink-muted text-sm">Vamos estudar hoje?</p>
          </div>
        </div>
        <StreakBadge days={streak} />
      </div>

      {/* XP Card */}
      <XPCard xp={xp} xpToday={10} />

      {/* Today's trail */}
      <section>
        <h2 className="font-display font-700 text-[18px] text-ink mb-3">Trilha de hoje</h2>
        <div className="flex flex-col gap-3">
          {MOCK_ITEMS.map((item) => (
            <LearningPathCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* SRS Banner */}
      <div className="gradient-amber rounded-card p-5 text-white shadow-amber-cta">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display font-700 text-[20px]">5 revisões pra hoje 🔄</p>
            <p className="text-white/80 text-sm mt-0.5">+80% na memória de longo prazo</p>
          </div>
          <Link
            href="/review"
            className="bg-white/20 hover:bg-white/30 border border-white/30 rounded-btn px-4 py-2 text-sm font-700 text-white min-h-0"
          >
            Revisar →
          </Link>
        </div>
      </div>

      {/* Module progress */}
      <div className="bg-surface rounded-card border border-line p-5 shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-600 text-ink">Módulo atual: Frações</h3>
          <span className="text-ink-muted text-sm font-mono">{completedCount}/{totalCount}</span>
        </div>
        <Progress value={progressPct} className="h-2.5" indicatorClassName="bg-green" />
        <p className="text-ink-muted text-xs mt-2">{progressPct}% concluído</p>
      </div>
    </div>
  );
}
