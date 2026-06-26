"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { XPCard } from "@/components/features/gamification/XPCard";
import { StreakBadge } from "@/components/features/gamification/StreakBadge";
import { LearningPathCard } from "@/components/features/dashboard/LearningPathCard";
import { Progress } from "@/components/ui/progress";
import { CardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth.store";
import { useGamificationProfile, useLearningPath, useDueSrsCards } from "@/lib/api/queries";
import type { PathItem } from "@/components/features/dashboard/LearningPathCard";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const name = user?.displayName ?? "Aluna";

  const { data: gamification, isLoading: loadingGami } = useGamificationProfile(user?.id ?? null);
  const { data: path, isLoading: loadingPath } = useLearningPath(user?.id ?? null);
  const { data: dueCards } = useDueSrsCards(user?.id ?? null);

  const xp = gamification?.xp_total ?? user?.xpTotal ?? 0;
  const streak = gamification?.streak_days ?? user?.streakDays ?? 0;
  const dueCount = dueCards?.length ?? 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const pathItems: PathItem[] = (path?.items ?? [])
    .sort((a, b) => a.item_order - b.item_order)
    .map((item) => ({
      id: item.id,
      title: `Recurso ${item.item_order}`,
      mediaType: "video" as const,
      durationMin: 10,
      status: item.status as PathItem["status"],
      resourceId: item.resource_id,
    }));

  const completed = path?.completed_resources ?? 0;
  const total = path?.total_resources ?? 1;
  const progressPct = Math.round((completed / total) * 100);

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
      {loadingGami ? (
        <Skeleton className="h-[120px] rounded-card" />
      ) : (
        <XPCard xp={xp} xpToday={10} />
      )}

      {/* Today's trail */}
      <section>
        <h2 className="font-display font-700 text-[18px] text-ink mb-3">Trilha de hoje</h2>
        {loadingPath ? (
          <div className="flex flex-col gap-3">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : pathItems.length === 0 ? (
          <div className="bg-surface rounded-card border border-line p-6 text-center shadow-soft">
            <span className="text-4xl">🌱</span>
            <p className="font-700 text-ink mt-2">Trilha ainda não gerada</p>
            <p className="text-ink-soft text-sm mt-1">Complete o diagnóstico para começar</p>
            <Link
              href="/diagnostic"
              className="inline-block mt-3 text-green font-700 text-sm hover:underline"
            >
              Fazer diagnóstico →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pathItems.slice(0, 4).map((item) => (
              <LearningPathCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* SRS Banner */}
      {dueCount > 0 && (
        <div className="gradient-amber rounded-card p-5 text-white shadow-amber-cta">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-700 text-[20px]">{dueCount} revisões pra hoje 🔄</p>
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
      )}

      {/* Module progress */}
      {path && (
        <div className="bg-surface rounded-card border border-line p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-600 text-ink">Progresso: {path.title}</h3>
            <span className="text-ink-muted text-sm font-mono">{completed}/{total}</span>
          </div>
          <Progress value={progressPct} className="h-2.5" indicatorClassName="bg-green" />
          <p className="text-ink-muted text-xs mt-2">{progressPct}% concluído</p>
        </div>
      )}
    </div>
  );
}
