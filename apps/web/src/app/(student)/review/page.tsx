"use client";

import { useState } from "react";
import Link from "next/link";
import { SrsCard } from "@/components/features/srs/SrsCard";
import { Confetti } from "@/components/features/diagnostic/Confetti";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const MOCK_CARDS = [
  {
    id: "c1",
    concept: "O que é uma fração?",
    answer: "Fração representa partes de um todo. Ex: 3/8 significa 3 partes de um total de 8.",
    context: "Frações no dia a dia",
  },
  {
    id: "c2",
    concept: "O que são frações equivalentes?",
    answer:
      "São frações com valores iguais mas representações diferentes. Ex: 1/2 = 2/4 = 4/8.",
    context: "Frações no dia a dia",
  },
  {
    id: "c3",
    concept: "Como somar frações com denominadores iguais?",
    answer: "Some os numeradores e mantenha o denominador. Ex: 1/5 + 2/5 = 3/5.",
    context: "Frações no dia a dia",
  },
];

export default function ReviewPage() {
  const [cardIndex, setCardIndex] = useState(0);
  const [ratings, setRatings] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const handleRate = (rating: 0 | 3 | 4 | 5) => {
    const newRatings = [...ratings, rating];
    setRatings(newRatings);
    if (cardIndex + 1 >= MOCK_CARDS.length) {
      setDone(true);
    } else {
      setCardIndex((i) => i + 1);
    }
  };

  const xpEarned = ratings.filter((r) => r >= 4).length * 10;
  const progressPct = Math.round(((cardIndex) / MOCK_CARDS.length) * 100);

  if (done) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-5 gap-8 text-center">
        <Confetti />
        <h1 className="font-display font-800 text-[30px] text-ink">Revisão concluída! 🎉</h1>

        <div className="grid grid-cols-3 gap-3 w-full">
          {[
            { label: "Cards", value: MOCK_CARDS.length, emoji: "🗂️" },
            { label: "XP ganho", value: `+${xpEarned}`, emoji: "⭐" },
            { label: "Acertos", value: ratings.filter((r) => r >= 3).length, emoji: "✅" },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface rounded-card border border-line p-3">
              <span className="text-2xl">{stat.emoji}</span>
              <p className="font-display font-700 text-xl text-ink">{stat.value}</p>
              <p className="text-ink-muted text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        <p className="text-ink-soft">
          Você verá estes {MOCK_CARDS.length} cards de novo amanhã 📅
        </p>

        <Button asChild className="w-full shadow-green-cta">
          <Link href="/dashboard">Voltar ao início 🏠</Link>
        </Button>
      </div>
    );
  }

  const card = MOCK_CARDS[cardIndex];

  return (
    <div
      className="min-h-screen flex flex-col px-4 pt-14 pb-8 gap-6"
      style={{ background: "linear-gradient(160deg, #EAF8EF 0%, #F3E8FF 100%)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="h-9 w-9 rounded-squircle bg-surface/80 flex items-center justify-center text-ink shrink-0"
        >
          ✕
        </Link>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-ink-soft text-sm font-600">Revisão de hoje</p>
            <span className="font-mono text-ink-muted text-sm">
              {cardIndex + 1} de {MOCK_CARDS.length}
            </span>
          </div>
          <Progress value={progressPct} indicatorClassName="bg-green" />
        </div>
      </div>

      {/* Card */}
      <SrsCard
        key={card.id}
        concept={card.concept}
        answer={card.answer}
        context={card.context}
        onRate={handleRate}
      />
    </div>
  );
}
