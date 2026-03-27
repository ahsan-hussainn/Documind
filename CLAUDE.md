# DocuMind — AI Document Q&A API

## What This Project Is

A production-ready RAG (Retrieval-Augmented Generation) API that lets users upload documents (PDF, DOCX, TXT) and ask questions in natural language. Answers include source citations (document name + page number).

Built as a portfolio project for Upwork — demonstrates Python backend, AI integration, and production engineering skills.

## Architecture

```
User uploads document
  → routers/documents.py
  → services/ingestion.py     (parse + chunk)
  → services/embeddings.py    (embed + save to FAISS)
  → db: document metadata saved to PostgreSQL

User asks a question
  → routers/chat.py
  → services/retriever.py     (hybrid: FAISS semantic + BM25 keyword)
  → services/llm.py           (OpenAI primary, Claude fallback)
  → streams answer + citations back
```

## Key Design Decisions

- **Hybrid search**: FAISS (semantic) + BM25 (keyword) combined. Pure vector search misses exact matches like codes, names, article numbers.
- **Primary LLM**: OpenAI (gpt-4o-mini for chat, text-embedding-3-small for embeddings)
- **Fallback LLM**: Anthropic Claude (configurable via PRIMARY_LLM env var)
- **FAISS over Pinecone**: Self-contained, no external service, easy to Docker-ize
- **Source citations**: PyMuPDF extracts text page-by-page so every chunk knows its page number
- **Streaming**: All chat endpoints use SSE for real-time response

## Project Structure

```
app/
  main.py           # FastAPI app, middleware, router registration
  config.py         # Pydantic settings from .env
  dependencies.py   # Shared FastAPI deps (db session, etc.)
  routers/
    documents.py    # POST /documents/upload, GET /documents, DELETE /documents/{id}
    chat.py         # POST /chat, GET /chat/history/{session_id}
    health.py       # GET /health
  services/
    ingestion.py    # PDF/DOCX/TXT → chunks with metadata
    embeddings.py   # chunks → embeddings → FAISS index
    retriever.py    # hybrid search: FAISS + BM25
    llm.py          # LangChain chain, OpenAI + Claude
  models/
    schemas.py      # Pydantic request/response models
  db/
    database.py     # SQLAlchemy engine + session
    models.py       # Document, Conversation, Message ORM models
frontend/           # React + Tailwind chat UI
tests/
```

## Environment Variables

See `.env.example` for all required variables. Key ones:
- `PRIMARY_LLM` — `openai` or `anthropic`
- `CHUNK_SIZE` — characters per chunk (default 1000)
- `TOP_K_RESULTS` — chunks to retrieve per query (default 5)

## Coding Conventions

- All services are plain Python classes, no global state
- Routers only handle HTTP concerns — business logic lives in services
- Every function has a docstring explaining what it does
- Pydantic models for all inputs and outputs — no raw dicts crossing boundaries
