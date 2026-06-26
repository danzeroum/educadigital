"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DiagnosticStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface QuizAnswer {
  questionIndex: number;
  selectedOption: number;
  responseTimeMs: number;
}

interface DiagnosticState {
  step: DiagnosticStep;
  sessionId: string | null;
  audioBlob: Blob | null;
  photoBlob: Blob | null;
  quizAnswers: QuizAnswer[];
  readingAudioBlob: Blob | null;

  setStep: (s: DiagnosticStep) => void;
  setSessionId: (id: string) => void;
  setAudioBlob: (b: Blob) => void;
  setPhotoBlob: (b: Blob) => void;
  addQuizAnswer: (a: QuizAnswer) => void;
  setReadingAudioBlob: (b: Blob) => void;
  reset: () => void;
}

export const useDiagnosticStore = create<DiagnosticState>()(
  persist(
    (set) => ({
      step: 0,
      sessionId: null,
      audioBlob: null,
      photoBlob: null,
      quizAnswers: [],
      readingAudioBlob: null,

      setStep: (step) => set({ step }),
      setSessionId: (sessionId) => set({ sessionId }),
      setAudioBlob: (audioBlob) => set({ audioBlob }),
      setPhotoBlob: (photoBlob) => set({ photoBlob }),
      addQuizAnswer: (a) => set((s) => ({ quizAnswers: [...s.quizAnswers, a] })),
      setReadingAudioBlob: (readingAudioBlob) => set({ readingAudioBlob }),
      reset: () =>
        set({
          step: 0,
          sessionId: null,
          audioBlob: null,
          photoBlob: null,
          quizAnswers: [],
          readingAudioBlob: null,
        }),
    }),
    {
      name: "eja-diagnostic",
      partialize: (s) => ({ step: s.step, sessionId: s.sessionId, quizAnswers: s.quizAnswers }),
    }
  )
);
