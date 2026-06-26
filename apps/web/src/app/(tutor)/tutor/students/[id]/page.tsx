"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const ACTIVITY = [
  { day: "13/6", v: 3 }, { day: "14/6", v: 5 }, { day: "15/6", v: 4 }, { day: "16/6", v: 6 },
  { day: "17/6", v: 2 }, { day: "18/6", v: 0 }, { day: "19/6", v: 0 }, { day: "20/6", v: 0 },
  { day: "21/6", v: 0 }, { day: "22/6", v: 0 }, { day: "23/6", v: 0 }, { day: "24/6", v: 0 },
  { day: "25/6", v: 0 }, { day: "26/6", v: 0 },
];

const RISK_FACTORS = [
  "8 dias sem acessar",
  "Quebrou sequência de 14 dias",
  "Taxa de acerto abaixo de 30%",
  "Queda de 70% no engajamento",
];

const DIFFICULT_CONTENT = [
  { title: "Frações equivalentes", errorRate: 80 },
  { title: "Divisão com dois algarismos", errorRate: 67 },
  { title: "Sílabas tônicas", errorRate: 55 },
];

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/tutor/students" className="h-9 w-9 rounded-squircle bg-line-soft flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 text-ink" />
        </Link>
        <h1 className="font-display font-700 text-[24px] text-ink">Perfil do aluno</h1>
      </div>

      {/* Student header */}
      <div className="bg-surface rounded-card border border-line shadow-soft p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="text-xl">J</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="font-display font-700 text-xl text-ink">João Silva</h2>
              <Badge variant="critical">Crítico</Badge>
            </div>
            <p className="text-ink-muted text-sm">EJA Fundamental I</p>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                { label: "Sequência", value: "0 dias", emoji: "🔥" },
                { label: "XP", value: "320", emoji: "⭐" },
                { label: "Módulos", value: "1/5", emoji: "📚" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-xl">{s.emoji}</p>
                  <p className="font-700 text-ink">{s.value}</p>
                  <p className="text-ink-muted text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity chart */}
      <div className="bg-surface rounded-card border border-line shadow-soft p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-700 text-ink">Atividade — últimos 14 dias</h3>
          <span className="text-ink-muted text-sm">8 dias sem acesso ⚠️</span>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={ACTIVITY} barSize={20}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#9AA89F", fontSize: 10 }} interval={1} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: "#15241C", border: "none", borderRadius: "12px", color: "#fff" }}
              formatter={(v: number) => [`${v} recursos`, ""]}
            />
            <Bar dataKey="v" radius={[4, 4, 0, 0]}>
              {ACTIVITY.map((a, i) => (
                <Cell key={i} fill={a.v > 0 ? "#16A34A" : "#ECE5D6"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Risk factors */}
      <div className="bg-[#FDE7E7] border border-[#E5484D]/20 rounded-card p-5">
        <h3 className="font-700 text-[#C5292E] mb-3">⚠️ Fatores de risco ativos</h3>
        <ul className="space-y-2">
          {RISK_FACTORS.map((f) => (
            <li key={f} className="flex items-start gap-2 text-[#C5292E] text-sm">
              <span className="mt-0.5 shrink-0">•</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Difficult content */}
      <div className="bg-surface rounded-card border border-line shadow-soft p-5">
        <h3 className="font-700 text-ink mb-4">Conteúdos com dificuldade</h3>
        <div className="flex flex-col gap-3">
          {DIFFICULT_CONTENT.map((c) => (
            <div key={c.title}>
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-600 text-ink">{c.title}</span>
                <span className="text-[#C5292E] font-700">{c.errorRate}% erro</span>
              </div>
              <div className="h-2 bg-line-track rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#E5484D]"
                  style={{ width: `${c.errorRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
