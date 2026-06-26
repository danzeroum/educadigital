"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Exercise {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Props {
  exercise: Exercise;
  onContinue: (correct: boolean) => void;
}

export function ExerciseOverlay({ exercise, onContinue }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (i: number) => {
    if (answered) return;
    setSelected(i);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    setAnswered(true);
  };

  const correct = selected === exercise.correctIndex;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-bezel/55" onClick={answered ? undefined : undefined} />
      <div className="relative w-full bg-surface rounded-t-[28px] shadow-elevated p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-amber text-lg">⬥</span>
          <span className="font-700 text-sm text-amber-deep">Desafio do checkpoint</span>
        </div>

        <p className="font-display font-700 text-[20px] text-ink mb-5 text-balance leading-snug">
          {exercise.question}
        </p>

        <div className="flex flex-col gap-3 mb-5">
          {exercise.options.map((opt, i) => {
            let cls =
              "flex items-center gap-3 min-h-[52px] px-4 rounded-card-sm border text-[16px] font-500 transition-all text-left w-full";
            if (!answered) {
              cls += selected === i
                ? " border-green bg-green-tint text-ink"
                : " border-line bg-surface text-ink hover:border-line-2";
            } else if (i === exercise.correctIndex) {
              cls += " border-green bg-green-tint text-green-700";
            } else if (i === selected && !correct) {
              cls += " border-[#E5484D] bg-[#FDE7E7] text-[#C5292E]";
            } else {
              cls += " border-line bg-surface text-ink-muted";
            }

            return (
              <button key={i} className={cls} onClick={() => handleSelect(i)}>
                <span
                  className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center text-xs font-700 shrink-0",
                    !answered && selected === i ? "bg-green text-white" :
                    answered && i === exercise.correctIndex ? "bg-green text-white" :
                    answered && i === selected && !correct ? "bg-[#E5484D] text-white" :
                    "bg-line-soft text-ink-soft"
                  )}
                >
                  {answered && i === exercise.correctIndex ? "✓" :
                   answered && i === selected && !correct ? "✕" :
                   String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {answered ? (
          <div className={cn("rounded-card-sm p-4 mb-4", correct ? "bg-green-tint" : "bg-amber-tint")}>
            {correct ? (
              <p className="font-700 text-green-700">🎉 Isso mesmo! +10 XP</p>
            ) : (
              <>
                <p className="font-700 text-amber-deep mb-1">Quase lá! Vamos juntos 💪</p>
                <p className="text-ink-soft text-sm">{exercise.explanation}</p>
              </>
            )}
          </div>
        ) : (
          <Button
            className="w-full"
            disabled={selected === null}
            onClick={handleSubmit}
          >
            Confirmar resposta
          </Button>
        )}

        {answered && (
          <Button className="w-full" onClick={() => onContinue(correct)}>
            Continuar vídeo ▶
          </Button>
        )}
      </div>
    </div>
  );
}
