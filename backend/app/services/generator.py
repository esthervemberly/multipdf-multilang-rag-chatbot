import asyncio
import logging
from typing import AsyncGenerator
import ollama
from app.core.prompts import SYSTEM_PROMPT, RAG_USER_TEMPLATE
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

OLLAMA_MODEL = "llama3.2:3b"


def format_context(chunks: list[dict]) -> str:
    """Format retrieved chunks into a context string with source attribution."""
    parts = []
    for c in chunks:
        parts.append(
            f"---\nSource: {c['source_file']}, Page {c['page_number']}\n"
            f"{c['content']}\n---"
        )
    return "\n\n".join(parts)


def format_chat_history(chat_history: list[dict] | None) -> str:
    """Format chat history into a string."""
    if not chat_history:
        return "No previous conversation."

    # Keep last 3 turns
    recent = chat_history[-6:]
    parts = []
    for msg in recent:
        role = msg.get("role", "user").capitalize()
        parts.append(f"{role}: {msg.get('content', '')}")
    return "\n".join(parts)


async def stream_rag_response(
    query: str,
    chunks: list[dict],
    chat_history: list[dict] | None = None,
) -> AsyncGenerator[str, None]:
    """Stream tokens from Ollama with RAG context."""
    context = format_context(chunks)
    history = format_chat_history(chat_history)

    # Build the user message from the RAG template
    user_message = RAG_USER_TEMPLATE.format(
        context=context,
        chat_history=history,
        query=query,
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    try:
        client = ollama.AsyncClient()
        stream = await client.chat(
            model=OLLAMA_MODEL,
            messages=messages,
            stream=True,
        )

        async for chunk in stream:
            content = chunk.get("message", {}).get("content", "")
            if content:
                yield content

    except Exception as e:
        logger.error(f"Ollama error: {e}")
        raise Exception(
            f"Ollama error: {str(e)}. Make sure Ollama is running "
            f"('ollama serve') and the model '{OLLAMA_MODEL}' is pulled "
            f"('ollama pull {OLLAMA_MODEL}')."
        )
