"use client";

import { create } from "zustand";

interface Checkpoint {
  id: string;
  timestampSeconds: number;
  conceptKey: string;
  order: number;
}

interface PlayerState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  checkpoints: Checkpoint[];
  showExercise: boolean;
  activeCheckpoint: Checkpoint | null;
  selectedAnswer: string | null;
  answered: boolean;

  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
  setPlaying: (v: boolean) => void;
  setCheckpoints: (c: Checkpoint[]) => void;
  openExercise: (checkpoint: Checkpoint) => void;
  closeExercise: () => void;
  selectAnswer: (id: string) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  checkpoints: [],
  showExercise: false,
  activeCheckpoint: null,
  selectedAnswer: null,
  answered: false,

  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setCheckpoints: (checkpoints) => set({ checkpoints }),
  openExercise: (checkpoint) =>
    set({ showExercise: true, activeCheckpoint: checkpoint, selectedAnswer: null, answered: false }),
  closeExercise: () =>
    set({ showExercise: false, activeCheckpoint: null, selectedAnswer: null, answered: false }),
  selectAnswer: (selectedAnswer) => set({ selectedAnswer }),
  reset: () =>
    set({
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      showExercise: false,
      activeCheckpoint: null,
      selectedAnswer: null,
      answered: false,
    }),
}));
