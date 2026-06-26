"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const EJA_LEVELS = [
  { name: "Fundamental I", value: 8, color: "#8B5CF6" },
  { name: "Fundamental II", value: 15, color: "#16A34A" },
  { name: "Médio", value: 7, color: "#2D7FF9" },
];
const TOTAL = EJA_LEVELS.reduce((s, l) => s + l.value, 0);

const ENGAGEMENT = [
  { week: "Sem 1", value: 68 },
  { week: "Sem 2", value: 74 },
  { week: "Sem 3", value: 71 },
  { week: "Sem 4", value: 78 },
];

const HARD_CONTENT = [
  { title: "Frações: numerador e denominador", type: "Exercício", errorRate: 72, students: 18 },
  { title: "Ortografia: uso do 's' e 'z'", type: "Exercício", errorRate: 61, students: 14 },
  { title: "Divisão com resto", type: "Vídeo+Quiz", errorRate: 55, students: 12 },
  { title: "Leitura de gráficos", type: "Exercício", errorRate: 48, students: 10 },
];

function errorColor(rate: number) {
  if (rate >= 70) return "#E5484D";
  if (rate >= 50) return "#F59E0B";
  return "#16A34A";
}

export default function AnalyticsPage() {
  const donutGradient = EJA_LEVELS.map((l, i, arr) => {
    const start = arr.slice(0, i).reduce((s, x) => s + (x.value / TOTAL) * 360, 0);
    const end = start + (l.value / TOTAL) * 360;
    return `${l.color} ${start}deg ${end}deg`;
  }).join(", ");

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h1 className="font-display font-800 text-[28px] text-ink">Análises da turma</h1>
        <p className="text-ink-soft">Dados dos últimos 30 dias</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Donut — EJA level distribution */}
        <div className="bg-surface rounded-card border border-line shadow-soft p-5">
          <h2 className="font-700 text-ink mb-4">Distribuição por nível</h2>
          <div className="flex items-center gap-6">
            <div className="relative h-[120px] w-[120px] shrink-0">
              <div
                className="h-full w-full rounded-full"
                style={{ background: `conic-gradient(${donutGradient})` }}
              />
              <div className="absolute inset-[20px] rounded-full bg-surface flex flex-col items-center justify-center">
                <p className="font-display font-800 text-xl text-ink">{TOTAL}</p>
                <p className="text-ink-muted text-xs">alunos</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {EJA_LEVELS.map((l) => (
                <div key={l.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                  <span className="text-ink text-sm flex-1">{l.name}</span>
                  <span className="font-700 text-ink text-sm">{l.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Engagement bars */}
        <div className="bg-surface rounded-card border border-line shadow-soft p-5">
          <h2 className="font-700 text-ink mb-4">Engajamento médio (% ativos)</h2>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={ENGAGEMENT} barSize={28}>
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#9AA89F", fontSize: 12 }} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: "#15241C", border: "none", borderRadius: "12px", color: "#fff" }}
                formatter={(v: number) => [`${v}%`, "Ativos"]}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {ENGAGEMENT.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === ENGAGEMENT.length - 1 ? "#16A34A" : "#9BFFC4"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hard content */}
      <div className="bg-surface rounded-card border border-line shadow-soft p-5">
        <h2 className="font-700 text-ink mb-4">Conteúdos mais problemáticos</h2>
        <div className="flex flex-col gap-4">
          {HARD_CONTENT.map((c) => (
            <div key={c.title} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-600 text-ink text-sm truncate">{c.title}</span>
                  <span className="text-ink-muted text-xs ml-2 shrink-0">
                    {c.students} alunos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-line-track overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${c.errorRate}%`,
                        backgroundColor: errorColor(c.errorRate),
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-700 shrink-0"
                    style={{ color: errorColor(c.errorRate) }}
                  >
                    {c.errorRate}% erro
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
