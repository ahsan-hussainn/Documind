import numpy as np
from rank_bm25 import BM25Okapi
from dataclasses import dataclass
from openai import OpenAI

from app.config import settings
from app.services.embeddings import load_index, get_embeddings


client = OpenAI(api_key=settings.openai_api_key)


@dataclass
class RetrievedChunk:
    text: str
    document_name: str
    page: int
    score: float


def hybrid_search(
    query: str,
    document_ids: list[str],
    top_k: int = None,
) -> list[RetrievedChunk]:
    """
    Search across documents using hybrid retrieval:
    - FAISS for semantic similarity
    - BM25 for keyword matching
    Scores are combined and top_k results returned.
    """
    if top_k is None:
        top_k = settings.top_k_results

    all_chunks = []  # (text, document_name, page)

    # Load all chunks from requested documents
    for doc_id in document_ids:
        _, metadata = load_index(doc_id)
        if metadata:
            all_chunks.extend(metadata)

    if not all_chunks:
        return []

    texts = [c["text"] for c in all_chunks]

    # --- FAISS semantic search ---
    query_vector = get_embeddings([query])  # shape (1, dim)
    semantic_scores = {}

    for doc_id in document_ids:
        index, metadata = load_index(doc_id)
        if index is None:
            continue
        k = min(top_k * 2, index.ntotal)
        distances, indices = index.search(query_vector, k)
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:
                continue
            # Convert L2 distance to similarity score (lower distance = higher score)
            score = 1 / (1 + dist)
            semantic_scores[idx] = score

    # --- BM25 keyword search ---
    tokenized = [t.lower().split() for t in texts]
    bm25 = BM25Okapi(tokenized)
    bm25_scores = bm25.get_scores(query.lower().split())

    # Normalize BM25 scores to [0, 1]
    max_bm25 = bm25_scores.max() or 1
    bm25_normalized = bm25_scores / max_bm25

    # --- Combine scores (equal weight) ---
    combined = {}
    for i, chunk in enumerate(all_chunks):
        semantic = semantic_scores.get(i, 0)
        keyword = float(bm25_normalized[i])
        combined[i] = (semantic + keyword) / 2

    # Sort by combined score, return top_k
    top_indices = sorted(combined, key=combined.get, reverse=True)[:top_k]

    return [
        RetrievedChunk(
            text=all_chunks[i]["text"],
            document_name=all_chunks[i]["document_name"],
            page=all_chunks[i]["page"],
            score=combined[i],
        )
        for i in top_indices
    ]
