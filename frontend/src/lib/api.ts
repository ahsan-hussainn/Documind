const BASE = "http://localhost:800";

export interface DocFile {
  id: string;
  original_name: string;
  file_type: string;
  file_size: number;
  chunk_count: number;
  status: string;
  created_at: string;
}

export interface Source {
  document_name: string;
  page: number;
  chunk: string;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  conversation_id: string;
}

export const api = {
  async uploadDocument(file: File): Promise<DocFile> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE}/documents/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async listDocuments(): Promise<DocFile[]> {
    const res = await fetch(`${BASE}/documents/`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async deleteDocument(id: string): Promise<void> {
    await fetch(`${BASE}/documents/${id}`, { method: "DELETE" });
  },

  async ask(question: string, conversationId?: string, documentIds?: string[]): Promise<ChatResponse> {
    const res = await fetch(`${BASE}/chat/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, conversation_id: conversationId, document_ids: documentIds }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
