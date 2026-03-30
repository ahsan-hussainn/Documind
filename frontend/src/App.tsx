import { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Chat } from "./components/Chat";
import { api } from "./lib/api";
import type { DocFile } from "./lib/api";

export default function App() {
  const [documents, setDocuments] = useState<DocFile[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

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
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: "#141414" }}>
      <Sidebar
        documents={documents}
        onUploaded={handleUploaded}
        onDeleted={handleDeleted}
        selectedDocIds={selectedDocIds}
        onToggleDoc={handleToggleDoc}
      />
      <Chat selectedDocIds={selectedDocIds} />
    </div>
  );
}
