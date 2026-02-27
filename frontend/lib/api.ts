const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function uploadFiles(files: File[]): Promise<Response> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    return fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
    });
}

export async function fetchDocuments(
    status?: string,
    page: number = 1,
    limit: number = 20
): Promise<Response> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set("status", status);

    return fetch(`${API_BASE}/documents?${params}`);
}

export async function deleteDocument(documentId: string): Promise<Response> {
    return fetch(`${API_BASE}/documents/${documentId}`, { method: "DELETE" });
}

export async function sendChatMessage(
    query: string,
    documentIds?: string[],
    chatHistory?: { role: string; content: string }[]
): Promise<Response> {
    return fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            query,
            document_ids: documentIds,
            chat_history: chatHistory,
        }),
    });
}
