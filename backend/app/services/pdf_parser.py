import fitz  # PyMuPDF


def extract_text_by_page(pdf_bytes: bytes) -> list[tuple[int, str]]:
    """
    Extract text from a PDF file, returning a list of (page_number, text) tuples.
    Page numbers are 1-indexed.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")
        if text.strip():
            pages.append((page_num + 1, text.strip()))

    doc.close()
    return pages


def get_page_count(pdf_bytes: bytes) -> int:
    """Return the total number of pages in a PDF."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    count = len(doc)
    doc.close()
    return count
