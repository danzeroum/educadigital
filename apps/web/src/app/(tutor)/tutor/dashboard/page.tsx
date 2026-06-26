"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MetricCard } from "@/components/features/dashboard/MetricCard";
import { RiskAlertCard, type RiskAlertData } from "@/components/features/dashboard/RiskAlertCard";

const ENGAGEMENT_DATA = [
  { day: "Seg", value: 22 },
  { day: "Ter", value: 18 },
  { day: "Qua", value: 25 },
  { day: "Qui", value: 20 },
  { day: "Sex", value: 15 },
  { day: "Sáb", value: 8 },
  { day: "Dom", value: 12 },
];

const INITIAL_ALERTS: RiskAlertData[] = [
  {
    id: "a1",
    studentName: "João Silva",
    riskLevel: "critical",
    riskProbability: 0.87,
    factors: ["8 dias sem acessar", "Quebrou sequência de 14 dias", "Taxa de acerto abaixo de 30%"],
    suggestedAction: "Contato imediato necessário. O aluno está em risco iminente de evasão.",
    suggestedMessage:
      "Oi João! Sentimos muito sua falta nos últimos 8 dias. Está tudo bem? Estamos aqui para ajudar! 🌟",
    status: "pending",
  },
  {
    id: "a2",
    studentName: "Maria Souza",
    riskLevel: "high",
    riskProbability: 0.65,
    factors: ["4 dias sem acessar", "Tendência de queda no engajamento"],
    suggestedAction: "Enviar mensagem de incentivo via WhatsApp dentro de 24h.",
    suggestedMessage:
      "Olá Maria! Você estava indo muito bem! Que tal retomar seus estudos hoje? Sua trilha está esperando 📚",
    status: "pending",
  },
];

export default function TutorDashboardPage() {
  const [alerts, setAlerts] = useState<RiskAlertData[]>(INITIAL_ALERTS);

  const act = (id: string) =>
    setAlerts((a) => a.map((al) => (al.id === id ? { ...al, status: "acted" } : al)));
  const dismiss = (id: string) =>
    setAlerts((a) => a.filter((al) => al.id !== id));

  const activeAlerts = alerts.filter((a) => a.status === "pending");

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <div>
        <h1 className="font-display font-800 text-[28px] text-ink">Bom dia, Professora! 👋</h1>
        <p className="text-ink-soft">Aqui está um resumo da sua turma hoje.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total de alunos" value={30} emoji="👥" />
        <MetricCard label="Ativos esta semana" value={22} sub="73% da turma" emoji="✅" variant="green" />
        <MetricCard label="Em risco" value={4} sub="2 críticos" emoji="⚠️" variant="danger" />
        <MetricCard label="XP médio" value={240} sub="↑ 12% vs sem. passada" emoji="⭐" variant="amber" />
      </div>

      {/* Alerts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-700 text-[20px] text-ink">Alertas urgentes</h2>
          {activeAlerts.length > 0 && (
            <span className="bg-[#FDE7E7] text-[#C5292E] rounded-full px-2.5 py-0.5 text-sm font-700">
              {activeAlerts.length} pendentes
            </span>
          )}
        </div>

        {activeAlerts.length === 0 ? (
          <div className="bg-green-tint border border-green/20 rounded-card p-6 text-center">
            <span className="text-3xl">✅</span>
            <p className="font-700 text-green-700 mt-2">Nenhum alerta ativo!</p>
            <p className="text-ink-soft text-sm">Todos os alertas foram resolvidos.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-[760px]">
            {alerts.map((alert) => (
              <RiskAlertCard key={alert.id} alert={alert} onAct={act} onDismiss={dismiss} />
            ))}
          </div>
        )}
      </section>

      {/* Engagement chart */}
      <section>
        <h2 className="font-display font-700 text-[20px] text-ink mb-4">
          Engajamento — últimos 7 dias
        </h2>
        <div className="bg-surface rounded-card border border-line shadow-soft p-5">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ENGAGEMENT_DATA} barSize={32}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#9AA89F", fontSize: 12 }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "#15241C", border: "none", borderRadius: "12px", color: "#fff" }}
                cursor={{ fill: "#EAF8EF" }}
              />
              <Bar dataKey="value" fill="#16A34A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
