"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  concept: string;
  answer: string;
  context?: string;
  onRate: (rating: 0 | 3 | 4 | 5) => void;
}

const RATINGS: { rating: 0 | 3 | 4 | 5; label: string; emoji: string; cls: string }[] = [
  { rating: 0, label: "Não lembrei", emoji: "😵", cls: "bg-[#FDE7E7] text-[#C5292E] border-[#E5484D]/30" },
  { rating: 3, label: "Difícil", emoji: "😓", cls: "bg-amber-tint text-amber-deep border-amber-border" },
  { rating: 4, label: "Bom", emoji: "😊", cls: "bg-green-tint text-green-700 border-green/20" },
  { rating: 5, label: "Fácil ⭐", emoji: "🤩", cls: "bg-green text-white border-transparent" },
];

export function SrsCard({ concept, answer, context, onRate }: Props) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flip-container w-full" style={{ height: "340px" }}>
      <div className={cn("flip-inner w-full h-full", flipped && "flipped")}>
        {/* Front */}
        <div className="flip-front bg-surface rounded-card border border-line shadow-elevated p-6 flex flex-col items-center justify-center gap-4 text-center">
          {context && (
            <span className="bg-sky-tint text-sky-deep rounded-full px-3 py-1 text-xs font-600">
              📹 {context}
            </span>
          )}
          <p className="font-display font-700 text-[27px] text-ink text-balance leading-tight">
            {concept}
          </p>
          <p className="text-ink-muted text-sm">Pense na resposta…</p>
          <Button
            variant="outline"
            className="mt-4 gap-2"
            onClick={() => setFlipped(true)}
          >
            Ver resposta 🔄
          </Button>
        </div>

        {/* Back */}
        <div className="flip-back bg-surface rounded-card border border-line shadow-elevated p-6 flex flex-col gap-4">
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
            <p className="font-display font-700 text-[22px] text-ink text-balance leading-snug">
              {answer}
            </p>
          </div>
          <div>
            <p className="text-center text-ink-soft text-sm font-600 mb-3">Como você foi?</p>
            <div className="grid grid-cols-2 gap-2">
              {RATINGS.map((r) => (
                <button
                  key={r.rating}
                  onClick={() => onRate(r.rating)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-card-sm border p-3 text-sm font-700 transition-all active:scale-95",
                    r.cls
                  )}
                >
                  <span className="text-2xl">{r.emoji}</span>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
