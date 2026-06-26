"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { MessageBubble } from "@/components/features/tutor/MessageBubble";
import { useOfflineStore } from "@/store/offline.store";
import { useAuthStore } from "@/store/auth.store";
import { useCreateConversation } from "@/lib/api/queries";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

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
  const searchParams = useSearchParams();
  const resourceId = searchParams.get("resource");
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const createConversation = useCreateConversation();

  const [conversationId, setConversationId] = useState<string | null>(
    params.id !== "new" ? params.id : null
  );
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      content: "Olá! Sou o Edu, seu tutor. 😊 O que você quer entender melhor?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const isOnline = useOfflineStore((s) => s.isOnline);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const streamResponse = useCallback(
    async (convId: string, userText: string) => {
      setIsTyping(true);
      const assistantId = Date.now().toString();
      let accumulated = "";

      abortRef.current = new AbortController();

      try {
        const resp = await fetch(`${API_BASE}/tutor/conversations/${convId}/messages`, {
          method: "POST",
          signal: abortRef.current.signal,
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ role: "user", content: userText }),
        });

        if (!resp.body) throw new Error("No body");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();

        setIsTyping(false);
        setMessages((m) => [...m, { id: assistantId, role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          for (const line of text.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") break;
            try {
              const parsed = JSON.parse(payload) as { text?: string };
              if (parsed.text) accumulated += parsed.text;
            } catch {
              accumulated += payload;
            }
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantId ? { ...msg, content: accumulated } : msg
              )
            );
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setIsTyping(false);
        setMessages((m) => [
          ...m,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: "Desculpa, tive um problema. Pode tentar de novo? 🙏",
          },
        ]);
      }
    },
    [accessToken]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !isOnline) return;
      setMessages((m) => [...m, { id: Date.now().toString(), role: "user", content: text }]);
      setInput("");

      let convId = conversationId;
      if (!convId) {
        try {
          const res = await createConversation.mutateAsync({
            userId: user?.id ?? "",
            resourceId: resourceId ?? undefined,
          });
          convId = res.id;
          setConversationId(convId);
        } catch {
          setMessages((m) => [
            ...m,
            {
              id: Date.now().toString(),
              role: "assistant",
              content: "Não consegui conectar ao tutor. Verifique sua conexão. 📵",
            },
          ]);
          return;
        }
      }

      await streamResponse(convId, text);
    },
    [conversationId, createConversation, isOnline, resourceId, streamResponse, user?.id]
  );

  useEffect(() => () => { abortRef.current?.abort(); }, []);

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
            <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-green" : "bg-line"}`} />
            <span className="text-ink-muted text-xs">
              {isOnline ? "Online · seu tutor" : "Offline"}
            </span>
          </div>
        </div>
        {resourceId && (
          <span className="bg-sky-tint text-sky-deep rounded-full px-2.5 py-1 text-xs font-600">
            📹 Conteúdo
          </span>
        )}
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
            disabled={!isOnline || isTyping}
            className="whitespace-nowrap rounded-full border border-line-2 bg-surface px-3 py-1.5 text-sm font-600 text-ink-soft hover:border-green hover:text-green transition-colors shrink-0 min-h-0 disabled:opacity-40"
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
              disabled={!input.trim() || isTyping}
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all",
                input.trim() && !isTyping ? "gradient-green text-white" : "bg-line-soft text-ink-faint"
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
