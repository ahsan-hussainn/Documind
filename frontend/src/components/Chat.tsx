import { useState, useRef, useEffect, useMemo } from "react";
import { api } from "../lib/api";
import type { Source } from "../lib/api";

const ALL_SUGGESTIONS = [
  "What is this document about?",
  "Summarize the key points",
  "What are the main conclusions?",
  "List all important dates",
  "What are the key recommendations?",
  "Extract the main arguments",
  "What data or statistics are mentioned?",
  "Who are the key people or organizations?",
  "What problems does this document address?",
  "Compare the main viewpoints presented",
];

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  showSources?: boolean;
}

interface Props {
  selectedDocIds: string[];
}

export function Chat({ selectedDocIds }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const suggestions = useMemo(() => pickRandom(ALL_SUGGESTIONS, 4), []);
  const [conversationId, setConversationId] = useState<string>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await api.ask(q, conversationId, selectedDocIds.length > 0 ? selectedDocIds : undefined);
      if (!conversationId) setConversationId(res.conversation_id);
      setMessages((m) => [...m, { role: "assistant", content: res.answer, sources: res.sources, showSources: false }]);
    } catch (e: any) {
      let msg = "Something went wrong.";
      try { msg = JSON.parse(e.message)?.detail || msg; } catch {}
      setMessages((m) => [...m, { role: "assistant", content: `⚠ ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSources = (index: number) => {
    setMessages((m) => m.map((msg, i) => i === index ? { ...msg, showSources: !msg.showSources } : msg));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const reset = () => { setMessages([]); setConversationId(undefined); };

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-surface-1">

      {/* Messages — scrollable, full width */}
      <div className="flex-1 overflow-y-auto w-full">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 animate-fade-up">
            <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-surface-3 flex items-center justify-center mb-5">
              <span className="text-amber text-xl font-display font-semibold">D</span>
            </div>
            <h2 className="font-display text-2xl text-ink mb-2">How can I help?</h2>
            <p className="text-sm text-ink-muted max-w-sm mb-8">
              Upload a document from the sidebar and ask anything about it.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-xl">
              {suggestions.map((q) => (
                <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="text-sm px-4 py-2 rounded-xl border border-surface-3 text-ink-muted hover:border-amber/40 hover:text-ink hover:bg-surface-2 transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto px-6 py-6 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className="animate-fade-up">
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-xl bg-surface-2 border border-surface-3 rounded-2xl rounded-tr-sm px-4 py-3">
                      <p className="text-sm text-ink">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-amber/10 border border-amber/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-amber text-xs font-display font-semibold">D</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="prose-answer text-sm text-ink leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: msg.content
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/^#{1,3}\s(.+)$/gm, "<p class=\"font-semibold text-ink mt-3 mb-1\">$1</p>")
                            .replace(/\n\n/g, "</p><p class=\"mb-3\">")
                            .replace(/\n/g, "<br/>")
                            .replace(/^/, "<p class=\"mb-3\">")
                            .replace(/$/, "</p>")
                        }}
                      />
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3">
                          <button onClick={() => toggleSources(i)}
                            className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-amber transition-colors">
                            <span className={`transition-transform duration-200 inline-block ${msg.showSources ? "rotate-90" : ""}`}>▶</span>
                            <span>{msg.sources.length} reference{msg.sources.length > 1 ? "s" : ""}</span>
                          </button>
                          {msg.showSources && (
                            <div className="mt-2 space-y-2 animate-fade-up">
                              {msg.sources.map((src, j) => (
                                <div key={j} className="border border-surface-3 rounded-lg p-3 bg-surface-2 hover:border-amber/20 transition-colors">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-xs font-mono text-amber bg-amber/10 px-1.5 py-0.5 rounded">p.{src.page}</span>
                                    <span className="text-xs text-ink-muted truncate">{src.document_name}</span>
                                  </div>
                                  <p className="text-xs text-ink-faint font-mono leading-relaxed">"{src.chunk}"</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 animate-fade-up">
                <div className="w-7 h-7 rounded-lg bg-amber/10 border border-amber/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber text-xs font-display font-semibold">D</span>
                </div>
                <div className="flex items-center gap-1.5 pt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse-dot [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse-dot [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input — full width background, centered content */}
      <div className="w-full border-t border-surface-3 bg-surface px-6 py-4">
        <div className="w-full max-w-4xl mx-auto">
          {messages.length > 0 && (
            <div className="flex justify-end mb-2">
              <button onClick={reset} className="text-xs text-ink-faint hover:text-amber transition-colors font-mono">
                new conversation ↺
              </button>
            </div>
          )}
          <div className="flex items-end gap-3 bg-surface-2 border border-surface-3 rounded-2xl px-4 py-3 focus-within:border-amber/30 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask a question about your documents..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-ink placeholder-ink-faint resize-none outline-none max-h-40 leading-relaxed"
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 160) + "px";
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber disabled:bg-surface-4 disabled:text-ink-faint flex items-center justify-center text-sm transition-all hover:bg-amber-dim disabled:cursor-not-allowed font-bold"
            >↑</button>
          </div>
        </div>
      </div>
    </div>
  );
}
