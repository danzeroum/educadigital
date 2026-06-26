import Link from "next/link";
import { cn } from "@/lib/utils";

type MediaType = "video" | "text" | "exercise" | "audio" | "pdf";

function typeColor(t: MediaType) {
  return {
    video: "bg-coral/10 text-coral",
    text: "bg-sky-tint text-sky-deep",
    exercise: "bg-purple-tint text-purple-deep",
    audio: "bg-amber-tint text-amber-deep",
    pdf: "bg-line-soft text-ink-soft",
  }[t];
}

function typeEmoji(t: MediaType) {
  return { video: "▶️", text: "📄", exercise: "✏️", audio: "🎵", pdf: "📋" }[t];
}

export interface PathItem {
  id: string;
  title: string;
  mediaType: MediaType;
  durationMin: number;
  status: "locked" | "available" | "in_progress" | "completed";
  resourceId: string;
}

export function LearningPathCard({ item }: { item: PathItem }) {
  const done = item.status === "completed";
  const locked = item.status === "locked";

  return (
    <Link
      href={locked ? "#" : `/resource/${item.resourceId}`}
      className={cn(
        "flex items-center gap-3 bg-surface rounded-card-sm border border-line p-4 shadow-soft transition-all",
        locked ? "opacity-50 cursor-not-allowed" : "hover:shadow-card active:scale-[.99]"
      )}
    >
      <div
        className={cn(
          "h-[84px] w-[84px] rounded-inner flex items-center justify-center text-3xl shrink-0",
          typeColor(item.mediaType)
        )}
      >
        {typeEmoji(item.mediaType)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={cn(
              "text-xs font-700 uppercase tracking-wide rounded-full px-2 py-0.5",
              typeColor(item.mediaType)
            )}
          >
            {item.mediaType}
          </span>
          <span className="text-ink-muted text-xs font-mono">{item.durationMin}min</span>
        </div>
        <p className="font-600 text-ink text-[15px] leading-snug line-clamp-2">{item.title}</p>
      </div>
      <span className="text-xl shrink-0">{done ? "✅" : locked ? "🔒" : "○"}</span>
    </Link>
  );
}
