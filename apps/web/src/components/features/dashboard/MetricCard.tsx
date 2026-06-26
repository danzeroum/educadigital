import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  emoji?: string;
  variant?: "default" | "danger" | "amber" | "green";
}

const variants = {
  default: "bg-surface border-line",
  danger: "bg-[#FDE7E7] border-[#E5484D]/20",
  amber: "bg-amber-tint border-amber-border",
  green: "bg-green-tint border-green/20",
};

const valueColors = {
  default: "text-ink",
  danger: "text-[#C5292E]",
  amber: "text-amber-deep",
  green: "text-green-700",
};

export function MetricCard({ label, value, sub, emoji, variant = "default" }: Props) {
  return (
    <div className={cn("rounded-card border p-5 shadow-soft", variants[variant])}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-ink-soft text-sm font-600">{label}</p>
        {emoji && <span className="text-2xl">{emoji}</span>}
      </div>
      <p className={cn("font-display font-800 text-[34px] leading-none", valueColors[variant])}>
        {value}
      </p>
      {sub && <p className={cn("text-sm mt-1", valueColors[variant], "opacity-70")}>{sub}</p>}
    </div>
  );
}
