import json
import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Document, Conversation, Message
from app.models.schemas import ChatRequest, ChatResponse, ConversationResponse, Source
from app.services.retriever import hybrid_search
from app.services.llm import answer_question
from app.config import settings

router = APIRouter()


@router.post("/", response_model=ChatResponse)
def ask(request: ChatRequest, db: Session = Depends(get_db)):
    # Resolve which documents to search
    if request.document_ids:
        doc_ids = request.document_ids
    else:
        docs = db.query(Document).filter(Document.status == "ready").all()
        doc_ids = [d.id for d in docs]

    if not doc_ids:
        raise HTTPException(status_code=400, detail="No documents available. Please upload a document first.")

    # Retrieve relevant chunks
    chunks = hybrid_search(request.question, doc_ids, top_k=settings.top_k_results)
    if not chunks:
        raise HTTPException(status_code=404, detail="No relevant content found in documents.")

    # Load or create conversation
    if request.conversation_id:
        conversation = db.query(Conversation).filter(Conversation.id == request.conversation_id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found.")
    else:
        conversation = Conversation(id=str(uuid.uuid4()), title=request.question[:60])
        db.add(conversation)
        db.commit()

    # Build conversation history for LLM
    past_messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at).all()

    history = [{"role": m.role, "content": m.content} for m in past_messages]

    # Get answer from LLM
    answer = answer_question(request.question, chunks, history)

    # Build source citations — deduplicate by (document, page)
    seen = set()
    sources = []
    for c in chunks:
        key = (c.document_name, c.page)
        if key not in seen:
            seen.add(key)
            sources.append(Source(document_name=c.document_name, page=c.page, chunk=c.text[:200]))

    # Save messages to DB
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.question,
    )
    assistant_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=answer,
        sources=json.dumps([s.model_dump() for s in sources]),
    )
    db.add_all([user_msg, assistant_msg])
    db.commit()

    return ChatResponse(answer=answer, sources=sources, conversation_id=conversation.id)


@router.get("/history/{conversation_id}", response_model=ConversationResponse)
def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return conversation


@router.get("/conversations", response_model=list[ConversationResponse])
def list_conversations(db: Session = Depends(get_db)):
    return db.query(Conversation).order_by(Conversation.created_at.desc()).all()
