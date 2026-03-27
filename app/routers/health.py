from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "primary_llm": settings.primary_llm,
        "chat_model": settings.openai_chat_model if settings.primary_llm == "openai" else settings.anthropic_model,
        "embedding_model": settings.openai_embedding_model,
    }
