"use client";

import { useState, useCallback } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { useChat } from "@/lib/hooks/useChat";
import { useUpload } from "@/lib/hooks/useUpload";
import { useDocuments } from "@/lib/hooks/useDocuments";

export default function Home() {
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const { documents, refresh } = useDocuments();
  const { messages, isStreaming, sendMessage, clearMessages } = useChat();
  const { upload, isUploading, error: uploadError } = useUpload(refresh);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }, []);

  const handleSendMessage = useCallback(
    (message: string) => {
      const ids = selectedDocIds.length > 0 ? selectedDocIds : undefined;
      sendMessage(message, ids);
    },
    [sendMessage, selectedDocIds]
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        documents={documents}
        selectedIds={selectedDocIds}
        onToggleSelect={handleToggleSelect}
        onRefresh={refresh}
        onUpload={upload}
        isUploading={isUploading}
        uploadError={uploadError}
      />

      {/* Main chat area */}
      <main className="flex-1 flex flex-col relative bg-[#0f172a]">
        <ChatContainer
          messages={messages}
          isStreaming={isStreaming}
          onSendMessage={handleSendMessage}
          onClear={clearMessages}
        />
      </main>
    </div>
  );
}
