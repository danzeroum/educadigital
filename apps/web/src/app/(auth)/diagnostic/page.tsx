"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AudioRecorder } from "@/components/features/diagnostic/AudioRecorder";
import { QuizStep } from "@/components/features/diagnostic/QuizStep";
import { DiagnosticStepper } from "@/components/features/diagnostic/DiagnosticStepper";
import { Confetti } from "@/components/features/diagnostic/Confetti";
import { useDiagnosticStore } from "@/store/diagnostic.store";
import { useAuthStore } from "@/store/auth.store";
import { useStartDiagnostic, useDiagnosticResult, type DiagnosticResult } from "@/lib/api/queries";

const WAITING_MESSAGES = [
  "Entendendo como você aprende melhor…",
  "Identificando seus pontos fortes…",
  "Montando sua trilha personalizada…",
  "Analisando seu estilo de aprendizagem…",
  "Preparando recomendações exclusivas…",
];

const EJA_LABELS: Record<string, string> = {
  EJA_Fundamental_I: "Fundamental I",
  EJA_Fundamental_II: "Fundamental II",
  EJA_Medio: "Ensino Médio",
};

const STYLE_LABELS: Record<string, { emoji: string; label: string }> = {
  visual: { emoji: "🎬", label: "Visual + Vídeos" },
  auditory: { emoji: "🎧", label: "Auditivo" },
  kinesthetic: { emoji: "✋", label: "Cinestésico" },
  mixed: { emoji: "🌈", label: "Variado" },
};

export default function DiagnosticPage() {
  const { step, setStep, setAudioBlob, addQuizAnswer, setReadingAudioBlob, quizAnswers } =
    useDiagnosticStore();
  const router = useRouter();
  const [diagResult, setDiagResult] = useState<DiagnosticResult | null>(null);

  // Step 0: Intro
  if (step === 0) {
    return (
      <DiagnosticShell showStepper={false}>
        <div className="flex flex-col items-center gap-6 py-8 text-center">
          <span className="text-7xl animate-bob">📚</span>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-2 w-2 rounded-full bg-[#E7E1D4]" />
            ))}
          </div>
          <h1 className="font-display font-800 text-[28px] text-ink text-balance leading-tight">
            Vamos conhecer<br />o seu jeito de aprender!
          </h1>
          <p className="text-ink-soft text-[17px] leading-relaxed max-w-xs">
            São 5 atividades rápidas que nos ajudam a montar a trilha perfeita pra você.
            Não tem resposta certa ou errada — só queremos te conhecer melhor! 🌱
          </p>
          <Button
            className="w-full mt-4 text-[18px] h-14 shadow-green-cta"
            onClick={() => setStep(1)}
          >
            Vamos lá! 🚀
          </Button>
        </div>
      </DiagnosticShell>
    );
  }

  // Step 1: Audio
  if (step === 1) {
    return (
      <DiagnosticShell stepNum={1}>
        <h2 className="font-display font-700 text-[22px] text-ink mb-2">
          Fale um pouco sobre você
        </h2>
        <p className="text-ink-soft mb-6">
          Pressione e segure o botão e conte: qual é o seu nome e o que você mais gosta de fazer?
        </p>
        <AudioRecorder onRecorded={(blob) => setAudioBlob(blob)} />
        <Button className="w-full mt-8" onClick={() => setStep(2)}>
          Continuar →
        </Button>
      </DiagnosticShell>
    );
  }

  // Step 2: Handwriting photo
  if (step === 2) {
    return (
      <DiagnosticShell stepNum={2}>
        <h2 className="font-display font-700 text-[22px] text-ink mb-2">
          Escreva uma frase
        </h2>
        <p className="text-ink-soft mb-6">
          Escreva em um papel: &ldquo;Hoje eu aprendo algo novo.&rdquo; Depois tire uma foto.
        </p>
        <div className="relative w-full h-[200px] bg-ink rounded-card overflow-hidden flex items-center justify-center">
          <div className="absolute inset-4 border-2 border-dashed border-green/50 rounded-inner">
            <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-green" />
            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-green" />
            <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-green" />
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-green" />
          </div>
          <p className="text-white/40 text-sm">Prévia da câmera</p>
        </div>
        <Button className="w-full mt-6" onClick={() => setStep(3)}>
          📷 Tirar foto
        </Button>
      </DiagnosticShell>
    );
  }

  // Step 3: Quiz
  if (step === 3) {
    const qIndex = quizAnswers.length;
    if (qIndex >= 5) {
      setStep(4);
      return null;
    }
    return (
      <DiagnosticShell stepNum={3}>
        <QuizStep
          questionIndex={qIndex}
          onAnswer={(optIndex, timeMs) => {
            addQuizAnswer({ questionIndex: qIndex, selectedOption: optIndex, responseTimeMs: timeMs });
            if (qIndex >= 4) setStep(4);
          }}
        />
      </DiagnosticShell>
    );
  }

  // Step 4: Reading audio
  if (step === 4) {
    return (
      <DiagnosticShell stepNum={4}>
        <h2 className="font-display font-700 text-[22px] text-ink mb-4">
          Leia em voz alta
        </h2>
        <div className="bg-sky-tint border border-sky/20 rounded-card-sm p-5 mb-6">
          <p className="text-ink text-[21px] leading-relaxed">
            &ldquo;O trabalhador que estuda todos os dias constrói um futuro melhor para si e para sua família.&rdquo;
          </p>
        </div>
        <AudioRecorder onRecorded={(blob) => setReadingAudioBlob(blob)} />
        <Button className="w-full mt-8" onClick={() => setStep(5)}>
          Continuar →
        </Button>
      </DiagnosticShell>
    );
  }

  // Step 5: Waiting (starts/polls diagnostic)
  if (step === 5) {
    return (
      <WaitingScreen
        onDone={(result) => {
          setDiagResult(result);
          setStep(6);
        }}
      />
    );
  }

  // Step 6: Result
  return <ResultScreen result={diagResult} onStart={() => router.push("/dashboard")} />;
}

function DiagnosticShell({
  children,
  stepNum,
  showStepper = true,
}: {
  children: React.ReactNode;
  stepNum?: number;
  showStepper?: boolean;
}) {
  const { setStep } = useDiagnosticStore();
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        {stepNum !== undefined && (
          <button
            onClick={() => setStep((stepNum - 1) as Parameters<typeof setStep>[0])}
            className="h-9 w-9 rounded-squircle bg-line-soft flex items-center justify-center text-ink shrink-0"
          >
            ←
          </button>
        )}
        {showStepper && stepNum !== undefined && (
          <div className="flex-1">
            <DiagnosticStepper currentStep={stepNum} />
          </div>
        )}
      </div>
      <div className="flex-1 px-5 pb-8 overflow-y-auto">{children}</div>
    </div>
  );
}

function WaitingScreen({ onDone }: { onDone: (result: DiagnosticResult) => void }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const { sessionId, setSessionId } = useDiagnosticStore();
  const user = useAuthStore((s) => s.user);
  const startDiagnostic = useStartDiagnostic();

  useEffect(() => {
    if (!sessionId && user?.id) {
      startDiagnostic.mutate(user.id, {
        onSuccess: (res) => setSessionId(res.session_id),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: result } = useDiagnosticResult(sessionId);

  useEffect(() => {
    if (result) onDone(result);
  }, [result, onDone]);

  useEffect(() => {
    const interval = setInterval(
      () => setMsgIndex((i) => (i + 1) % WAITING_MESSAGES.length),
      1500
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="relative">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#ECE5D6" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="#16A34A"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="213"
            strokeDashoffset="53"
            className="animate-spin"
            style={{ transformOrigin: "center", animationDuration: "1.5s" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl animate-bob">
          🌱
        </span>
      </div>
      <div>
        <h2 className="font-display font-700 text-2xl text-ink mb-3">Estamos analisando…</h2>
        <p className="text-ink-soft text-[17px] min-h-[2em] transition-all">{WAITING_MESSAGES[msgIndex]}</p>
      </div>
    </div>
  );
}

function ResultScreen({
  result,
  onStart,
}: {
  result: DiagnosticResult | null;
  onStart: () => void;
}) {
  const ejaLabel = EJA_LABELS[result?.eja_level ?? ""] ?? result?.eja_level ?? "Fundamental II";
  const styleInfo = STYLE_LABELS[result?.learning_style ?? ""] ?? { emoji: "🎬", label: "Visual + Vídeos" };
  const strengths = result?.strengths ?? ["Leitura", "Matemática básica", "Compreensão oral"];

  return (
    <div className="min-h-screen bg-paper flex flex-col px-5 pb-8">
      <Confetti />
      <div className="pt-16 pb-6 text-center">
        <h1 className="font-display font-800 text-[28px] text-ink text-balance">
          Sua trilha está pronta! 🎉
        </h1>
      </div>

      <div className="flex flex-col gap-4">
        <div className="gradient-green rounded-card p-5 text-white">
          <p className="text-green-bright text-sm font-600 mb-1">Seu nível EJA</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌿</span>
            <span className="font-display font-700 text-2xl">{ejaLabel}</span>
          </div>
        </div>

        <div className="bg-surface rounded-card border border-line p-5">
          <p className="text-ink-muted text-sm font-600 mb-1">Como você aprende</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl">{styleInfo.emoji}</span>
            <span className="font-display font-700 text-xl text-ink">{styleInfo.label}</span>
          </div>
        </div>

        {strengths.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {strengths.map((s) => (
              <span
                key={s}
                className="bg-green-tint text-green-700 rounded-full px-3 py-1 text-sm font-600"
              >
                ✓ {s}
              </span>
            ))}
          </div>
        )}
      </div>

      <Button
        className="w-full mt-auto pt-8 text-[18px] h-14 shadow-green-cta"
        onClick={onStart}
      >
        Começar trilha! 🚀
      </Button>
    </div>
  );
}
