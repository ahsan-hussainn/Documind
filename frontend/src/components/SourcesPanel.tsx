import type { Source } from "../lib/api";

interface Props {
  sources: Source[];
  onClose: () => void;
}

export function SourcesPanel({ sources, onClose }: Props) {
  return (
    <aside className="w-80 bg-surface-1 border-l border-surface-3 flex flex-col h-full animate-slide-in">
      <div className="px-5 py-4 border-b border-surface-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-display text-ink">References</h2>
          <p className="text-xs text-ink-muted font-mono mt-0.5">{sources.length} source{sources.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={onClose} className="text-ink-faint hover:text-ink text-lg transition-colors">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {sources.map((src, i) => (
          <div key={i} className="border border-surface-3 rounded-lg p-3 hover:border-amber/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-amber bg-amber/10 px-1.5 py-0.5 rounded">
                p.{src.page}
              </span>
              <span className="text-xs text-ink-muted truncate">{src.document_name}</span>
            </div>
            <p className="text-xs text-ink-faint font-mono leading-relaxed line-clamp-4">
              "{src.chunk}"
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}
