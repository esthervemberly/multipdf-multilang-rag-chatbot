import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from app.models.database import Document, Chunk
from app.models.schemas import UploadResponse, DocumentResponse
from app.services.pdf_parser import extract_text_by_page, get_page_count
from app.services.chunker import chunk_pages
from app.services.embedder import embed_texts
from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()


async def process_pdf(
    pdf_bytes: bytes,
    filename: str,
    document_id: str,
    db_url: str,
):
    """Background task to process a PDF: parse, chunk, embed, store."""
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
    from app.models.database import Document, Chunk

    engine = create_async_engine(
        db_url,
        echo=False,
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_name_func": lambda: "",
        },
    )
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        try:
            # 1. Extract text by page
            pages = extract_text_by_page(pdf_bytes)

            if not pages:
                await session.execute(
                    Document.__table__.update()
                    .where(Document.__table__.c.id == document_id)
                    .values(status="error")
                )
                await session.commit()
                return

            # 2. Chunk text
            all_chunks = chunk_pages(pages, str(document_id), filename)

            if not all_chunks:
                await session.execute(
                    Document.__table__.update()
                    .where(Document.__table__.c.id == document_id)
                    .values(status="error")
                )
                await session.commit()
                return

            # 3. Generate embeddings (batched)
            texts = [c["content"] for c in all_chunks]
            embeddings = embed_texts(texts, batch_size=32)

            # 4. Create chunk records
            chunk_rows = []
            for chunk_data, embedding in zip(all_chunks, embeddings):
                chunk_rows.append(Chunk(
                    document_id=document_id,
                    source_file=chunk_data["source_file"],
                    page_number=chunk_data["page_number"],
                    content=chunk_data["content"],
                    embedding=embedding,
                    chunk_index=chunk_data["chunk_index"],
                ))

            session.add_all(chunk_rows)

            # 5. Mark document as ready
            await session.execute(
                Document.__table__.update()
                .where(Document.__table__.c.id == document_id)
                .values(status="ready")
            )
            await session.commit()
            logger.info(f"Processed {filename}: {len(chunk_rows)} chunks created")

        except Exception as e:
            logger.error(f"Error processing {filename}: {e}")
            await session.execute(
                Document.__table__.update()
                .where(Document.__table__.c.id == document_id)
                .values(status="error")
            )
            await session.commit()

    await engine.dispose()


@router.post("/upload", response_model=UploadResponse, status_code=202)
async def upload_pdfs(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload one or more PDF files for processing."""
    documents = []

    for file in files:
        # Validate file type
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"Invalid file type: {file.filename}")

        # Read file
        pdf_bytes = await file.read()

        # Validate file size
        max_size = settings.upload_max_size_mb * 1024 * 1024
        if len(pdf_bytes) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File {file.filename} exceeds {settings.upload_max_size_mb}MB limit",
            )

        # Get page count
        try:
            page_count = get_page_count(pdf_bytes)
        except Exception:
            raise HTTPException(status_code=400, detail=f"Could not read {file.filename} as PDF")

        # Create document record
        doc = Document(
            filename=file.filename,
            file_size=len(pdf_bytes),
            page_count=page_count,
            status="processing",
        )
        db.add(doc)
        await db.flush()

        documents.append(doc)

        # Schedule background processing
        background_tasks.add_task(
            process_pdf,
            pdf_bytes,
            file.filename,
            doc.id,
            settings.supabase_db_url,
        )

    await db.commit()

    return UploadResponse(
        documents=[
            DocumentResponse(
                id=str(doc.id),
                filename=doc.filename,
                file_size=doc.file_size,
                page_count=doc.page_count,
                status=doc.status,
                created_at=doc.created_at,
            )
            for doc in documents
        ]
    )
