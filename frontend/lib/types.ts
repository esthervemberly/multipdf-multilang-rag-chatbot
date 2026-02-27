// Shared types for the PDF RAG Chatbot

export interface Document {
    id: string;
    filename: string;
    file_size: number;
    page_count: number;
    status: "processing" | "ready" | "error";
    chunk_count?: number;
    created_at: string;
}

export interface DocumentListResponse {
    documents: Document[];
    total: number;
    page: number;
    limit: number;
}

export interface UploadResponse {
    documents: Document[];
}

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    citations?: CitationSource[];
}

export interface CitationSource {
    source_file: string;
    page_number: number;
}

export interface ChatEvent {
    type: "token" | "citations" | "done" | "error";
    content?: string;
    sources?: CitationSource[];
}

export interface ChatRequest {
    query: string;
    document_ids?: string[];
    chat_history?: { role: string; content: string }[];
}
