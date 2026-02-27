"use client";

import { useState, useRef, KeyboardEvent, useCallback } from "react";

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        const trimmed = value.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setValue("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInput = useCallback(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.max(56, textareaRef.current.scrollHeight)}px`;
        }
    }, []);

    return (
        <div style={{ padding: "24px 40px 24px 40px" }} className="bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent">
            <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", width: "100%" }}>
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onInput={handleInput}
                    placeholder="Ask a question about your documents..."
                    disabled={disabled}
                    rows={1}
                    style={{ flex: 1, minHeight: "56px", paddingLeft: "24px", paddingRight: "24px", paddingTop: "16px", paddingBottom: "16px", overflow: "hidden" }}
                    className="bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all shadow-xl placeholder-slate-500 text-base text-slate-100 disabled:opacity-50 resize-none"
                />
                <button
                    onClick={handleSend}
                    disabled={disabled || !value.trim()}
                    className="flex-shrink-0 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <span className="material-symbols-outlined text-xl">send</span>
                </button>
            </div>
            <p style={{ marginTop: "16px" }} className="text-center text-[11px] text-slate-500 uppercase tracking-[0.2em] font-medium">
                Powered by RAG
            </p>
        </div>
    );
}
