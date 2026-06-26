import { cn } from "@/lib/utils";

function streakColor(days: number) {
  if (days === 0) return "text-ink-faint bg-line-soft";
  if (days < 7) return "text-amber-deep bg-amber-tint border border-amber-border";
  if (days < 14) return "text-orange-600 bg-orange-50 border border-orange-200";
  if (days < 30) return "text-red-600 bg-red-50 border border-red-200";
  return "text-purple-deep bg-purple-tint border border-purple/20";
}

export function StreakBadge({ days, className }: { days: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-700",
        streakColor(days),
        className
      )}
    >
      🔥 {days} {days === 1 ? "dia" : "dias"}
    </span>
  );
}
