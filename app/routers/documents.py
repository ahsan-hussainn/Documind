import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Document
from app.models.schemas import DocumentResponse
from app.services.ingestion import ingest_document
from app.services.embeddings import build_index, delete_index
from app.config import settings

router = APIRouter()

ALLOWED_TYPES = {"pdf", "docx", "doc", "txt"}


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}. Allowed: {ALLOWED_TYPES}")

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(status_code=400, detail=f"File too large. Max size: {settings.max_upload_size_mb}MB")

    doc_id = str(uuid.uuid4())
    saved_filename = f"{doc_id}.{ext}"
    file_path = os.path.join(settings.upload_dir, saved_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    doc = Document(
        id=doc_id,
        filename=saved_filename,
        original_name=file.filename,
        file_type=ext,
        file_size=len(content),
        status="processing",
    )
    db.add(doc)
    db.commit()

    try:
        chunks = ingest_document(file_path, file.filename, ext)
        chunk_count = build_index(doc_id, chunks)
        doc.chunk_count = chunk_count
        doc.status = "ready"
    except Exception as e:
        doc.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

    db.commit()
    db.refresh(doc)
    return doc


@router.get("/", response_model=list[DocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    return db.query(Document).order_by(Document.created_at.desc()).all()


@router.delete("/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = os.path.join(settings.upload_dir, doc.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    delete_index(document_id)
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}
