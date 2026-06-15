/**
 * SM-2 Spaced Repetition Algorithm
 * Roda offline no cliente — não depende de conexão para calcular revisões.
 * https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
 */

export interface SrsCard {
  id: string;
  conceptLabel: string;
  dueDate: Date;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
}

export interface ReviewResult {
  newIntervalDays: number;
  newEaseFactor: number;
  newRepetitions: number;
  nextDueDate: Date;
}

/**
 * @param rating 0-5 (0=total blackout, 5=perfect recall)
 */
export function calculateNextReview(card: SrsCard, rating: number): ReviewResult {
  if (rating < 0 || rating > 5) throw new Error("Rating must be 0-5");

  let newReps: number;
  let newInterval: number;

  if (rating < 3) {
    newReps = 0;
    newInterval = 1;
  } else {
    newReps = card.repetitions + 1;
    if (card.repetitions === 0) {
      newInterval = 1;
    } else if (card.repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(card.intervalDays * card.easeFactor);
    }
  }

  const newEF = Math.max(
    1.3,
    card.easeFactor + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)
  );

  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + newInterval);

  return {
    newIntervalDays: newInterval,
    newEaseFactor: Math.round(newEF * 100) / 100,
    newRepetitions: newReps,
    nextDueDate,
  };
}

export function isDue(card: SrsCard): boolean {
  return new Date() >= card.dueDate;
}

export function getDueCards(cards: SrsCard[]): SrsCard[] {
  return cards.filter(isDue).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}
