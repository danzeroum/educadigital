"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Question {
  text: string;
  options: string[];
}

const QUIZ_QUESTIONS: Question[] = [
  {
    text: "Se você tem R$ 50 e gasta R$ 18, quanto sobra?",
    options: ["R$ 22", "R$ 32", "R$ 28", "R$ 38"],
  },
  {
    text: "Qual palavra completa a frase: 'Ela _____ ao mercado todos os dias.'",
    options: ["vão", "vai", "vais", "vou"],
  },
  {
    text: "Em qual estação do ano chove mais no Brasil?",
    options: ["Inverno", "Primavera", "Outono", "Verão"],
  },
  {
    text: "O que significa a placa com um triângulo vermelho?",
    options: ["Proibido", "Atenção / perigo", "Pare", "Velocidade máxima"],
  },
  {
    text: "Quanto é 7 × 8?",
    options: ["54", "56", "63", "48"],
  },
];

const OPTION_LABELS = ["A", "B", "C", "D"];
const QUESTION_TIME_SECONDS = 30;

interface Props {
  questionIndex: number;
  onAnswer: (optionIndex: number, timeMs: number) => void;
}

export function QuizStep({ questionIndex, onAnswer }: Props) {
  const question = QUIZ_QUESTIONS[questionIndex];
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);
  const startTime = useRef(Date.now());

  useEffect(() => {
    startTime.current = Date.now();
    setSelected(null);
    setTimeLeft(QUESTION_TIME_SECONDS);
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [questionIndex]);

  const handleNext = () => {
    if (selected === null) return;
    const elapsed = Date.now() - startTime.current;
    onAnswer(selected, elapsed);
  };

  const progressPct = (timeLeft / QUESTION_TIME_SECONDS) * 100;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-soft font-600">Pergunta {questionIndex + 1} de 5</span>
        <span className="font-mono text-ink-muted">{timeLeft}s</span>
      </div>

      {/* Time bar */}
      <div className="h-1.5 rounded-full bg-line-track overflow-hidden">
        <div
          className="h-full bg-coral rounded-full transition-all duration-1000"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <h2 className="font-display font-700 text-[22px] text-ink text-balance leading-tight">
        {question.text}
      </h2>

      <div className="flex flex-col gap-3">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={cn(
              "flex items-center gap-3 min-h-[56px] px-4 rounded-card-sm border text-left text-[17px] font-500 transition-all",
              selected === i
                ? "border-green bg-green-tint text-ink"
                : "border-line bg-surface text-ink hover:border-line-2"
            )}
          >
            <span
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-700 shrink-0",
                selected === i ? "bg-green text-white" : "bg-line-soft text-ink-soft"
              )}
            >
              {OPTION_LABELS[i]}
            </span>
            {opt}
          </button>
        ))}
      </div>

      <Button
        onClick={handleNext}
        disabled={selected === null}
        className="w-full mt-2"
      >
        {questionIndex < 4 ? "Próxima →" : "Concluir quiz ✓"}
      </Button>
    </div>
  );
}
