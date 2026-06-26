"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { StudentCard, type StudentCardData } from "@/components/features/dashboard/StudentCard";
import { cn } from "@/lib/utils";

const FILTERS = ["Todos", "Em risco", "Ativos"] as const;
type Filter = (typeof FILTERS)[number];

const MOCK_STUDENTS: StudentCardData[] = [
  { id: "s1", name: "Ana Lima", riskLevel: "low", ejaLevel: "Fund. II", daysSinceAccess: 0, trailProgress: 65 },
  { id: "s2", name: "João Silva", riskLevel: "critical", ejaLevel: "Fund. I", daysSinceAccess: 8, trailProgress: 20 },
  { id: "s3", name: "Maria Souza", riskLevel: "high", ejaLevel: "Fund. II", daysSinceAccess: 4, trailProgress: 45 },
  { id: "s4", name: "Pedro Costa", riskLevel: "low", ejaLevel: "Médio", daysSinceAccess: 1, trailProgress: 78 },
  { id: "s5", name: "Carla Neves", riskLevel: "medium", ejaLevel: "Fund. I", daysSinceAccess: 3, trailProgress: 32 },
  { id: "s6", name: "Roberto Melo", riskLevel: "low", ejaLevel: "Fund. II", daysSinceAccess: 0, trailProgress: 89 },
];

export default function StudentsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Todos");

  const filtered = MOCK_STUDENTS.filter((s) => {
    const matchQuery = query === "" || s.name.toLowerCase().includes(query.toLowerCase());
    const matchFilter =
      filter === "Todos" ||
      (filter === "Em risco" && s.riskLevel !== "low") ||
      (filter === "Ativos" && s.daysSinceAccess <= 2);
    return matchQuery && matchFilter;
  });

  const riskCount = MOCK_STUDENTS.filter((s) => s.riskLevel !== "low").length;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="font-display font-800 text-[28px] text-ink">Meus alunos</h1>
        <p className="text-ink-soft">{MOCK_STUDENTS.length} alunos na sua turma</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
        <input
          type="search"
          placeholder="Buscar aluno…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-11 pl-10 pr-4 bg-surface border border-line-2 rounded-inner text-ink placeholder:text-ink-muted text-[15px] outline-none focus:border-green max-w-sm"
        />
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-700 transition-colors min-h-0",
              f === filter ? "bg-ink text-surface" : "bg-surface border border-line text-ink-soft"
            )}
          >
            {f}
            {f === "Em risco" && riskCount > 0 && (
              <span className="ml-1.5 bg-[#E5484D] text-white rounded-full px-1.5 text-xs">
                {riskCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map((s) => (
          <StudentCard key={s.id} student={s} />
        ))}
      </div>
    </div>
  );
}
