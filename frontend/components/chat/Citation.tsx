"use client";

import { CitationSource } from "@/lib/types";

interface CitationProps {
    sources: CitationSource[];
}

export function Citation({ sources }: CitationProps) {
    if (!sources || sources.length === 0) return null;

    return (
        <div className="pt-5 mt-5 border-t border-slate-700/50">
            <div className="flex items-center gap-1.5 mb-4">
                <span className="material-symbols-outlined text-slate-500" style={{ fontSize: "13px" }}>
                    link
                </span>
                <span style={{ fontSize: "14px" }} className="font-bold uppercase tracking-wider text-slate-500">
                    Sources
                </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
                {sources.map((source, idx) => (
                    <button
                        key={`${source.source_file}-${source.page_number}-${idx}`}
                        style={{ padding: "5px 12px", fontSize: "11px" }}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-blue-500/10 hover:text-blue-400 transition-colors rounded-full font-medium text-slate-500"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                            description
                        </span>
                        {source.source_file} p.{source.page_number}
                    </button>
                ))}
            </div>
        </div>
    );
}
