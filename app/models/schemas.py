from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# --- Document Schemas ---

class DocumentResponse(BaseModel):
    id: str
    original_name: str
    file_type: str
    file_size: int
    chunk_count: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Chat Schemas ---

class Source(BaseModel):
    document_name: str
    page: int
    chunk: str


class ChatRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None
    document_ids: Optional[list[str]] = None  # filter to specific docs, or None = all


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]
    conversation_id: str


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    sources: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: str
    title: Optional[str]
    created_at: datetime
    messages: list[MessageResponse] = []

    class Config:
        from_attributes = True
