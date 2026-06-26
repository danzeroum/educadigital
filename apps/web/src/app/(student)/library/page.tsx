"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { ResourceCard, type ResourceCardData } from "@/components/features/library/ResourceCard";
import { ResourceCardSkeleton } from "@/components/ui/skeleton";
import { useResources } from "@/lib/api/queries";
import { cn } from "@/lib/utils";

const FILTERS = ["Todos", "Vídeo", "Leitura", "Exercício"] as const;
type Filter = (typeof FILTERS)[number];

const filterToMediaType: Record<Filter, string | undefined> = {
  Todos: undefined,
  Vídeo: "video",
  Leitura: "text",
  Exercício: "exercise",
};

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Todos");

  const { data: resources = [], isLoading } = useResources({
    media_type: filterToMediaType[filter],
  });

  const filtered = resources.filter(
    (r) => query === "" || r.title.toLowerCase().includes(query.toLowerCase())
  );

  const cards: ResourceCardData[] = filtered.map((r) => ({
    id: r.id,
    title: r.title,
    mediaType: (r.media_type as ResourceCardData["mediaType"]) ?? "video",
    durationMin: r.duration_min ?? 5,
    ejaLevel: r.eja_level ?? "Fund. II",
    difficulty: Math.round((r.difficulty_score ?? 2) * 2),
  }));

  return (
    <div className="px-4 pt-14 pb-4">
      <h1 className="font-display font-800 text-[26px] text-ink mb-4">Explorar</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
        <input
          type="search"
          placeholder="Buscar conteúdo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-11 pl-10 pr-4 bg-surface border border-line-2 rounded-inner text-ink placeholder:text-ink-muted text-[15px] outline-none focus:border-green"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-sm font-700 transition-colors shrink-0 min-h-0",
              f === filter
                ? "bg-ink text-surface"
                : "bg-surface border border-line text-ink-soft hover:border-green hover:text-green"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ResourceCardSkeleton key={i} />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-5xl">🔍</span>
          <p className="font-display font-700 text-xl text-ink">Nada por aqui ainda</p>
          <p className="text-ink-muted">Tente outro termo ou filtro</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {cards.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}
    </div>
  );
}
