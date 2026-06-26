import { cn } from "@/lib/utils";

interface Props {
  name: string;
  emoji: string;
  earned: boolean;
  xpReward: number;
}

export function AchievementBadge({ name, emoji, earned, xpReward }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 p-2 rounded-card-sm transition-all",
        !earned && "grayscale opacity-40"
      )}
    >
      <div
        className={cn(
          "h-14 w-14 rounded-squircle flex items-center justify-center text-2xl",
          earned ? "bg-amber-tint border border-amber-border shadow-amber-cta/20" : "bg-line-soft"
        )}
      >
        {emoji}
      </div>
      <p className="text-[10px] font-600 text-ink-soft text-center leading-tight line-clamp-2">
        {name}
      </p>
      {earned && (
        <span className="text-[10px] font-700 text-amber-deep">+{xpReward} XP</span>
      )}
    </div>
  );
}
