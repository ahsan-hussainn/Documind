import fitz  # PyMuPDF
import docx
from pathlib import Path
from dataclasses import dataclass
from langchain.text_splitter import RecursiveCharacterTextSplitter

from app.config import settings


@dataclass
class Chunk:
    text: str
    document_name: str
    page: int
    chunk_index: int


def parse_pdf(file_path: str, document_name: str) -> list[Chunk]:
    chunks = []
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )

    doc = fitz.open(file_path)
    for page_num, page in enumerate(doc, start=1):
        text = page.get_text().strip()
        if not text:
            continue
        page_chunks = splitter.split_text(text)
        for i, chunk_text in enumerate(page_chunks):
            chunks.append(Chunk(
                text=chunk_text,
                document_name=document_name,
                page=page_num,
                chunk_index=len(chunks),
            ))
    doc.close()
    return chunks


def parse_docx(file_path: str, document_name: str) -> list[Chunk]:
    chunks = []
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )

    doc = docx.Document(file_path)
    full_text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    text_chunks = splitter.split_text(full_text)

    for i, chunk_text in enumerate(text_chunks):
        chunks.append(Chunk(
            text=chunk_text,
            document_name=document_name,
            page=1,  # DOCX has no page concept
            chunk_index=i,
        ))
    return chunks


def parse_txt(file_path: str, document_name: str) -> list[Chunk]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )
    text = Path(file_path).read_text(encoding="utf-8", errors="ignore")
    text_chunks = splitter.split_text(text)

    return [
        Chunk(text=chunk_text, document_name=document_name, page=1, chunk_index=i)
        for i, chunk_text in enumerate(text_chunks)
    ]


def ingest_document(file_path: str, document_name: str, file_type: str) -> list[Chunk]:
    ext = file_type.lower()
    if ext == "pdf":
        return parse_pdf(file_path, document_name)
    elif ext in ("docx", "doc"):
        return parse_docx(file_path, document_name)
    elif ext == "txt":
        return parse_txt(file_path, document_name)
    else:
        raise ValueError(f"Unsupported file type: {ext}")
