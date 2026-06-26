import { cn } from "@/lib/utils";

interface Props {
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
}

export function MessageBubble({ role, content, isTyping }: Props) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
      {!isUser && (
        <div className="h-8 w-8 rounded-squircle gradient-green flex items-center justify-center text-white text-sm shrink-0 self-end">
          🤖
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] px-4 py-3 text-[16px] leading-relaxed",
          isUser
            ? "bg-green text-white rounded-[18px_18px_5px_18px] shadow-green-cta/30"
            : "bg-surface text-ink border border-line shadow-soft rounded-[18px_18px_18px_5px]"
        )}
      >
        {isTyping ? (
          <div className="flex gap-1 items-center h-5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-ink-muted animate-dots"
                style={{ animationDelay: `${i * 160}ms` }}
              />
            ))}
          </div>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
