"use client";

import { useRef, useEffect } from "react";
import { ChatMessage } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
    messages: ChatMessage[];
    isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isStreaming]);

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-10">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 mb-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-5xl text-blue-400 leading-none">
                            bolt
                        </span>
                    </div>
                    <h3 className="text-2xl font-semibold text-slate-200 mb-3">
                        Chat with your PDFs
                    </h3>
                    <p className="text-slate-400 text-base max-w-md">
                        Upload PDF documents and ask questions. The AI will
                        answer with citations from your documents.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: "20px 28px" }} className="flex-1 overflow-y-auto space-y-6">
            {messages.map((msg, idx) => (
                <MessageBubble
                    key={idx}
                    message={msg}
                    isStreaming={
                        isStreaming &&
                        idx === messages.length - 1 &&
                        msg.role === "assistant"
                    }
                />
            ))}
            <div ref={bottomRef} />
        </div>
    );
}
