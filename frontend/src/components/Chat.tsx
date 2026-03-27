import { useState, useRef, useEffect } from "react";
import { api } from "../lib/api";
import type { Source } from "../lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface Props {
  selectedDocIds: string[];
  onSourcesClick: (sources: Source[]) => void;
}

export function Chat({ selectedDocIds, onSourcesClick }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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
      setMessages((m) => [...m, { role: "assistant", content: res.answer, sources: res.sources }]);
    } catch (e: any) {
      let msg = "Something went wrong.";
      try { msg = JSON.parse(e.message)?.detail || msg; } catch {}
      setMessages((m) => [...m, { role: "assistant", content: `⚠ ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const reset = () => {
    setMessages([]);
    setConversationId(undefined);
  };

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-surface-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm text-ink font-display">Ask your documents</h2>
          <p className="text-xs text-ink-faint mt-0.5">
            {selectedDocIds.length > 0 ? `Searching ${selectedDocIds.length} selected document${selectedDocIds.length > 1 ? "s" : ""}` : "Searching all documents"}
          </p>
        </div>
        {messages.length > 0 && (
          <button onClick={reset} className="text-xs text-ink-faint hover:text-amber transition-colors font-mono">
            new conversation ↺
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-up">
            <div className="text-4xl mb-4 opacity-20">⟐</div>
            <h3 className="font-display text-lg text-ink/60 mb-2">Ready to answer</h3>
            <p className="text-sm text-ink-faint max-w-sm">
              Upload a document from the sidebar, then ask anything about its contents.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {["What is this document about?", "Summarize the key points", "What are the main conclusions?"].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-surface-4 text-ink-muted hover:border-amber/40 hover:text-ink transition-all"
                >{q}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`}>
            {msg.role === "user" ? (
              <div className="max-w-lg bg-surface-3 rounded-2xl rounded-tr-sm px-4 py-3">
                <p className="text-sm text-ink">{msg.content}</p>
              </div>
            ) : (
              <div className="max-w-2xl w-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber" />
                  <span className="text-xs font-mono text-amber">DocuMind</span>
                </div>
                <div
                  className="prose-answer text-sm text-ink leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\n\n/g, "</p><p>")
                      .replace(/\n/g, "<br/>")
                      .replace(/^/, "<p>")
                      .replace(/$/, "</p>")
                  }}
                />
                {msg.sources && msg.sources.length > 0 && (
                  <button
                    onClick={() => onSourcesClick(msg.sources!)}
                    className="mt-3 text-xs font-mono text-amber/60 hover:text-amber border border-amber/20 hover:border-amber/40 px-3 py-1 rounded-full transition-all"
                  >
                    {msg.sources.length} reference{msg.sources.length > 1 ? "s" : ""} →
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 animate-fade-up">
            <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse-dot" />
            <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse-dot [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse-dot [animation-delay:0.4s]" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-surface-3">
        <div className="flex items-end gap-3 bg-surface-2 border border-surface-4 rounded-xl px-4 py-3 focus-within:border-amber/40 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask a question about your documents..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-ink placeholder-ink-faint resize-none outline-none max-h-32 leading-relaxed"
            style={{ height: "auto" }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 128) + "px";
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber disabled:bg-surface-4 disabled:text-ink-faint text-surface flex items-center justify-center text-sm font-bold transition-all hover:bg-amber-dim disabled:cursor-not-allowed"
          >
            ↑
          </button>
        </div>
        <p className="text-xs text-ink-faint mt-2 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </main>
  );
}
