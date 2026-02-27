"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchDocuments } from "@/lib/api";
import { Document } from "@/lib/types";

export function useDocuments() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [total, setTotal] = useState(0);

    const loadDocuments = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetchDocuments(undefined, 1, 100);
            if (response.ok) {
                const data = await response.json();
                setDocuments(data.documents);
                setTotal(data.total);
            }
        } catch {
            console.error("Failed to load documents");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDocuments();
        // Poll for status updates every 5 seconds
        const interval = setInterval(loadDocuments, 5000);
        return () => clearInterval(interval);
    }, [loadDocuments]);

    return { documents, isLoading, total, refresh: loadDocuments };
}
