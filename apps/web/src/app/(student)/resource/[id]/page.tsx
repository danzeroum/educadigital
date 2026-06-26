"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InteractivePlayer } from "@/components/features/video-player/InteractivePlayer";
import { ExerciseOverlay } from "@/components/features/exercise/ExerciseOverlay";
import { usePlayerStore } from "@/store/player.store";

const MOCK_CHECKPOINTS = [
  { id: "cp1", timestampSeconds: 120, conceptKey: "Definição de fração", order: 1 },
  { id: "cp2", timestampSeconds: 240, conceptKey: "Frações equivalentes", order: 2 },
];

const MOCK_EXERCISE = {
  id: "ex1",
  question: "Se uma pizza foi cortada em 8 pedaços e você comeu 3, que fração da pizza você comeu?",
  options: ["3/8", "5/8", "8/3", "3/5"],
  correctIndex: 0,
  explanation:
    "Você comeu 3 de 8 pedaços. Fração = parte / total = 3/8. A pizza inteira tem 8 partes, e você pegou 3 delas.",
};

const MOCK_RESOURCE = {
  title: "Frações: o que são e como usar no dia a dia",
  source: "Khan Academy",
  summaryBasic:
    "Fração é uma forma de representar partes de um todo. Imagine uma laranja dividida em 4 partes — cada parte é 1/4. Usamos frações o tempo todo: metade de um preço, 3/4 de uma receita, etc.",
  transcript:
    "Olá! Hoje vamos aprender sobre frações de um jeito bem fácil. Pensa assim: você tem uma pizza inteira, divide em 8 pedaços e come 3. Quantos pedaços você comeu em relação ao total?...",
};

export default function ResourcePage({ params }: { params: { id: string } }) {
  const { showExercise, activeCheckpoint, openExercise, closeExercise } = usePlayerStore();
  const [summaryLevel, setSummaryLevel] = useState<"basic" | "intermediate">("basic");

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      {/* Video area */}
      <div className="relative">
        <Link
          href="/dashboard"
          className="absolute top-12 left-4 z-10 h-9 w-9 rounded-squircle bg-black/40 flex items-center justify-center text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <InteractivePlayer
          youtubeId="dQw4w9WgXcQ"
          checkpoints={MOCK_CHECKPOINTS}
          onCheckpointReached={openExercise}
        />
      </div>

      {/* Content below player */}
      <div className="flex-1 bg-paper rounded-t-[28px] -mt-4 px-4 pt-5 pb-24">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-ink-muted text-xs font-600 mb-0.5">{MOCK_RESOURCE.source}</p>
            <h1 className="font-display font-700 text-[20px] text-ink text-balance leading-snug">
              {MOCK_RESOURCE.title}
            </h1>
          </div>
        </div>

        <Tabs defaultValue="summary">
          <TabsList className="w-full mb-1">
            <TabsTrigger value="summary">Resumo</TabsTrigger>
            <TabsTrigger value="exercises">Exercícios</TabsTrigger>
            <TabsTrigger value="transcript">Transcrição</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="bg-surface rounded-card border border-line p-4 shadow-soft">
              <div className="flex gap-2 mb-3">
                {(["basic", "intermediate"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setSummaryLevel(l)}
                    className={`rounded-full px-3 py-1 text-xs font-700 transition-colors ${
                      summaryLevel === l
                        ? "bg-green text-white"
                        : "bg-line-soft text-ink-soft"
                    }`}
                  >
                    {l === "basic" ? "Básico" : "Intermediário"}
                  </button>
                ))}
              </div>
              <p className="text-ink text-[16px] leading-relaxed">{MOCK_RESOURCE.summaryBasic}</p>
            </div>
          </TabsContent>

          <TabsContent value="exercises">
            <div className="bg-surface rounded-card border border-line p-4 shadow-soft">
              <p className="text-ink-soft text-sm text-center py-4">
                Complete o vídeo para liberar os exercícios 🔒
              </p>
            </div>
          </TabsContent>

          <TabsContent value="transcript">
            <div className="bg-surface rounded-card border border-line p-4 shadow-soft">
              <p className="text-ink text-[15px] leading-relaxed">{MOCK_RESOURCE.transcript}</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* FAB Tutor */}
      <Link
        href="/tutor/new"
        className="fixed bottom-6 right-4 h-14 px-5 gradient-green rounded-btn shadow-green-cta flex items-center gap-2 text-white font-700 z-30"
      >
        <MessageCircle className="h-5 w-5" />
        Tirar dúvida
      </Link>

      {/* Exercise overlay */}
      {showExercise && activeCheckpoint && (
        <ExerciseOverlay
          exercise={MOCK_EXERCISE}
          onContinue={closeExercise}
        />
      )}
    </div>
  );
}
