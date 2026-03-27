import { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Chat } from "./components/Chat";
import { SourcesPanel } from "./components/SourcesPanel";
import { api } from "./lib/api";
import type { DocFile, Source } from "./lib/api";

export default function App() {
  const [documents, setDocuments] = useState<DocFile[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [activeSources, setActiveSources] = useState<Source[] | null>(null);

  useEffect(() => {
    api.listDocuments().then(setDocuments).catch(console.error);
  }, []);

  const handleUploaded = (doc: DocFile) => {
    setDocuments((d) => [doc, ...d]);
  };

  const handleDeleted = (id: string) => {
    setDocuments((d) => d.filter((doc) => doc.id !== id));
    setSelectedDocIds((s) => s.filter((sid) => sid !== id));
  };

  const handleToggleDoc = (id: string) => {
    setSelectedDocIds((s) => s.includes(id) ? s.filter((sid) => sid !== id) : [...s, id]);
  };

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar
        documents={documents}
        onUploaded={handleUploaded}
        onDeleted={handleDeleted}
        selectedDocIds={selectedDocIds}
        onToggleDoc={handleToggleDoc}
      />
      <Chat
        selectedDocIds={selectedDocIds}
        onSourcesClick={setActiveSources}
      />
      {activeSources && (
        <SourcesPanel
          sources={activeSources}
          onClose={() => setActiveSources(null)}
        />
      )}
    </div>
  );
}
