"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { MessageBubble } from "@/components/features/tutor/MessageBubble";
import { useOfflineStore } from "@/store/offline.store";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_REPLIES = [
  "Pode explicar de outro jeito?",
  "Tenho uma dúvida",
  "Entendi! E agora?",
  "Pode dar um exemplo?",
];

export default function TutorChatPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      content:
        'Olá! Sou o Edu, seu tutor. 😊 Estou aqui pra te ajudar com "Frações no dia a dia". O que você quer entender melhor?',
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const isOnline = useOfflineStore((s) => s.isOnline);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !isOnline) return;
      const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setIsTyping(true);

      // Simulate SSE typewriter response
      await new Promise((r) => setTimeout(r, 800));
      setIsTyping(false);
      const reply =
        "Ótima pergunta! 🌟 Pensa assim: uma fração é como dividir uma pizza. Se você tem 8 pedaços e come 3, comeu 3/8 da pizza. O número de baixo (denominador) é o total de partes, e o de cima (numerador) é quantas você pegou. Faz sentido?";
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
      };
      setMessages((m) => [...m, assistantMsg]);
    },
    [isOnline]
  );

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 bg-surface border-b border-line">
        <Link href="/dashboard" className="h-9 w-9 rounded-squircle bg-line-soft flex items-center justify-center text-ink">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="h-10 w-10 rounded-squircle gradient-green flex items-center justify-center text-xl shrink-0">
          🤖
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-700 text-[17px] text-ink">Edu</p>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green" />
            <span className="text-ink-muted text-xs">Online · seu tutor</span>
          </div>
        </div>
        <span className="bg-sky-tint text-sky-deep rounded-full px-2.5 py-1 text-xs font-600">
          📹 Frações
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 py-4 flex flex-col gap-4 overflow-y-auto pb-44">
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} />
        ))}
        {isTyping && <MessageBubble role="assistant" content="" isTyping />}
        <div ref={endRef} />
      </div>

      {/* Quick replies */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-none border-t border-line bg-paper">
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            disabled={!isOnline}
            className="whitespace-nowrap rounded-full border border-line-2 bg-surface px-3 py-1.5 text-sm font-600 text-ink-soft hover:border-green hover:text-green transition-colors shrink-0 min-h-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-2 bg-paper">
        {isOnline ? (
          <div className="flex items-end gap-3 bg-surface border border-line-2 rounded-[20px] px-4 py-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Escreva sua dúvida…"
              rows={1}
              className="flex-1 resize-none bg-transparent text-ink placeholder:text-ink-muted text-[16px] outline-none py-1 min-h-0"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all",
                input.trim() ? "gradient-green text-white" : "bg-line-soft text-ink-faint"
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="bg-line-soft rounded-[20px] px-4 py-3 text-center text-ink-muted text-sm">
            📵 O Edu só está disponível com internet
          </div>
        )}
      </div>
    </div>
  );
}
