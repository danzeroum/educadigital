"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/player.store";

interface Checkpoint {
  id: string;
  timestampSeconds: number;
  conceptKey: string;
  order: number;
}

interface Props {
  youtubeId: string;
  checkpoints: Checkpoint[];
  onCheckpointReached: (c: Checkpoint) => void;
}

export function InteractivePlayer({ youtubeId, checkpoints, onCheckpointReached }: Props) {
  const { setCurrentTime, setDuration, setPlaying, showExercise } = usePlayerStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const triggeredRef = useRef<Set<string>>(new Set());

  const handleMessage = useCallback(
    (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data.event === "onStateChange") {
          setPlaying(data.info === 1);
        }
        if (data.event === "infoDelivery" && data.info?.currentTime !== undefined) {
          const t = data.info.currentTime as number;
          setCurrentTime(t);
          if (data.info.duration) setDuration(data.info.duration);
          const due = checkpoints.find(
            (c) => !triggeredRef.current.has(c.id) && Math.abs(t - c.timestampSeconds) < 1
          );
          if (due) {
            triggeredRef.current.add(due.id);
            onCheckpointReached(due);
          }
        }
      } catch {}
    },
    [checkpoints, onCheckpointReached, setCurrentTime, setDuration, setPlaying]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const src = `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&modestbranding=1&rel=0&origin=${encodeURIComponent(
    typeof window !== "undefined" ? window.location.origin : ""
  )}`;

  return (
    <div className="relative w-full bg-ink" style={{ paddingTop: "56.25%" }}>
      <iframe
        ref={iframeRef}
        src={src}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Vídeo educacional"
      />
      {showExercise && (
        <div className="absolute inset-0 bg-bezel/55 pointer-events-none" />
      )}
    </div>
  );
}
