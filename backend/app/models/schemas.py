from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# --- Upload ---
class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_size: int
    page_count: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UploadResponse(BaseModel):
    documents: list[DocumentResponse]


# --- Documents ---
class DocumentListItem(BaseModel):
    id: str
    filename: str
    file_size: int
    page_count: int
    status: str
    chunk_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    documents: list[DocumentListItem]
    total: int
    page: int
    limit: int


# --- Chat ---
class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1)
    document_ids: Optional[list[str]] = None
    chat_history: Optional[list[ChatMessage]] = None


class CitationSource(BaseModel):
    source_file: str
    page_number: int


class ChatEvent(BaseModel):
    type: str  # "token", "citations", "done", "error"
    content: Optional[str] = None
    sources: Optional[list[CitationSource]] = None
