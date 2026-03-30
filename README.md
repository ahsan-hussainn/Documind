# DocuMind

**AI-powered document Q&A with source citations.**

Upload PDF, DOCX, or TXT files and ask questions in natural language. DocuMind retrieves the most relevant passages using hybrid search (semantic + keyword) and generates answers with exact page-level citations.

<img width="959" height="436" alt="image" src="https://github.com/user-attachments/assets/4f4f5ada-0e16-44a4-afd8-dfae217e0ab0" />


## Features

- **Document upload** — PDF, DOCX, TXT with automatic text extraction and chunking
- **Hybrid retrieval** — FAISS vector search + BM25 keyword search combined for higher accuracy
- **Source citations** — every answer includes document name, page number, and quoted passage
- **Multi-document search** — query across all documents or filter to a specific subset
- **Conversation memory** — multi-turn Q&A with context from previous messages
- **LLM fallback** — OpenAI (primary) with Anthropic Claude as a configurable fallback
- **Dockerized** — one command to run the full stack with PostgreSQL

<img width="959" height="434" alt="image" src="https://github.com/user-attachments/assets/7f7266c9-9088-4727-98a7-d052d945d180" />

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python, FastAPI, SQLAlchemy, LangChain |
| **Search** | FAISS (semantic), rank-bm25 (keyword) |
| **LLMs** | OpenAI GPT-4o-mini, text-embedding-3-small |
| **Fallback LLM** | Anthropic Claude Sonnet |
| **Frontend** | React, TypeScript, Tailwind CSS, Vite |
| **Database** | PostgreSQL |
| **Infrastructure** | Docker, Docker Compose |

## Architecture

```
User uploads document
  → POST /documents/upload
  → ingestion.py        parse PDF/DOCX/TXT → text chunks with page numbers
  → embeddings.py       embed chunks → save to FAISS index
  → PostgreSQL          save document metadata

User asks a question
  → POST /chat/
  → retriever.py        hybrid search: FAISS (semantic) + BM25 (keyword)
  → llm.py              generate answer with source context (OpenAI or Claude)
  → return answer + page-level citations
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- OpenAI API key (required), Anthropic API key (optional, for fallback)

### 1. Clone and configure

```bash
git clone https://github.com/YOUR_USERNAME/documind.git
cd documind
cp .env.example .env
# Edit .env — add your OPENAI_API_KEY at minimum
```

### 2. Start the backend

```bash
docker-compose up -d
```

This starts PostgreSQL and the FastAPI server on `http://localhost:8000`.

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check + config info |
| `POST` | `/documents/upload` | Upload a document (multipart form) |
| `GET` | `/documents/` | List all documents |
| `DELETE` | `/documents/{id}` | Delete a document and its index |
| `POST` | `/chat/` | Ask a question, get answer + citations |
| `GET` | `/chat/history/{conversation_id}` | Get conversation history |
| `GET` | `/chat/conversations` | List all conversations |

## Project Structure

```
app/
  main.py              FastAPI app, middleware, startup
  config.py            Pydantic settings from .env
  routers/
    documents.py       Upload, list, delete documents
    chat.py            Q&A with citations and conversation history
    health.py          Health check endpoint
  services/
    ingestion.py       PDF/DOCX/TXT → chunks with page metadata
    embeddings.py      Chunks → OpenAI embeddings → FAISS index
    retriever.py       Hybrid search: FAISS + BM25, scored and ranked
    llm.py             LLM integration (OpenAI primary, Claude fallback)
  models/
    schemas.py         Pydantic request/response models
  db/
    database.py        SQLAlchemy engine + session
    models.py          Document, Conversation, Message ORM models
frontend/
  src/
    components/        React UI components (Chat, Sidebar)
    lib/api.ts         API client
```

## Key Design Decisions

**Why hybrid search?**
Pure vector search misses exact matches — codes, article numbers, proper names. BM25 keyword search catches those. Combining both (50/50 weighted) gives consistently better retrieval than either alone.

**Why FAISS over Pinecone/Weaviate?**
Self-contained, no external service dependency, easy to Docker-ize. For a document Q&A app with moderate scale, brute-force FAISS is fast enough and keeps the architecture simple.

**Why page-level chunking?**
PyMuPDF extracts text page-by-page, so every chunk carries its page number. This makes source citations meaningful — users can verify answers by going to the exact page.

## Environment Variables

See [`.env.example`](.env.example) for all options. Key ones:

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | Required for embeddings and chat |
| `ANTHROPIC_API_KEY` | — | Optional, enables Claude fallback |
| `PRIMARY_LLM` | `openai` | `openai` or `anthropic` |
| `CHUNK_SIZE` | `1000` | Characters per text chunk |
| `TOP_K_RESULTS` | `5` | Number of chunks retrieved per query |

## License

MIT
