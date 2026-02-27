"use client";

import { useCallback, useState, useRef } from "react";

interface UploadDropzoneProps {
    onUpload: (files: File[]) => void;
    isUploading: boolean;
}

export function UploadDropzone({ onUpload, isUploading }: UploadDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const files = Array.from(e.dataTransfer.files).filter(
                (f) => f.type === "application/pdf"
            );
            if (files.length > 0) onUpload(files);
        },
        [onUpload]
    );

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) onUpload(files);
        e.target.value = "";
    };

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${isDragging
                    ? "border-cyan-400 bg-cyan-500/10"
                    : "border-white/10 hover:border-white/20 hover:bg-white/5"
                } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
            />

            {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-white/50">Uploading...</span>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                        <svg
                            className="w-5 h-5 text-white/40"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-white/60">
                            Drop PDFs here or click to browse
                        </p>
                        <p className="text-xs text-white/30 mt-0.5">Max 50 MB per file</p>
                    </div>
                </div>
            )}
        </div>
    );
}
