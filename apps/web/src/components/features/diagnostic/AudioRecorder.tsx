"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  onRecorded: (blob: Blob) => void;
}

export function AudioRecorder({ onRecorded }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;
    chunksRef.current = [];

    mr.ondataavailable = (e) => chunksRef.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      onRecorded(blob);
      setHasRecording(true);
      stream.getTracks().forEach((t) => t.stop());
    };

    mr.start();
    setRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Waveform */}
      <div className="flex items-center gap-[3px] h-10">
        {Array.from({ length: 13 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-1.5 rounded-full bg-green transition-transform origin-center",
              recording ? "animate-wave" : "h-2"
            )}
            style={recording ? { animationDelay: `${i * 60}ms`, height: "100%" } : { height: "8px" }}
          />
        ))}
      </div>

      {/* Timer */}
      <span className="font-mono text-2xl text-ink-soft tabular-nums">{formatTime(seconds)}</span>

      {/* Record button */}
      <div className="relative flex items-center justify-center">
        {recording && (
          <div className="absolute h-[120px] w-[120px] rounded-full bg-[#E5484D]/30 animate-ring" />
        )}
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          disabled={hasRecording}
          className={cn(
            "h-24 w-24 rounded-full flex items-center justify-center text-3xl transition-transform active:scale-95 shadow-coral-cta",
            recording ? "bg-[#E5484D]" : "bg-coral",
            hasRecording && "opacity-50"
          )}
          aria-label={recording ? "Parar gravação" : "Gravar"}
        >
          {recording ? "⏸" : "🎤"}
        </button>
      </div>

      <p className="text-ink-muted text-sm text-center">
        {hasRecording
          ? "✅ Gravação concluída!"
          : recording
            ? "Gravando… solte para parar"
            : "Pressione e segure para gravar"}
      </p>
    </div>
  );
}
