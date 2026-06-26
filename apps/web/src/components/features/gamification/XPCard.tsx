"use client";

function plantLevel(xp: number): { name: string; emoji: string; level: number; nextXP: number } {
  if (xp < 500) return { name: "Semente", emoji: "🌱", level: 1, nextXP: 500 };
  if (xp < 1000) return { name: "Broto", emoji: "🌿", level: 2, nextXP: 1000 };
  if (xp < 1500) return { name: "Muda", emoji: "🌿", level: 3, nextXP: 1500 };
  if (xp < 2000) return { name: "Arvorezinha", emoji: "🌳", level: 4, nextXP: 2000 };
  if (xp < 4500) return { name: "Árvore jovem", emoji: "🌳", level: 5, nextXP: 4500 };
  return { name: "Árvore frondosa", emoji: "🌳", level: 10, nextXP: Infinity };
}

interface Props {
  xp: number;
  xpToday?: number;
}

export function XPCard({ xp, xpToday = 0 }: Props) {
  const plant = plantLevel(xp);
  const pct = plant.nextXP === Infinity ? 100 : Math.round(((xp % 500) / 500) * 100);
  const toNext = plant.nextXP === Infinity ? 0 : plant.nextXP - xp;

  return (
    <div className="gradient-green-deep rounded-card p-5 text-white shadow-green-cta">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-green-bright text-xs font-600 uppercase tracking-wide mb-0.5">
            Nível {plant.level} · {plant.name}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-3xl">{plant.emoji}</span>
            <span className="font-display font-800 text-3xl tabular-nums">
              {xp.toLocaleString("pt-BR")} XP
            </span>
          </div>
        </div>
        {xpToday > 0 && (
          <span className="bg-green/40 border border-green-spring/30 rounded-full px-2.5 py-1 text-green-bright text-sm font-700">
            +{xpToday} hoje
          </span>
        )}
      </div>

      <div className="h-2.5 rounded-full bg-green-900/50 overflow-hidden">
        <div
          className="h-full bg-green-bright rounded-full animate-xp-bar origin-left"
          style={{ width: `${pct}%` }}
        />
      </div>
      {toNext > 0 && (
        <p className="text-green-bright/70 text-xs mt-1.5">
          {toNext} XP para o Nível {plant.level + 1} · próxima planta
        </p>
      )}
    </div>
  );
}
