"use client";

import { useState } from "react";
import Link from "next/link";
import { SrsCard } from "@/components/features/srs/SrsCard";
import { Confetti } from "@/components/features/diagnostic/Confetti";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth.store";
import { useDueSrsCards, useReviewSrsCard } from "@/lib/api/queries";

export default function ReviewPage() {
  const user = useAuthStore((s) => s.user);
  const { data: cards = [], isLoading } = useDueSrsCards(user?.id ?? null);
  const reviewCard = useReviewSrsCard();

  const [cardIndex, setCardIndex] = useState(0);
  const [ratings, setRatings] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const handleRate = (rating: 0 | 3 | 4 | 5) => {
    const card = cards[cardIndex];
    if (card) {
      reviewCard.mutate({ cardId: card.id, rating });
    }
    const newRatings = [...ratings, rating];
    setRatings(newRatings);
    if (cardIndex + 1 >= cards.length) {
      setDone(true);
    } else {
      setCardIndex((i) => i + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col px-4 pt-14 pb-8 gap-6"
        style={{ background: "linear-gradient(160deg, #EAF8EF 0%, #F3E8FF 100%)" }}>
        <Skeleton className="h-4 rounded-full" />
        <Skeleton className="h-[340px] rounded-card" />
      </div>
    );
  }

  if (cards.length === 0 || done) {
    const xpEarned = ratings.filter((r) => r >= 4).length * 10;
    const isComplete = done && cards.length > 0;

    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-5 gap-8 text-center">
        {isComplete && <Confetti />}
        <h1 className="font-display font-800 text-[30px] text-ink">
          {isComplete ? "Revisão concluída! 🎉" : "Tudo em dia! 🌱"}
        </h1>

        {isComplete ? (
          <div className="grid grid-cols-3 gap-3 w-full">
            {[
              { label: "Cards", value: cards.length, emoji: "🗂️" },
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
        ) : (
          <p className="text-ink-soft">
            Nenhuma revisão pendente para hoje. Volte amanhã! 📅
          </p>
        )}

        <Button asChild className="w-full shadow-green-cta">
          <Link href="/dashboard">Voltar ao início 🏠</Link>
        </Button>
      </div>
    );
  }

  const card = cards[cardIndex];
  const progressPct = Math.round((cardIndex / cards.length) * 100);

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
              {cardIndex + 1} de {cards.length}
            </span>
          </div>
          <Progress value={progressPct} indicatorClassName="bg-green" />
        </div>
      </div>

      {/* Card */}
      <SrsCard
        key={card.id}
        concept={card.concept_label}
        answer="Reflita sobre o que você aprendeu. Como estava sua memória sobre este conceito?"
        onRate={handleRate}
      />
    </div>
  );
}
