"use client";

import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "@/lib/types";

interface ChatContainerProps {
    messages: ChatMessage[];
    isStreaming: boolean;
    onSendMessage: (message: string) => void;
    onClear: () => void;
}

export function ChatContainer({
    messages,
    isStreaming,
    onSendMessage,
    onClear,
}: ChatContainerProps) {
    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <header style={{ paddingLeft: "40px", paddingRight: "40px" }} className="h-16 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="material-symbols-outlined text-white text-xl">
                            bolt
                        </span>
                    </div>
                    <h2 className="font-semibold text-lg text-slate-200">
                        PDF Assistant
                    </h2>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={onClear}
                        className="text-xs font-medium text-slate-400 hover:text-blue-500 transition-colors flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-base">
                            delete_sweep
                        </span>
                        Clear Chat
                    </button>
                )}
            </header>

            {/* Messages */}
            <MessageList messages={messages} isStreaming={isStreaming} />

            {/* Input */}
            <ChatInput onSend={onSendMessage} disabled={isStreaming} />
        </div>
    );
}
