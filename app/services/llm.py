from openai import OpenAI
from anthropic import Anthropic
from app.config import settings
from app.services.retriever import RetrievedChunk

openai_client = OpenAI(api_key=settings.openai_api_key)
anthropic_client = Anthropic(api_key=settings.anthropic_api_key) if settings.anthropic_api_key else None

SYSTEM_PROMPT = """You are DocuMind, an intelligent document analyst. You answer questions by reading, analyzing, and reasoning over the provided document context.

Rules:
- Base your answer on the provided context
- For analytical questions (strengths, weaknesses, themes, patterns, risks, summaries), INFER and REASON from the content — do not require the exact words to appear in the document
- If there is genuinely no relevant information in the context, say "I couldn't find relevant information in the uploaded documents"
- Be concise, structured, and direct
- Always end your answer with a "References" section listing the document name, page number, and the relevant quote or section that informed your answer
"""


def build_context(chunks: list[RetrievedChunk]) -> str:
    parts = []
    for i, chunk in enumerate(chunks, 1):
        parts.append(f"[Source {i}: {chunk.document_name}, page {chunk.page}]\n{chunk.text}")
    return "\n\n---\n\n".join(parts)


def ask_openai(question: str, context: str, history: list[dict]) -> str:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(history)
    messages.append({
        "role": "user",
        "content": f"Context:\n{context}\n\nQuestion: {question}"
    })

    response = openai_client.chat.completions.create(
        model=settings.openai_chat_model,
        messages=messages,
        temperature=0.2,
    )
    return response.choices[0].message.content


def ask_anthropic(question: str, context: str, history: list[dict]) -> str:
    messages = []
    messages.extend(history)
    messages.append({
        "role": "user",
        "content": f"Context:\n{context}\n\nQuestion: {question}"
    })

    response = anthropic_client.messages.create(
        model=settings.anthropic_model,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=messages,
    )
    return response.content[0].text


def answer_question(
    question: str,
    chunks: list[RetrievedChunk],
    history: list[dict] = None,
) -> str:
    if history is None:
        history = []

    context = build_context(chunks)

    if settings.primary_llm == "anthropic" and anthropic_client:
        return ask_anthropic(question, context, history)
    else:
        return ask_openai(question, context, history)
