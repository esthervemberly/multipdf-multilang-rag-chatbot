"use client";

import { ReactNode } from "react";
import { ChatMessage } from "@/lib/types";
import { Citation } from "./Citation";

/**
 * Renders text with **bold**, ### headers, and styled [Source: ...] inline references.
 */
function renderFormattedContent(text: string): ReactNode[] {
    // Process line by line to handle ### headers, then inline formatting
    const lines = text.split("\n");
    const result: ReactNode[] = [];

    lines.forEach((line, lineIdx) => {
        if (lineIdx > 0) {
            result.push(<br key={`br-${lineIdx}`} />);
        }

        // Check for ### header
        const headerMatch = line.match(/^###\s+(.+)/);
        if (headerMatch) {
            result.push(
                <span
                    key={`h-${lineIdx}`}
                    className="block text-lg font-semibold text-slate-100 mt-4 mb-1"
                >
                    {renderInlineFormatting(headerMatch[1], lineIdx)}
                </span>
            );
            return;
        }

        // Check for bullet point (* or -)
        const bulletMatch = line.match(/^[\*\-]\s+(.+)/);
        if (bulletMatch) {
            result.push(
                <span
                    key={`li-${lineIdx}`}
                    className="flex gap-2 ml-1 my-0.5"
                >
                    <span className="text-blue-400 mt-0.5 select-none">•</span>
                    <span>{renderInlineFormatting(bulletMatch[1], lineIdx)}</span>
                </span>
            );
            return;
        }

        // Regular line — apply inline formatting
        result.push(...renderInlineFormatting(line, lineIdx));
    });

    return result;
}

/**
 * Handles inline formatting: **bold** and [Source: ...] references.
 */
function renderInlineFormatting(text: string, keyPrefix: number): ReactNode[] {
    const parts = text.split(/(\*\*[^*]+?\*\*|\[Source:[^\]]+\])/gi);
    return parts.map((part, i) => {
        const key = `${keyPrefix}-${i}`;
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={key} className="font-semibold text-slate-100">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        if (/^\[Source:/i.test(part)) {
            return (
                <span
                    key={key}
                    className="inline-block my-1"
                    style={{ fontSize: "11px", color: "#64748b", whiteSpace: "nowrap" }}
                >
                    {part}
                </span>
            );
        }
        return <span key={key}>{part}</span>;
    });
}

interface MessageBubbleProps {
    message: ChatMessage;
    isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
    const isUser = message.role === "user";

    if (isUser) {
        return (
            <div className="flex flex-col items-end animate-fade-in">
                {/* Avatar row */}
                <div style={{ marginBottom: "10px" }} className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        You
                    </span>
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-300">
                        U
                    </div>
                </div>
                {/* Bubble */}
                <div style={{ padding: "12px 20px" }} className="bg-blue-600 text-white rounded-2xl rounded-tr-none max-w-xl shadow-lg shadow-blue-600/10">
                    <p className="text-base leading-relaxed">{renderFormattedContent(message.content)}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-start animate-fade-in">
            {/* Avatar row */}
            <div style={{ marginBottom: "10px" }} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
                    AI
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Assistant
                </span>
            </div>
            {/* Bubble */}
            <div style={{ padding: "16px 20px" }} className="bg-[#1e293b] border border-slate-700 rounded-2xl rounded-tl-none max-w-3xl shadow-sm">
                <div className="text-base leading-relaxed whitespace-pre-wrap text-slate-200">
                    {renderFormattedContent(message.content)}
                    {isStreaming && !message.content && (
                        <span className="inline-flex gap-1 ml-1">
                            <span
                                className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                                style={{ animationDelay: "0ms" }}
                            />
                            <span
                                className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                                style={{ animationDelay: "150ms" }}
                            />
                            <span
                                className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                                style={{ animationDelay: "300ms" }}
                            />
                        </span>
                    )}
                </div>

                {/* Citations */}
                {message.citations && message.citations.length > 0 && (
                    <Citation sources={message.citations} />
                )}
            </div>
        </div>
    );
}
