import { useRef, useState } from "react";
import { api } from "../lib/api";
import type { DocFile } from "../lib/api";

interface Props {
  documents: DocFile[];
  onUploaded: (doc: DocFile) => void;
  onDeleted: (id: string) => void;
  selectedDocIds: string[];
  onToggleDoc: (id: string) => void;
}

export function Sidebar({ documents, onUploaded, onDeleted, selectedDocIds, onToggleDoc }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const doc = await api.uploadDocument(file);
      onUploaded(doc);
    } catch (e) {
      alert("Upload failed: " + e);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  return (
    <aside style={{ width: "260px", flexShrink: 0 }} className="bg-surface border-r border-surface-3 flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-surface-3">
        <h1 className="font-display text-xl text-ink tracking-tight">
          Docu<span className="text-amber">Mind</span>
        </h1>
        <p className="text-xs text-ink-muted mt-0.5 font-mono">Document Intelligence</p>
      </div>

      {/* Upload zone */}
      <div className="px-4 py-4 border-b border-surface-3">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200
            ${dragOver ? "border-amber bg-amber/5" : "border-surface-4 hover:border-amber/50 hover:bg-surface-2"}
            ${uploading ? "opacity-50 pointer-events-none" : ""}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse-dot" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse-dot [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse-dot [animation-delay:0.4s]" />
              <span className="text-xs text-ink-muted ml-1">Processing...</span>
            </div>
          ) : (
            <>
              <div className="text-2xl mb-1">↑</div>
              <p className="text-xs text-ink-muted">Drop PDF, DOCX, or TXT</p>
              <p className="text-xs text-ink-faint mt-0.5">or click to browse</p>
            </>
          )}
        </div>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {documents.length === 0 ? (
          <p className="text-xs text-ink-faint text-center mt-8">No documents yet</p>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-ink-faint px-2 mb-2 uppercase tracking-widest">
              {documents.length} document{documents.length !== 1 ? "s" : ""}
            </p>
            {documents.map((doc) => {
              const selected = selectedDocIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => onToggleDoc(doc.id)}
                  className={`
                    flex items-start gap-2 px-2 py-2 rounded-md cursor-pointer transition-all group
                    ${selected ? "bg-amber/10 border border-amber/20" : "hover:bg-surface-2 border border-transparent"}
                  `}
                >
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                    doc.status === "ready" ? "bg-emerald-500" :
                    doc.status === "processing" ? "bg-amber animate-pulse" : "bg-red-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-ink truncate">{doc.original_name}</p>
                    <p className="text-xs text-ink-faint font-mono mt-0.5">
                      {formatSize(doc.file_size)} · {doc.chunk_count} chunks
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleted(doc.id); api.deleteDocument(doc.id); }}
                    className="opacity-0 group-hover:opacity-100 text-ink-faint hover:text-red-400 text-xs transition-opacity"
                  >✕</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-surface-3">
        <p className="text-xs text-ink-faint">
          {selectedDocIds.length === 0
            ? "Searching all documents"
            : `Searching ${selectedDocIds.length} selected`}
        </p>
      </div>
    </aside>
  );
}
