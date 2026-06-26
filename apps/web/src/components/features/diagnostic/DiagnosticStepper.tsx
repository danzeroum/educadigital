import { cn } from "@/lib/utils";

const STEP_LABELS = [
  "Introdução",
  "Áudio",
  "Escrita",
  "Quiz",
  "Leitura",
];

interface Props {
  currentStep: number; // 1-5
}

export function DiagnosticStepper({ currentStep }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        {STEP_LABELS.map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 h-1.5 rounded-full transition-colors",
              i < currentStep ? "bg-green" : "bg-[#E7E1D4]"
            )}
          />
        ))}
      </div>
      <p className="text-green text-[13px] font-600">
        Passo {currentStep} de 5 · {STEP_LABELS[currentStep - 1]}
      </p>
    </div>
  );
}
