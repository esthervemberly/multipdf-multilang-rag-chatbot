"use client";

import { useState, useCallback } from "react";
import { ChatMessage, CitationSource, ChatEvent } from "@/lib/types";
import { sendChatMessage } from "@/lib/api";

export function useChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);

    const sendMessage = useCallback(
        async (query: string, documentIds?: string[]) => {
            // Add user message
            const userMessage: ChatMessage = { role: "user", content: query };
            setMessages((prev) => [...prev, userMessage]);
            setIsStreaming(true);

            // Prepare chat history (last 6 messages)
            const history = messages.slice(-6).map((m) => ({
                role: m.role,
                content: m.content,
            }));

            try {
                const response = await sendChatMessage(query, documentIds, history);

                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }

                const reader = response.body?.getReader();
                if (!reader) throw new Error("No response body");

                const decoder = new TextDecoder();
                let assistantContent = "";
                let citations: CitationSource[] = [];

                // Add empty assistant message
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: "", citations: [] },
                ]);

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const text = decoder.decode(value, { stream: true });
                    const lines = text.split("\n");

                    for (const line of lines) {
                        if (!line.startsWith("data: ")) continue;

                        try {
                            const event: ChatEvent = JSON.parse(line.slice(6));

                            if (event.type === "token" && event.content) {
                                assistantContent += event.content;
                                setMessages((prev) => {
                                    const updated = [...prev];
                                    updated[updated.length - 1] = {
                                        role: "assistant",
                                        content: assistantContent,
                                        citations,
                                    };
                                    return updated;
                                });
                            }

                            if (event.type === "citations" && event.sources) {
                                citations = event.sources;
                                setMessages((prev) => {
                                    const updated = [...prev];
                                    updated[updated.length - 1] = {
                                        role: "assistant",
                                        content: assistantContent,
                                        citations,
                                    };
                                    return updated;
                                });
                            }

                            if (event.type === "error" && event.content) {
                                assistantContent += `\n\n⚠️ Error: ${event.content}`;
                                setMessages((prev) => {
                                    const updated = [...prev];
                                    updated[updated.length - 1] = {
                                        role: "assistant",
                                        content: assistantContent,
                                        citations,
                                    };
                                    return updated;
                                });
                            }
                        } catch {
                            // Skip malformed JSON
                        }
                    }
                }
            } catch (error) {
                setMessages((prev) => [
                    ...prev.slice(0, -1),
                    {
                        role: "assistant",
                        content: `⚠️ Failed to get response: ${error instanceof Error ? error.message : "Unknown error"}`,
                    },
                ]);
            } finally {
                setIsStreaming(false);
            }
        },
        [messages]
    );

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    return { messages, isStreaming, sendMessage, clearMessages };
}
