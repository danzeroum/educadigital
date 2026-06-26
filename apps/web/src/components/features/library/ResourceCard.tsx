import Link from "next/link";
import { cn } from "@/lib/utils";

type MediaType = "video" | "text" | "exercise" | "audio" | "pdf";

function typeTheme(t: MediaType) {
  return {
    video: { bg: "bg-coral/10 text-coral", emoji: "▶️", label: "Vídeo" },
    text: { bg: "bg-sky-tint text-sky-deep", emoji: "📄", label: "Leitura" },
    exercise: { bg: "bg-purple-tint text-purple-deep", emoji: "✏️", label: "Exercício" },
    audio: { bg: "bg-amber-tint text-amber-deep", emoji: "🎵", label: "Áudio" },
    pdf: { bg: "bg-line-soft text-ink-soft", emoji: "📋", label: "PDF" },
  }[t];
}

function difficultyStars(level: number) {
  return "★".repeat(level) + "☆".repeat(5 - level);
}

export interface ResourceCardData {
  id: string;
  title: string;
  mediaType: MediaType;
  durationMin: number;
  ejaLevel: string;
  difficulty: number;
  completionPct?: number;
}

export function ResourceCard({ resource }: { resource: ResourceCardData }) {
  const theme = typeTheme(resource.mediaType);
  const hasProgress = resource.completionPct !== undefined && resource.completionPct > 0;

  return (
    <Link
      href={`/resource/${resource.id}`}
      className="flex flex-col bg-surface rounded-card border border-line shadow-soft overflow-hidden hover:shadow-card active:scale-[.98] transition-all"
    >
      {/* Thumbnail */}
      <div className={cn("h-[84px] flex items-center justify-center text-4xl", theme.bg)}>
        {theme.emoji}
      </div>

      <div className="p-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "text-[10px] font-700 uppercase tracking-wide rounded-full px-2 py-0.5",
              theme.bg
            )}
          >
            {theme.label}
          </span>
          <span className="text-ink-muted text-[10px] font-mono ml-auto">{resource.durationMin}min</span>
        </div>

        <p className="text-ink text-[14px] font-600 leading-snug line-clamp-2">{resource.title}</p>

        <div className="flex items-center justify-between mt-0.5">
          <span className="bg-green-tint text-green-700 rounded-full px-1.5 py-0.5 text-[10px] font-600">
            {resource.ejaLevel}
          </span>
          <span className="text-amber text-[11px]">{difficultyStars(resource.difficulty)}</span>
        </div>

        {hasProgress && (
          <div className="h-1 rounded-full bg-line-track mt-1 overflow-hidden">
            <div
              className="h-full bg-green rounded-full"
              style={{ width: `${resource.completionPct}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
