import faiss
import numpy as np
import json
import os
from openai import OpenAI

from app.config import settings
from app.services.ingestion import Chunk


client = OpenAI(api_key=settings.openai_api_key)


def get_embeddings(texts: list[str]) -> np.ndarray:
    """Embed a list of texts using OpenAI, returns (N, dim) float32 array."""
    response = client.embeddings.create(
        model=settings.openai_embedding_model,
        input=texts,
    )
    vectors = [item.embedding for item in response.data]
    return np.array(vectors, dtype=np.float32)


def build_index(document_id: str, chunks: list[Chunk]) -> int:
    """
    Embed all chunks and save a FAISS index + metadata to disk.
    Returns the number of chunks indexed.
    """
    texts = [c.text for c in chunks]
    vectors = get_embeddings(texts)

    dimension = vectors.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(vectors)

    index_path = os.path.join(settings.faiss_index_dir, f"{document_id}.index")
    meta_path = os.path.join(settings.faiss_index_dir, f"{document_id}.meta.json")

    faiss.write_index(index, index_path)

    metadata = [
        {"text": c.text, "document_name": c.document_name, "page": c.page}
        for c in chunks
    ]
    with open(meta_path, "w") as f:
        json.dump(metadata, f)

    return len(chunks)


def load_index(document_id: str):
    """Load FAISS index and metadata for a document."""
    index_path = os.path.join(settings.faiss_index_dir, f"{document_id}.index")
    meta_path = os.path.join(settings.faiss_index_dir, f"{document_id}.meta.json")

    if not os.path.exists(index_path):
        return None, None

    index = faiss.read_index(index_path)
    with open(meta_path) as f:
        metadata = json.load(f)

    return index, metadata


def delete_index(document_id: str):
    """Remove FAISS index files for a document."""
    for ext in (".index", ".meta.json"):
        path = os.path.join(settings.faiss_index_dir, f"{document_id}{ext}")
        if os.path.exists(path):
            os.remove(path)
