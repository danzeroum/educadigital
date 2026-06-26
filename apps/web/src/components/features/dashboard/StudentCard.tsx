import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type RiskLevel = "critical" | "high" | "medium" | "low";

const riskVariant: Record<RiskLevel, "critical" | "high" | "medium" | "low"> = {
  critical: "critical", high: "high", medium: "medium", low: "low",
};
const riskLabel: Record<RiskLevel, string> = {
  critical: "Crítico", high: "Alto", medium: "Atenção", low: "Em dia",
};

function accessColor(days: number) {
  if (days <= 1) return "text-green-700";
  if (days <= 3) return "text-amber-deep";
  return "text-[#C5292E]";
}

export interface StudentCardData {
  id: string;
  name: string;
  riskLevel: RiskLevel;
  ejaLevel: string;
  daysSinceAccess: number;
  trailProgress: number;
}

export function StudentCard({ student }: { student: StudentCardData }) {
  return (
    <Link
      href={`/tutor/students/${student.id}`}
      className="bg-surface rounded-card border border-line shadow-soft p-4 flex flex-col gap-3 hover:shadow-card active:scale-[.99] transition-all"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback>{student.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="font-700 text-ink text-[15px]">{student.name}</p>
            {student.riskLevel !== "low" && (
              <Badge variant={riskVariant[student.riskLevel]}>
                {riskLabel[student.riskLevel]}
              </Badge>
            )}
          </div>
          <p className="text-ink-muted text-xs">{student.ejaLevel}</p>
          <p className={cn("text-xs font-600 mt-0.5", accessColor(student.daysSinceAccess))}>
            {student.daysSinceAccess === 0
              ? "● Ativo hoje"
              : student.daysSinceAccess === 1
                ? "Ativo ontem"
                : `${student.daysSinceAccess} dias sem acessar`}
          </p>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs text-ink-muted mb-1">
          <span>Trilha</span>
          <span>{student.trailProgress}%</span>
        </div>
        <Progress value={student.trailProgress} className="h-1.5" />
      </div>
    </Link>
  );
}
