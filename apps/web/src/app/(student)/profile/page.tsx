"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AchievementBadge } from "@/components/features/gamification/AchievementBadge";
import { useAuthStore } from "@/store/auth.store";

const ACHIEVEMENTS = [
  { id: "1", name: "Primeira Aula", emoji: "🎓", earned: true, xpReward: 50 },
  { id: "2", name: "7 Dias Seguidos", emoji: "🔥", earned: true, xpReward: 100 },
  { id: "3", name: "Mestre das Frações", emoji: "🧮", earned: true, xpReward: 150 },
  { id: "4", name: "10 Revisões", emoji: "🔄", earned: false, xpReward: 80 },
  { id: "5", name: "Leitor Voraz", emoji: "📚", earned: false, xpReward: 100 },
  { id: "6", name: "Quiz Perfeito", emoji: "💯", earned: false, xpReward: 120 },
  { id: "7", name: "Tutor Amigo", emoji: "💬", earned: false, xpReward: 60 },
  { id: "8", name: "Árvore Frondosa", emoji: "🌳", earned: false, xpReward: 500 },
];

const STATS = [
  { label: "Sequência", value: "7 dias", emoji: "🔥", color: "text-amber-deep bg-amber-tint" },
  { label: "XP total", value: "1.450", emoji: "⭐", color: "text-green-700 bg-green-tint" },
  { label: "Módulos", value: "3", emoji: "📚", color: "text-sky-deep bg-sky-tint" },
  { label: "Acertos", value: "89%", emoji: "✅", color: "text-purple-deep bg-purple-tint" },
];

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const name = user?.displayName ?? "Ana Lima";
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="px-4 pt-14 flex flex-col gap-6">
      {/* Hero */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-2xl">{name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-800 text-[22px] text-ink">{name}</h1>
          <span className="bg-green-tint text-green-700 rounded-full px-2.5 py-0.5 text-xs font-700">
            EJA Fundamental II
          </span>
        </div>
        <button className="h-9 px-3 rounded-inner bg-line-soft text-ink-soft text-sm font-600 min-h-0">
          Editar
        </button>
      </div>

      {/* Stats 2×2 */}
      <div className="grid grid-cols-2 gap-3">
        {STATS.map((s) => (
          <div key={s.label} className={`rounded-card p-4 flex items-center gap-3 ${s.color}`}>
            <span className="text-3xl">{s.emoji}</span>
            <div>
              <p className="font-display font-700 text-xl">{s.value}</p>
              <p className="text-xs font-600 opacity-70">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <section>
        <h2 className="font-display font-700 text-[18px] text-ink mb-3">Conquistas</h2>
        <div className="grid grid-cols-4 gap-2">
          {ACHIEVEMENTS.map((a) => (
            <AchievementBadge key={a.id} {...a} />
          ))}
        </div>
      </section>

      {/* Certificate */}
      <section>
        <h2 className="font-display font-700 text-[18px] text-ink mb-3">Certificado</h2>
        <div className="gradient-green-deep rounded-card p-5 text-white flex items-center gap-4 shadow-green-cta">
          <div className="flex-1">
            <p className="font-display font-700 text-lg">Módulo: Frações</p>
            <p className="text-green-bright text-sm mt-0.5">Concluído em jun/2026</p>
            <p className="font-mono text-green-bright/60 text-xs mt-2">
              EDU-2026-FRA-0042
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-14 w-14 bg-white rounded-inner flex items-center justify-center">
              <span className="text-2xl">▦</span>
            </div>
            <button className="text-green-bright text-xs font-700 min-h-0">⬇ PDF</button>
          </div>
        </div>
      </section>

      {/* Settings */}
      <section className="bg-surface rounded-card border border-line divide-y divide-line shadow-soft mb-4">
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-ink font-600">🔔 Notificações</span>
          <button
            onClick={() => setNotifications((v) => !v)}
            className={`h-6 w-11 rounded-full transition-colors relative min-h-0 min-w-0 ${notifications ? "bg-green" : "bg-line"}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${notifications ? "left-5" : "left-0.5"}`}
            />
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
      </section>
    </div>
  );
}
