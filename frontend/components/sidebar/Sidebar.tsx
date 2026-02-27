"use client";

import { useCallback, useState, useRef } from "react";
import { Document } from "@/lib/types";
import { deleteDocument } from "@/lib/api";

interface SidebarProps {
    documents: Document[];
    selectedIds: string[];
    onToggleSelect: (id: string) => void;
    onRefresh: () => void;
    onUpload: (files: File[]) => void;
    isUploading: boolean;
    uploadError: string | null;
}

function StatusIndicator({ status }: { status: string }) {
    if (status === "ready") {
        return (
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">
                    Processed
                </span>
            </div>
        );
    }
    if (status === "processing") {
        return (
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-dot" />
                <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">
                    Indexing...
                </span>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-[10px] text-red-500 font-semibold uppercase tracking-wider">
                Error
            </span>
        </div>
    );
}

export function Sidebar({
    documents,
    selectedIds,
    onToggleSelect,
    onRefresh,
    onUpload,
    isUploading,
    uploadError,
}: SidebarProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this document and all its chunks?")) return;
        await deleteDocument(id);
        onRefresh();
    };

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
        <aside className="w-80 flex-shrink-0 border-r border-slate-800 bg-[#1e293b] flex flex-col">
            {/* Header */}
            <div style={{ padding: "24px" }} className="border-b border-slate-800 flex items-center justify-between">
                <h1 className="font-bold text-xl tracking-tight flex items-center gap-3">
                    <span className="material-symbols-outlined text-blue-500 text-2xl">
                        folder_managed
                    </span>
                    Knowledge
                </h1>
                <span style={{ padding: "6px 14px" }} className="text-xs font-medium bg-blue-500/10 text-blue-500 rounded-full">
                    {documents.length} {documents.length === 1 ? "File" : "Files"}
                </span>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto flex flex-col">
                {/* Upload Dropzone */}
                <div style={{ padding: "20px" }}>
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{ padding: "32px 16px" }}
                        className={`border-2 border-dashed transition-colors rounded-xl flex flex-col items-center justify-center text-center cursor-pointer group ${isDragging
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-slate-700 hover:border-blue-500/50 bg-slate-800/30"
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
                            <>
                                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                                <p className="text-sm font-semibold text-slate-300">
                                    Uploading...
                                </p>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-blue-500 transition-colors mb-3">
                                    cloud_upload
                                </span>
                                <p className="text-sm font-semibold text-slate-300">
                                    Upload Documents
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                                    Drop PDFs here
                                </p>
                            </>
                        )}
                    </div>
                    {uploadError && (
                        <p className="text-xs text-red-400 mt-2 px-1">
                            {uploadError}
                        </p>
                    )}
                </div>

                {/* File List */}
                <div style={{ paddingLeft: "20px", paddingRight: "20px", paddingBottom: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ marginBottom: "10px" }} className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 px-1">
                        Files
                    </div>
                    {documents.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-xs text-slate-500">
                                No documents uploaded yet
                            </p>
                        </div>
                    ) : (
                        documents.map((doc) => {
                            const isSelected = selectedIds.includes(doc.id);
                            return (
                                <div
                                    key={doc.id}
                                    onClick={() =>
                                        doc.status === "ready" &&
                                        onToggleSelect(doc.id)
                                    }
                                    style={{ padding: "14px" }}
                                    className={`group relative rounded-xl border transition-all cursor-pointer ${isSelected
                                        ? "border-blue-500/30 bg-blue-500/10"
                                        : "border-slate-700 hover:border-blue-500/50 bg-slate-800/50"
                                        } ${doc.status !== "ready"
                                            ? "opacity-70 cursor-default"
                                            : ""
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* File icon */}
                                        <div
                                            style={{ width: "36px", height: "36px", flexShrink: 0 }}
                                            className={`rounded-full flex items-center justify-center ${isSelected
                                                ? "bg-blue-500/20 text-blue-500"
                                                : "bg-slate-700 text-slate-400"
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-lg">
                                                description
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`font-medium text-sm truncate ${isSelected
                                                    ? "text-blue-400"
                                                    : "text-slate-200"
                                                    }`}
                                            >
                                                {doc.filename}
                                            </p>
                                            <div className="mt-1.5">
                                                <StatusIndicator
                                                    status={doc.status}
                                                />
                                            </div>
                                        </div>
                                        {/* Delete button */}
                                        <button
                                            onClick={(e) =>
                                                handleDelete(doc.id, e)
                                            }
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400 p-1"
                                        >
                                            <span className="material-symbols-outlined text-lg">
                                                delete
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Storage footer */}
            {(() => {
                const SUPABASE_STORAGE_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB free tier
                const usedBytes = documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0);
                const usedMB = usedBytes / (1024 * 1024);
                const totalMB = SUPABASE_STORAGE_BYTES / (1024 * 1024);
                const pct = Math.min((usedBytes / SUPABASE_STORAGE_BYTES) * 100, 100);
                const usedLabel = usedMB >= 1024
                    ? `${(usedMB / 1024).toFixed(2)} GB`
                    : `${usedMB.toFixed(1)} MB`;
                return (
                    <div style={{ padding: "20px" }} className="bg-slate-900/50 border-t border-slate-800">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">
                            <span>Storage</span>
                            <span>{usedLabel} / 1 GB</span>
                        </div>
                        <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5">
                            <div
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <div className="mt-1 text-right text-[9px] text-slate-500 px-1">
                            {pct.toFixed(1)}% used
                        </div>
                    </div>
                );
            })()}
        </aside>
    );
}
