from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import get_settings

settings = get_settings()


def chunk_text(text: str, page_number: int, document_id: str, source_file: str) -> list[dict]:
    """
    Split text into chunks and return metadata-enriched chunk dicts.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ". ", " "],
        length_function=len,
    )

    chunks = splitter.split_text(text)

    return [
        {
            "document_id": document_id,
            "source_file": source_file,
            "page_number": page_number,
            "content": chunk_text,
            "chunk_index": idx,
        }
        for idx, chunk_text in enumerate(chunks)
    ]


def chunk_pages(
    pages: list[tuple[int, str]],
    document_id: str,
    source_file: str,
) -> list[dict]:
    """Chunk all pages of a document."""
    all_chunks = []
    for page_number, text in pages:
        page_chunks = chunk_text(text, page_number, document_id, source_file)
        all_chunks.extend(page_chunks)
    return all_chunks
