import asyncio
import logging
import time
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.embedder import embed_query
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def retrieve_chunks(
    query: str,
    db: AsyncSession,
    document_ids: list[str] | None = None,
    top_k: int | None = None,
) -> list[dict]:
    """
    Embed the query and perform cosine similarity search in pgvector.
    Optionally filter by document_ids.
    """
    if top_k is None:
        top_k = settings.top_k

    # Embed the query — run in thread pool since it's CPU-bound
    t0 = time.perf_counter()
    loop = asyncio.get_event_loop()
    query_embedding = await loop.run_in_executor(None, embed_query, query)
    t1 = time.perf_counter()
    logger.warning(f"⏱ EMBEDDING took {t1 - t0:.2f}s")

    embedding_str = str(query_embedding)

    # Build SQL — use CAST() instead of :: to avoid asyncpg parameter parsing conflicts
    if document_ids:
        # Build a comma-separated list for IN clause (asyncpg doesn't handle uuid[] well via pooler)
        doc_id_placeholders = ", ".join(f"'{did}'" for did in document_ids)
        sql = text(f"""
            SELECT
                CAST(id AS text),
                CAST(document_id AS text),
                source_file,
                page_number,
                content,
                1 - (embedding <=> CAST(:embedding AS vector)) AS similarity
            FROM chunks
            WHERE document_id IN ({doc_id_placeholders})
              AND 1 - (embedding <=> CAST(:embedding AS vector)) > :threshold
            ORDER BY embedding <=> CAST(:embedding AS vector)
            LIMIT :top_k
        """)
        params = {
            "embedding": embedding_str,
            "threshold": settings.similarity_threshold,
            "top_k": top_k,
        }
    else:
        sql = text("""
            SELECT
                CAST(id AS text),
                CAST(document_id AS text),
                source_file,
                page_number,
                content,
                1 - (embedding <=> CAST(:embedding AS vector)) AS similarity
            FROM chunks
            WHERE 1 - (embedding <=> CAST(:embedding AS vector)) > :threshold
            ORDER BY embedding <=> CAST(:embedding AS vector)
            LIMIT :top_k
        """)
        params = {
            "embedding": embedding_str,
            "threshold": settings.similarity_threshold,
            "top_k": top_k,
        }

    result = await db.execute(sql, params)
    rows = result.mappings().all()

    return [dict(row) for row in rows]
