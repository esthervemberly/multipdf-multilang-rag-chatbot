import json
import logging
import re
import time
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from app.models.schemas import ChatRequest
from app.services.retriever import retrieve_chunks
from app.services.generator import stream_rag_response
from app.core.streaming import (
    create_token_event,
    create_citations_event,
    create_done_event,
    create_error_event,
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Regex to extract [Source: filename, Page N] references from LLM output
_SOURCE_PATTERN = re.compile(
    r"\[Source:\s*(.+?),\s*Page\s*(\d+)\]",
    re.IGNORECASE,
)


def _extract_cited_sources(text: str) -> set[tuple[str, int]]:
    """Parse the LLM response text and return the set of (filename, page) actually cited."""
    return {(m.group(1).strip(), int(m.group(2))) for m in _SOURCE_PATTERN.finditer(text)}


@router.post("/chat")
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """Chat endpoint with RAG retrieval and streaming Gemini response."""

    async def event_generator():
        try:
            # 1. Retrieve relevant chunks (embedding + pgvector search)
            t0 = time.perf_counter()
            chunks = await retrieve_chunks(
                query=request.query,
                db=db,
                document_ids=request.document_ids,
            )
            t1 = time.perf_counter()
            logger.warning(f"⏱ RETRIEVAL (embed + pgvector) took {t1 - t0:.2f}s")

            if not chunks:
                yield await create_token_event(
                    "I couldn't find any relevant information in the uploaded documents. "
                    "Please make sure you have uploaded PDFs related to your question."
                )
                yield await create_done_event()
                return

            # 2. Stream response from LLM, collecting full text for citation parsing
            chat_history = None
            if request.chat_history:
                chat_history = [msg.model_dump() for msg in request.chat_history]

            t2 = time.perf_counter()
            first_token = True
            full_response = ""
            async for token in stream_rag_response(
                query=request.query,
                chunks=chunks,
                chat_history=chat_history,
            ):
                if first_token:
                    t3 = time.perf_counter()
                    logger.warning(f"⏱ LLM first token took {t3 - t2:.2f}s")
                    first_token = False
                full_response += token
                yield await create_token_event(token)

            # 3. Emit only the citations the LLM actually referenced
            cited = _extract_cited_sources(full_response)

            # Build unique citations filtered to what the LLM actually cited
            seen = set()
            unique_citations = []
            for c in chunks:
                key = (c["source_file"], c["page_number"])
                if key in cited and key not in seen:
                    seen.add(key)
                    unique_citations.append({
                        "source_file": c["source_file"],
                        "page_number": c["page_number"],
                    })

            # Fallback: if parsing found nothing (LLM didn't use the expected format),
            # include all retrieved sources so the user still sees something
            if not unique_citations:
                seen = set()
                for c in chunks:
                    key = (c["source_file"], c["page_number"])
                    if key not in seen:
                        seen.add(key)
                        unique_citations.append({
                            "source_file": c["source_file"],
                            "page_number": c["page_number"],
                        })

            yield await create_citations_event(unique_citations)

            # 4. Done
            yield await create_done_event()

        except Exception as e:
            logger.error(f"Chat error: {e}")
            yield await create_error_event(f"An error occurred: {str(e)}")
            yield await create_done_event()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
