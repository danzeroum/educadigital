"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AchievementBadge } from "@/components/features/gamification/AchievementBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth.store";
import { useGamificationProfile, useAchievements, useCertificates } from "@/lib/api/queries";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuthStore();
  const name = user?.displayName ?? "Estudante";
  const [notifications, setNotifications] = useState(true);

  const { data: gami, isLoading: loadingGami } = useGamificationProfile(user?.id ?? null);
  const { data: achievements = [], isLoading: loadingAch } = useAchievements(user?.id ?? null);
  const { data: certificates = [] } = useCertificates(user?.id ?? null);

  const xp = gami?.xp_total ?? 0;
  const streak = gami?.streak_days ?? 0;

  const stats = [
    { label: "Sequência", value: `${streak} dias`, emoji: "🔥", color: "text-amber-deep bg-amber-tint" },
    { label: "XP total", value: xp.toLocaleString("pt-BR"), emoji: "⭐", color: "text-green-700 bg-green-tint" },
    { label: "Módulos", value: "—", emoji: "📚", color: "text-sky-deep bg-sky-tint" },
    { label: "Acertos", value: "—", emoji: "✅", color: "text-purple-deep bg-purple-tint" },
  ];

  return (
    <div className="px-4 pt-14 flex flex-col gap-6">
      {/* Hero */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-2xl">{name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-800 text-[22px] text-ink">{name}</h1>
          {user?.ejaLevel && (
            <span className="bg-green-tint text-green-700 rounded-full px-2.5 py-0.5 text-xs font-700">
              {user.ejaLevel}
            </span>
          )}
        </div>
        <button className="h-9 px-3 rounded-inner bg-line-soft text-ink-soft text-sm font-600 min-h-0">
          Editar
        </button>
      </div>

      {/* Stats 2×2 */}
      {loadingGami ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-card" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className={`rounded-card p-4 flex items-center gap-3 ${s.color}`}>
              <span className="text-3xl">{s.emoji}</span>
              <div>
                <p className="font-display font-700 text-xl">{s.value}</p>
                <p className="text-xs font-600 opacity-70">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Achievements */}
      <section>
        <h2 className="font-display font-700 text-[18px] text-ink mb-3">Conquistas</h2>
        {loadingAch ? (
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-card-sm" />)}
          </div>
        ) : achievements.length === 0 ? (
          <p className="text-ink-muted text-sm">Nenhuma conquista ainda — continue estudando! 💪</p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {achievements.map((a) => (
              <AchievementBadge
                key={a.id}
                name={a.name}
                emoji={a.icon_url ?? "🏆"}
                earned={!!a.earned_at}
                xpReward={a.xp_reward}
              />
            ))}
          </div>
        )}
      </section>

      {/* Certificates */}
      {certificates.length > 0 && (
        <section>
          <h2 className="font-display font-700 text-[18px] text-ink mb-3">Certificados</h2>
          {certificates.map((c) => (
            <div key={c.id} className="gradient-green-deep rounded-card p-5 text-white flex items-center gap-4 shadow-green-cta mb-3">
              <div className="flex-1">
                <p className="font-display font-700 text-lg">{c.title}</p>
                <p className="text-green-bright text-sm mt-0.5">
                  {new Date(c.issued_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                </p>
                <p className="font-mono text-green-bright/60 text-xs mt-2">{c.verification_code}</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="h-14 w-14 bg-white rounded-inner flex items-center justify-center">
                  <span className="text-2xl">▦</span>
                </div>
                {c.pdf_url && (
                  <a href={c.pdf_url} target="_blank" rel="noreferrer" className="text-green-bright text-xs font-700 min-h-0">
                    ⬇ PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Settings */}
      <section className="bg-surface rounded-card border border-line divide-y divide-line shadow-soft mb-4">
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-ink font-600">🔔 Notificações</span>
          <button
            onClick={() => setNotifications((v) => !v)}
            className={`h-6 w-11 rounded-full transition-colors relative min-h-0 min-w-0 ${notifications ? "bg-green" : "bg-line"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${notifications ? "left-5" : "left-0.5"}`} />
          </button>
        </div>
        <button className="flex items-center justify-between px-4 py-3.5 w-full text-ink font-600 hover:bg-paper">
          <span>📥 Downloads offline</span>
          <span className="text-ink-muted text-sm">→</span>
        </button>
        <button className="flex items-center justify-between px-4 py-3.5 w-full text-ink font-600 hover:bg-paper">
          <span>🔒 Privacidade (LGPD)</span>
          <span className="text-ink-muted text-sm">→</span>
        </button>
        <button
          onClick={logout}
          className="flex items-center px-4 py-3.5 w-full text-[#E5484D] font-700 hover:bg-[#FDE7E7]"
        >
          Sair da conta
        </button>
      </section>
    </div>
  );
}
