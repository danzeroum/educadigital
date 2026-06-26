"use client";

import { useState } from "react";
import { RiskAlertCard, type RiskAlertData } from "@/components/features/dashboard/RiskAlertCard";

const INITIAL: RiskAlertData[] = [
  {
    id: "a1",
    studentName: "João Silva",
    riskLevel: "critical",
    riskProbability: 0.87,
    factors: ["8 dias sem acessar", "Quebrou sequência de 14 dias", "Taxa de acerto abaixo de 30%"],
    suggestedAction: "Contato imediato necessário.",
    suggestedMessage: "Oi João! Sentimos muito sua falta nos últimos 8 dias. Está tudo bem? 🌟",
    status: "pending",
  },
  {
    id: "a2",
    studentName: "Maria Souza",
    riskLevel: "high",
    riskProbability: 0.65,
    factors: ["4 dias sem acessar", "Tendência de queda no engajamento"],
    suggestedAction: "Enviar mensagem de incentivo via WhatsApp dentro de 24h.",
    suggestedMessage: "Olá Maria! Você estava indo muito bem! Que tal retomar hoje? 📚",
    status: "pending",
  },
  {
    id: "a3",
    studentName: "Carla Neves",
    riskLevel: "medium",
    riskProbability: 0.45,
    factors: ["3 dias sem acessar", "Queda nos exercícios"],
    suggestedAction: "Monitorar por mais 2 dias. Enviar lembrete se não acessar.",
    suggestedMessage: "Continue assim! Cada dia de estudo conta para o seu futuro 💪",
    status: "acted",
  },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<RiskAlertData[]>(INITIAL);

  const act = (id: string) =>
    setAlerts((a) => a.map((al) => (al.id === id ? { ...al, status: "acted" } : al)));
  const dismiss = (id: string) => setAlerts((a) => a.filter((al) => al.id !== id));

  const pending = alerts.filter((a) => a.status === "pending");

  return (
    <div className="flex flex-col gap-6 max-w-[760px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-800 text-[28px] text-ink">Alertas</h1>
          <p className="text-ink-soft">{pending.length} pendentes</p>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="bg-green-tint border border-green/20 rounded-card p-10 text-center">
          <span className="text-5xl">✅</span>
          <p className="font-display font-700 text-xl text-green-700 mt-3">Nenhum alerta ativo!</p>
          <p className="text-ink-soft mt-1">Todos os alertas foram resolvidos. Ótimo trabalho!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert) => (
            <RiskAlertCard key={alert.id} alert={alert} onAct={act} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </div>
  );
}
