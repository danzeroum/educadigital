"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { InteractivePlayer } from "@/components/features/video-player/InteractivePlayer";
import { ExerciseOverlay } from "@/components/features/exercise/ExerciseOverlay";
import { usePlayerStore } from "@/store/player.store";
import { useResource, useResourceCheckpoints, useResourceExercises } from "@/lib/api/queries";

function extractYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const m =
    url.match(/[?&]v=([^&]+)/) ??
    url.match(/youtu\.be\/([^?]+)/) ??
    url.match(/embed\/([^?]+)/);
  return m?.[1] ?? null;
}

export default function ResourcePage({ params }: { params: { id: string } }) {
  const { showExercise, activeCheckpoint, openExercise, closeExercise } = usePlayerStore();
  const [summaryLevel, setSummaryLevel] = useState<"basic" | "intermediate">("basic");
  const [exerciseIndex, setExerciseIndex] = useState(0);

  const { data: resource, isLoading } = useResource(params.id);
  const { data: checkpoints = [] } = useResourceCheckpoints(params.id);
  const { data: exercises = [] } = useResourceExercises(params.id);

  const youtubeId = extractYouTubeId(resource?.original_url ?? null);

  const mappedCheckpoints = checkpoints.map((cp) => ({
    id: cp.id,
    timestampSeconds: cp.timestamp_seconds,
    conceptKey: cp.concept_key,
    order: cp.checkpoint_order,
  }));

  const currentExercise = exercises[exerciseIndex] ?? null;
  const mappedExercise = currentExercise
    ? {
        id: currentExercise.id,
        question: currentExercise.content.question,
        options: currentExercise.content.options ?? [],
        correctIndex: currentExercise.content.correct_index ?? 0,
        explanation: currentExercise.content.explanation ?? "",
      }
    : null;

  const handleCheckpointReached = (cp: {
    id: string;
    timestampSeconds: number;
    conceptKey: string;
    order: number;
  }) => {
    const idx = checkpoints.findIndex((c) => c.id === cp.id);
    if (idx >= 0 && idx < exercises.length) setExerciseIndex(idx);
    openExercise(cp);
  };

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

        {isLoading || !youtubeId ? (
          <div className="w-full aspect-video bg-ink/80 flex items-center justify-center">
            {isLoading ? (
              <div className="h-8 w-8 border-2 border-green border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-white/40 text-sm">Vídeo indisponível</span>
            )}
          </div>
        ) : (
          <InteractivePlayer
            youtubeId={youtubeId}
            checkpoints={mappedCheckpoints}
            onCheckpointReached={handleCheckpointReached}
          />
        )}
      </div>

      {/* Content below player */}
      <div className="flex-1 bg-paper rounded-t-[28px] -mt-4 px-4 pt-5 pb-24">
        {isLoading ? (
          <div className="flex flex-col gap-3 mb-5">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-7 rounded-inner" />
            <Skeleton className="h-5 w-3/4 rounded-inner" />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              {resource?.source_name && (
                <p className="text-ink-muted text-xs font-600 mb-0.5">{resource.source_name}</p>
              )}
              <h1 className="font-display font-700 text-[20px] text-ink text-balance leading-snug">
                {resource?.title}
              </h1>
            </div>
          </div>
        )}

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
              {isLoading ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 rounded" />
                  <Skeleton className="h-4 rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                </div>
              ) : (
                <p className="text-ink text-[16px] leading-relaxed">
                  {summaryLevel === "basic"
                    ? (resource?.summary_basic ?? "Resumo não disponível.")
                    : (resource?.summary_intermediate ?? resource?.summary_basic ?? "Resumo não disponível.")}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="exercises">
            <div className="bg-surface rounded-card border border-line p-4 shadow-soft">
              {exercises.length === 0 ? (
                <p className="text-ink-soft text-sm text-center py-4">
                  Complete o vídeo para liberar os exercícios 🔒
                </p>
              ) : (
                <p className="text-ink-soft text-sm text-center py-4">
                  {exercises.length} exercícios disponíveis — aparecem nos checkpoints do vídeo 🎯
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="transcript">
            <div className="bg-surface rounded-card border border-line p-4 shadow-soft">
              {isLoading ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 rounded" />
                  <Skeleton className="h-4 rounded" />
                  <Skeleton className="h-4 w-2/3 rounded" />
                </div>
              ) : (
                <p className="text-ink text-[15px] leading-relaxed">
                  {resource?.transcript ?? "Transcrição não disponível para este conteúdo."}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* FAB Tutor */}
      <Link
        href={`/tutor/new?resource=${params.id}`}
        className="fixed bottom-6 right-4 h-14 px-5 gradient-green rounded-btn shadow-green-cta flex items-center gap-2 text-white font-700 z-30"
      >
        <MessageCircle className="h-5 w-5" />
        Tirar dúvida
      </Link>

      {/* Exercise overlay */}
      {showExercise && activeCheckpoint && mappedExercise && (
        <ExerciseOverlay
          exercise={mappedExercise}
          onContinue={closeExercise}
        />
      )}
    </div>
  );
}
