"use client";

import { useState, useCallback } from "react";
import { uploadFiles } from "@/lib/api";
import { Document } from "@/lib/types";

export function useUpload(onSuccess?: () => void) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedDocs, setUploadedDocs] = useState<Document[]>([]);
    const [error, setError] = useState<string | null>(null);

    const upload = useCallback(
        async (files: File[]) => {
            setIsUploading(true);
            setError(null);

            try {
                const response = await uploadFiles(files);
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.detail || "Upload failed");
                }

                const data = await response.json();
                setUploadedDocs(data.documents);
                onSuccess?.();
            } catch (err) {
                setError(err instanceof Error ? err.message : "Upload failed");
            } finally {
                setIsUploading(false);
            }
        },
        [onSuccess]
    );

    return { upload, isUploading, uploadedDocs, error };
}
