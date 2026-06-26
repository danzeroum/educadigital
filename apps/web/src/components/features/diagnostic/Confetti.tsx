"use client";

import { cn } from "@/lib/utils";

const COLORS = [
  "#16A34A", "#22C55E", "#F59E0B", "#FFB938",
  "#FF6B5E", "#2D7FF9", "#8B5CF6", "#0EA5A5",
  "#9BFFC4", "#FADFA8", "#FF8A5B", "#5BE39A",
  "#E5484D", "#1D5FBF", "#7C3AED", "#FBF7EF",
];

export function Confetti({ className }: { className?: string }) {
  return (
    <div className={cn("fixed inset-0 pointer-events-none z-50 overflow-hidden", className)}>
      {COLORS.map((color, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${(i / COLORS.length) * 100}%`,
            top: "-20px",
            width: `${6 + (i % 4) * 3}px`,
            height: `${8 + (i % 3) * 4}px`,
            backgroundColor: color,
            borderRadius: i % 3 === 0 ? "50%" : "2px",
            animationDelay: `${i * 150}ms`,
            animationDuration: `${2.5 + (i % 4) * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}
