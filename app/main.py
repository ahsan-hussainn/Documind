from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.config import settings
from app.routers import documents, chat, health
from app.db.database import create_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once at startup — create DB tables and required directories
    create_tables()
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(settings.faiss_index_dir, exist_ok=True)
    yield
    # Anything after yield runs at shutdown (nothing needed here yet)


app = FastAPI(
    title="DocuMind",
    description="Upload documents, ask questions, get answers with source citations.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(documents.router, prefix="/documents", tags=["Documents"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
