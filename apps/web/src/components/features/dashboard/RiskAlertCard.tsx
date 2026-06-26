"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RiskLevel = "critical" | "high" | "medium" | "low";

const riskBorderColors = {
  critical: "border-l-[#E5484D]",
  high: "border-l-amber-deep",
  medium: "border-l-amber-deep-2",
  low: "border-l-green",
};

const riskBadgeVariant: Record<RiskLevel, "critical" | "high" | "medium" | "low"> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
};

const riskLabel: Record<RiskLevel, string> = {
  critical: "Crítico",
  high: "Alto",
  medium: "Atenção",
  low: "Em dia",
};

export interface RiskAlertData {
  id: string;
  studentName: string;
  riskLevel: RiskLevel;
  riskProbability: number;
  factors: string[];
  suggestedAction: string;
  suggestedMessage: string;
  status: "pending" | "acted";
}

interface Props {
  alert: RiskAlertData;
  onAct: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function RiskAlertCard({ alert, onAct, onDismiss }: Props) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const copyMessage = () => {
    navigator.clipboard.writeText(alert.suggestedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const acted = alert.status === "acted";

  return (
    <div
      className={cn(
        "bg-surface rounded-card border-l-4 border border-line shadow-soft transition-all",
        riskBorderColors[alert.riskLevel],
        acted && "opacity-40"
      )}
    >
      <div className="flex items-center gap-3 p-4">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="text-base">{alert.studentName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-700 text-ink">{alert.studentName}</p>
            <Badge variant={riskBadgeVariant[alert.riskLevel]}>
              {riskLabel[alert.riskLevel]}
            </Badge>
            {acted && (
              <span className="text-green-700 text-xs font-700">✓ Contato feito</span>
            )}
          </div>
          <p className="text-ink-muted text-sm truncate">{alert.factors[0]}</p>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-green text-sm font-700 min-h-0 shrink-0"
        >
          {expanded ? "Fechar" : "Ver"}
        </button>
      </div>

      {expanded && !acted && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-line pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-ink-soft text-xs font-700 uppercase tracking-wide mb-2">
                Fatores
              </p>
              <ul className="space-y-1">
                {alert.factors.map((f, i) => (
                  <li key={i} className="text-ink text-sm flex items-start gap-1.5">
                    <span className="text-[#E5484D] text-xs mt-0.5">•</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-ink-soft text-xs font-700 uppercase tracking-wide mb-2">
                Ação sugerida
              </p>
              <p className="text-ink text-sm">{alert.suggestedAction}</p>
            </div>
          </div>

          <div className="bg-green-tint border border-green/20 rounded-card-sm p-3">
            <p className="text-ink-soft text-xs font-700 mb-1.5">Mensagem sugerida</p>
            <p className="text-ink text-sm italic">&ldquo;{alert.suggestedMessage}&rdquo;</p>
            <button
              onClick={copyMessage}
              className="mt-2 text-green-700 text-xs font-700 min-h-0"
            >
              {copied ? "✓ Copiado!" : "📋 Copiar mensagem"}
            </button>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => onAct(alert.id)} size="sm" className="flex-1">
              ✓ Já fiz contato
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDismiss(alert.id)}
              className="flex-1"
            >
              Ignorar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
