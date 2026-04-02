import { useEffect, useState, useRef, useCallback } from "react";
import { useAuthFetch } from "@/hooks/use-auth";
import { ArrowUp, X, Check, Plus, MessageSquare, ChevronLeft, Sparkles } from "lucide-react";

interface ChatMessage {
  id?: number;
  role: string;
  content: string;
  metadata?: string;
  createdAt?: string;
  foodLogItems?: any[];
  confirmed?: boolean;
}

interface ChatSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

interface ThreadItem {
  date: string;
  messageCount: number;
  lastMessage: string;
}

export default function ChatSheet({ isOpen, onClose, initialMessage }: ChatSheetProps) {
  const authFetch = useAuthFetch();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialSent, setInitialSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<"threads" | "chat">("threads");
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [activeDate, setActiveDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Load threads when opened
  useEffect(() => {
    if (!isOpen) return;
    authFetch("GET", "/api/chat/threads")
      .then((r) => r.json())
      .then((data) => setThreads(data.threads || []))
      .catch(() => {});
    // If there's an initial message, go straight to chat
    if (initialMessage) {
      setView("chat");
      setActiveDate(new Date().toISOString().split("T")[0]);
    }
  }, [isOpen, authFetch, initialMessage]);

  // Load messages for active date
  useEffect(() => {
    if (!isOpen || view !== "chat") return;
    authFetch("GET", `/api/chat/messages?date=${activeDate}`)
      .then((r) => r.json())
      .then((data) => {
        const mapped = (data.messages || []).map((m: any) => {
          let foodLogItems: any[] | undefined;
          if (m.metadata) {
            try {
              const meta = JSON.parse(m.metadata);
              foodLogItems = meta.foodLogItems;
            } catch {}
          }
          return { ...m, foodLogItems, confirmed: foodLogItems ? true : false };
        });
        setMessages(mapped);
      })
      .catch(() => {});
  }, [isOpen, authFetch, view, activeDate]);

  const openThread = (date: string) => {
    setActiveDate(date);
    setView("chat");
  };

  const startNewThread = () => {
    setActiveDate(new Date().toISOString().split("T")[0]);
    setMessages([]);
    setView("chat");
  };

  // Auto-send initial message
  useEffect(() => {
    if (isOpen && initialMessage && !initialSent && messages.length === 0) {
      setInitialSent(true);
      sendMessage(initialMessage);
    }
  }, [isOpen, initialMessage, initialSent, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened, reset view when closed
  useEffect(() => {
    if (isOpen) {
      if (view === "chat") setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      setInitialSent(false);
      setView("threads");
    }
  }, [isOpen, view]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await authFetch("POST", "/api/chat/message", { message: text.trim() });
      const data = await res.json();
      const aiMsg: ChatMessage = {
        role: "assistant",
        content: data.response,
        foodLogItems: data.foodLogItems,
        confirmed: false,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process that. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading, authFetch]);

  const confirmFoodLog = useCallback(async (msgIndex: number, items: any[]) => {
    try {
      await authFetch("POST", "/api/chat/food/confirm", { items });
      setMessages((prev) =>
        prev.map((m, i) => (i === msgIndex ? { ...m, confirmed: true } : m))
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Added to today's food log." },
      ]);
    } catch {}
  }, [authFetch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
        data-testid="chat-backdrop"
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[51] flex justify-center"
        data-testid="chat-sheet"
      >
        <div className="w-full max-w-[600px] bg-background rounded-t-3xl shadow-2xl flex flex-col" style={{ height: "85vh" }}>
          {/* Handle + Header */}
          <div
            className="flex flex-col items-center pt-2 pb-3 px-4"
            style={{
              background: "linear-gradient(to bottom, hsl(152 37% 16%), hsl(152 32% 22%))",
              borderRadius: "24px 24px 0 0",
            }}
          >
            <div className="w-10 h-1 rounded-full bg-white/20 mb-3" />
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                {view === "chat" && (
                  <button
                    onClick={() => setView("threads")}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                    data-testid="chat-back-threads"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                )}
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <h2 className="font-display text-lg font-bold text-white">
                    {view === "threads" ? "Conversations" : "Vitallity AI"}
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                data-testid="chat-close"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Thread List View */}
          {view === "threads" && (
            <div className="flex-1 overflow-y-auto">
              <button
                onClick={startNewThread}
                className="w-full px-4 py-3.5 flex items-center gap-3 border-b border-border/50 hover:bg-primary/5 transition-colors"
                data-testid="new-thread-btn"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-primary">New Conversation</span>
              </button>
              {threads.map((t) => {
                const isToday = t.date === new Date().toISOString().split("T")[0];
                return (
                  <button
                    key={t.date}
                    onClick={() => openThread(t.date)}
                    className="w-full px-4 py-3.5 flex items-center gap-3 border-b border-border/50 hover:bg-muted/50 transition-colors text-left"
                    data-testid={`thread-${t.date}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {isToday ? "Today" : t.date}
                        </p>
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{t.messageCount}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{t.lastMessage}</p>
                    </div>
                  </button>
                );
              })}
              {threads.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Start one to chat about your health</p>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {view === "chat" && <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <p className="text-muted-foreground text-sm">How can I help with your health today?</p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {["What should I eat next?", "How am I doing this week?", "I need motivation"].map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="glass-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className="animate-fade-in-up" style={{ animationDuration: "200ms" }}>
                <div
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap max-w-[85%] ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-2xl rounded-br-md"
                        : "glass-card-dark text-white rounded-2xl rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>

                {/* Food log confirmation card */}
                {msg.role === "assistant" && msg.foodLogItems && msg.foodLogItems.length > 0 && !msg.confirmed && (
                  <div className="mt-2 ml-0 max-w-[85%]">
                    <div className="glass-card p-3 border border-primary/20">
                      <p className="text-xs font-semibold text-primary mb-2">Food items detected:</p>
                      <div className="space-y-1.5 mb-3">
                        {msg.foodLogItems.map((item: any, fi: number) => (
                          <div key={fi} className="flex justify-between text-xs">
                            <span className="text-foreground font-medium">
                              {item.name} x{item.qty}
                            </span>
                            <span className="text-muted-foreground">
                              {item.calories}cal | P:{item.protein}g C:{item.carbs}g F:{item.fat}g
                            </span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => confirmFoodLog(idx, msg.foodLogItems!)}
                        className="vitallity-btn-primary w-full text-xs py-2"
                        data-testid="confirm-food-log"
                      >
                        <Check className="w-3.5 h-3.5 inline mr-1" />
                        Confirm and Add to Log
                      </button>
                    </div>
                  </div>
                )}

                {msg.role === "assistant" && msg.foodLogItems && msg.confirmed && (
                  <div className="mt-1 ml-0 max-w-[85%]">
                    <p className="text-xs text-primary font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Added to today's log
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="glass-card-dark rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-400/60 animate-bounce" style={{ animationDelay: "0ms", animationDuration: "0.6s" }} />
                    <div className="w-2 h-2 rounded-full bg-emerald-400/60 animate-bounce" style={{ animationDelay: "150ms", animationDuration: "0.6s" }} />
                    <div className="w-2 h-2 rounded-full bg-emerald-400/60 animate-bounce" style={{ animationDelay: "300ms", animationDuration: "0.6s" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>}

          {/* Input */}
          {view === "chat" && <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-border/50 bg-background">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your health..."
                className="flex-1 vitallity-input text-sm py-2.5"
                disabled={loading}
                data-testid="chat-input"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 transition-all hover:shadow-lg hover:shadow-primary/20 flex-shrink-0"
                data-testid="chat-send"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
          </form>}
        </div>
      </div>
    </>
  );
}
