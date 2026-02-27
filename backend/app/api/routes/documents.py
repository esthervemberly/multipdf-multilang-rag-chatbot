from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from app.models.database import Document, Chunk
from app.models.schemas import DocumentListResponse, DocumentListItem

router = APIRouter()


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(
    status: str | None = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List all uploaded documents with chunk counts."""

    # Base query
    base_query = select(Document)
    count_query = select(func.count(Document.id))

    if status:
        base_query = base_query.where(Document.status == status)
        count_query = count_query.where(Document.status == status)

    # Get total
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Get paginated documents
    offset = (page - 1) * limit
    docs_result = await db.execute(
        base_query.order_by(Document.created_at.desc()).offset(offset).limit(limit)
    )
    documents = docs_result.scalars().all()

    # Get chunk counts for each document
    doc_ids = [doc.id for doc in documents]
    items = []

    if doc_ids:
        chunk_counts_result = await db.execute(
            select(Chunk.document_id, func.count(Chunk.id).label("chunk_count"))
            .where(Chunk.document_id.in_(doc_ids))
            .group_by(Chunk.document_id)
        )
        chunk_counts = {str(row.document_id): row.chunk_count for row in chunk_counts_result}
    else:
        chunk_counts = {}

    for doc in documents:
        items.append(DocumentListItem(
            id=str(doc.id),
            filename=doc.filename,
            file_size=doc.file_size,
            page_count=doc.page_count,
            status=doc.status,
            chunk_count=chunk_counts.get(str(doc.id), 0),
            created_at=doc.created_at,
        ))

    return DocumentListResponse(
        documents=items,
        total=total,
        page=page,
        limit=limit,
    )


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete a document and all its chunks."""
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    doc = result.scalar_one_or_none()

    if not doc:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Document not found")

    await db.delete(doc)
    await db.commit()

    return {"message": f"Document {document_id} deleted successfully"}
