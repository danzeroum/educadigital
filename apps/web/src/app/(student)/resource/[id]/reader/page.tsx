"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const MOCK_TEXT = `A importância das frações na culinária

<highlight>Receitas de cozinha</highlight> são um dos melhores exemplos de como as <highlight>frações</highlight> aparecem no nosso dia a dia. Quando você lê "use 3/4 de xícara de farinha", está lendo uma fração. Isso significa que você deve pegar 3 partes de um total de 4 partes de uma xícara cheia.

No supermercado, você também encontra frações. Um produto que custa R$ 10,00 com desconto de 1/2 (metade) vai custar R$ 5,00. Se o desconto for de 1/4 (um quarto), vai custar R$ 7,50.

Na construção civil, os pedreiros usam frações para misturar cimento, areia e brita. Uma mistura comum é 1 parte de cimento para cada 3 partes de areia — ou seja, a proporção é de 1/3.

As frações estão em toda parte. Aprender a usá-las é uma habilidade que torna a nossa vida mais fácil e nos torna mais <highlight>independentes</highlight> no dia a dia.`;

export default function ReaderPage({ params }: { params: { id: string } }) {
  const [fontSize, setFontSize] = useState(19);
  const [readingProgress, setReadingProgress] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const pct = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    setReadingProgress(Math.min(100, pct));
  };

  const renderText = () =>
    MOCK_TEXT.split(/(<highlight>.*?<\/highlight>)/g).map((part, i) => {
      const match = part.match(/^<highlight>(.*)<\/highlight>$/);
      if (match) {
        return (
          <span
            key={i}
            className="underline decoration-amber-deep decoration-2 decoration-dotted"
          >
            {match[1]}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#FBF3E4", color: "#3A2F1A" }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 pt-12 pb-3 border-b flex items-center gap-3"
        style={{ backgroundColor: "#FBF3E4", borderColor: "#EBDFC4" }}
      >
        <Link href="/library" className="h-9 w-9 rounded-squircle bg-[#EBDFC4] flex items-center justify-center text-[#3A2F1A] shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <p className="flex-1 font-600 text-sm line-clamp-1">A importância das frações na culinária</p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFontSize((s) => Math.max(14, s - 2))}
            className="h-8 w-8 rounded-full bg-[#EBDFC4] flex items-center justify-center text-sm font-700 min-h-0 min-w-0"
          >
            A-
          </button>
          <button
            onClick={() => setFontSize((s) => Math.min(28, s + 2))}
            className="h-8 w-8 rounded-full bg-[#EBDFC4] flex items-center justify-center text-base font-700 min-h-0 min-w-0"
          >
            A+
          </button>
        </div>
      </div>

      {/* Reading progress */}
      <div className="h-1 bg-[#EBDFC4]">
        <div
          className="h-full bg-amber-deep transition-all"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Content */}
      <div
        className="flex-1 px-5 py-6 overflow-y-auto"
        onScroll={handleScroll}
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
      >
        {renderText()}
      </div>

      {/* FAB Tutor */}
      <Link
        href="/tutor/new"
        className="fixed bottom-6 right-4 h-14 px-5 gradient-green rounded-btn shadow-green-cta flex items-center gap-2 text-white font-700 z-30"
      >
        <MessageCircle className="h-5 w-5" />
        Tirar dúvida
      </Link>
    </div>
  );
}
