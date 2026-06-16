import { describe, it, expect } from "vitest";
import { calculateNextReview, isDue, getDueCards } from "@/lib/srs/sm2";
import type { SrsCard } from "@/lib/srs/sm2";

const makeCard = (overrides: Partial<SrsCard> = {}): SrsCard => ({
  id: "1",
  conceptLabel: "Frações",
  dueDate: new Date(Date.now() - 1000),
  intervalDays: 1,
  easeFactor: 2.5,
  repetitions: 0,
  ...overrides,
});

describe("calculateNextReview", () => {
  it("resets repetitions when rating < 3", () => {
    const result = calculateNextReview(makeCard({ repetitions: 3 }), 2);
    expect(result.newRepetitions).toBe(0);
    expect(result.newIntervalDays).toBe(1);
  });

  it("increments repetitions and interval on first success", () => {
    const result = calculateNextReview(makeCard({ repetitions: 0 }), 4);
    expect(result.newRepetitions).toBe(1);
    expect(result.newIntervalDays).toBe(1);
  });

  it("uses 6-day interval on second success", () => {
    const result = calculateNextReview(makeCard({ repetitions: 1 }), 5);
    expect(result.newRepetitions).toBe(2);
    expect(result.newIntervalDays).toBe(6);
  });

  it("applies ease factor multiplication after second success", () => {
    const card = makeCard({ repetitions: 2, intervalDays: 6, easeFactor: 2.5 });
    const result = calculateNextReview(card, 5);
    expect(result.newIntervalDays).toBe(Math.round(6 * 2.5));
  });

  it("raises ease factor on perfect rating", () => {
    const card = makeCard({ easeFactor: 2.5 });
    const result = calculateNextReview(card, 5);
    expect(result.newEaseFactor).toBeGreaterThan(2.5);
  });

  it("never drops ease factor below 1.3", () => {
    const card = makeCard({ easeFactor: 1.3 });
    const result = calculateNextReview(card, 0);
    expect(result.newEaseFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("throws on invalid rating", () => {
    expect(() => calculateNextReview(makeCard(), 6)).toThrow();
    expect(() => calculateNextReview(makeCard(), -1)).toThrow();
  });
});

describe("isDue", () => {
  it("returns true for past due date", () => {
    expect(isDue(makeCard({ dueDate: new Date(Date.now() - 86400000) }))).toBe(true);
  });

  it("returns false for future due date", () => {
    expect(isDue(makeCard({ dueDate: new Date(Date.now() + 86400000) }))).toBe(false);
  });
});

describe("getDueCards", () => {
  it("filters and sorts by due date ascending", () => {
    const past1 = makeCard({ id: "1", dueDate: new Date(Date.now() - 2000) });
    const past2 = makeCard({ id: "2", dueDate: new Date(Date.now() - 1000) });
    const future = makeCard({ id: "3", dueDate: new Date(Date.now() + 86400000) });
    const result = getDueCards([future, past2, past1]);
    expect(result.map((c) => c.id)).toEqual(["1", "2"]);
  });
});
