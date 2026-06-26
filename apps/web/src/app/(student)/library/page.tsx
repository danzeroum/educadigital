"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { ResourceCard, type ResourceCardData } from "@/components/features/library/ResourceCard";
import { cn } from "@/lib/utils";

const FILTERS = ["Todos", "Vídeo", "Leitura", "Exercício"] as const;
type Filter = (typeof FILTERS)[number];

const MOCK_RESOURCES: ResourceCardData[] = [
  { id: "r1", title: "Frações: o que são e como usar no dia a dia", mediaType: "video", durationMin: 12, ejaLevel: "Fund. II", difficulty: 2, completionPct: 100 },
  { id: "r2", title: "Exercícios de frações equivalentes", mediaType: "exercise", durationMin: 8, ejaLevel: "Fund. II", difficulty: 3 },
  { id: "r3", title: "A importância das frações na culinária", mediaType: "text", durationMin: 6, ejaLevel: "Fund. II", difficulty: 2, completionPct: 40 },
  { id: "r4", title: "Números decimais: conexão com frações", mediaType: "video", durationMin: 15, ejaLevel: "Fund. II", difficulty: 3 },
  { id: "r5", title: "Como calcular porcentagem no supermercado", mediaType: "video", durationMin: 10, ejaLevel: "Fund. II", difficulty: 2 },
  { id: "r6", title: "Leitura: Carta de um trabalhador", mediaType: "text", durationMin: 5, ejaLevel: "Fund. I", difficulty: 1 },
];

const typeMap: Record<Filter, string> = {
  Todos: "",
  Vídeo: "video",
  Leitura: "text",
  Exercício: "exercise",
};

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Todos");

  const filtered = MOCK_RESOURCES.filter((r) => {
    const matchType = typeMap[filter] === "" || r.mediaType === typeMap[filter];
    const matchQuery =
      query === "" || r.title.toLowerCase().includes(query.toLowerCase());
    return matchType && matchQuery;
  });

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
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-5xl">🔍</span>
          <p className="font-display font-700 text-xl text-ink">Nada por aqui ainda</p>
          <p className="text-ink-muted">Tente outro termo ou filtro</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}
    </div>
  );
}
