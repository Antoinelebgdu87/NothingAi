import { useState, useEffect, useCallback } from "react";
import type { ChatMessage, ChatSettings } from "@/hooks/use-chat";

interface StoredConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  settings: ChatSettings;
  createdAt: Date;
  updatedAt: Date;
}

const STORAGE_KEYS = {
  CONVERSATIONS: "nothingai_conversations",
  CURRENT_CONVERSATION: "nothingai_current_conversation",
  SETTINGS: "nothingai_settings",
} as const;

export function useLocalStorage() {
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);

  // Load conversations from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (stored) {
        const parsed = JSON.parse(stored).map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setConversations(parsed);
      }

      const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_CONVERSATION);
      setCurrentConversationId(currentId);
    } catch (error) {
      console.error("Erreur lors du chargement des conversations:", error);
    }
  }, []);

  // Save conversations to localStorage
  const saveConversations = useCallback((convs: StoredConversation[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(convs));
      setConversations(convs);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  }, []);

  // Create a new conversation
  const createConversation = useCallback(
    (
      messages: ChatMessage[],
      settings: ChatSettings,
      title?: string,
    ): string => {
      const id = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const newConversation: StoredConversation = {
        id,
        title: title || generateConversationTitle(messages),
        messages: messages.filter((msg) => msg.id !== "welcome"), // Exclude welcome message
        settings,
        createdAt: now,
        updatedAt: now,
      };

      const updatedConversations = [newConversation, ...conversations];
      saveConversations(updatedConversations);
      setCurrentConversationId(id);
      localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION, id);

      return id;
    },
    [conversations, saveConversations],
  );

  // Update existing conversation
  const updateConversation = useCallback(
    (id: string, messages: ChatMessage[], settings: ChatSettings) => {
      const updatedConversations = conversations.map((conv) => {
        if (conv.id === id) {
          return {
            ...conv,
            messages: messages.filter((msg) => msg.id !== "welcome"),
            settings,
            updatedAt: new Date(),
          };
        }
        return conv;
      });

      saveConversations(updatedConversations);
    },
    [conversations, saveConversations],
  );

  // Auto-save current conversation
  const autoSaveConversation = useCallback(
    (messages: ChatMessage[], settings: ChatSettings) => {
      // Only save if there are actual messages (more than just welcome)
      const realMessages = messages.filter((msg) => msg.id !== "welcome");
      if (realMessages.length === 0) return;

      if (currentConversationId) {
        updateConversation(currentConversationId, messages, settings);
      } else {
        // Create new conversation if messages exist
        if (realMessages.length > 0) {
          createConversation(messages, settings);
        }
      }
    },
    [currentConversationId, updateConversation, createConversation],
  );

  // Load a conversation
  const loadConversation = useCallback(
    (id: string): StoredConversation | null => {
      const conversation = conversations.find((conv) => conv.id === id);
      if (conversation) {
        setCurrentConversationId(id);
        localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION, id);
        return conversation;
      }
      return null;
    },
    [conversations],
  );

  // Delete a conversation
  const deleteConversation = useCallback(
    (id: string) => {
      const updatedConversations = conversations.filter(
        (conv) => conv.id !== id,
      );
      saveConversations(updatedConversations);

      if (currentConversationId === id) {
        setCurrentConversationId(null);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_CONVERSATION);
      }
    },
    [conversations, currentConversationId, saveConversations],
  );

  // Start new conversation
  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_CONVERSATION);
  }, []);

  // Export conversation
  const exportConversation = useCallback(
    (id: string) => {
      const conversation = conversations.find((conv) => conv.id === id);
      if (!conversation) return;

      const exportData = {
        ...conversation,
        exportedAt: new Date().toISOString(),
        application: "NothingAI",
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nothingai-${conversation.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${conversation.createdAt.toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [conversations],
  );

  // Get conversation statistics
  const getStats = useCallback(() => {
    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce(
      (sum, conv) => sum + conv.messages.length,
      0,
    );
    const oldestConversation =
      conversations.length > 0
        ? conversations.reduce((oldest, conv) =>
            conv.createdAt < oldest.createdAt ? conv : oldest,
          ).createdAt
        : null;

    return {
      totalConversations,
      totalMessages,
      oldestConversation,
    };
  }, [conversations]);

  // Clear all data
  const clearAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_CONVERSATION);
    setConversations([]);
    setCurrentConversationId(null);
  }, []);

  return {
    conversations,
    currentConversationId,
    createConversation,
    updateConversation,
    autoSaveConversation,
    loadConversation,
    deleteConversation,
    startNewConversation,
    exportConversation,
    getStats,
    clearAllData,
  };
}

// Helper function to generate conversation titles
function generateConversationTitle(messages: ChatMessage[]): string {
  const userMessages = messages.filter(
    (msg) => msg.role === "user" && msg.id !== "welcome",
  );

  if (userMessages.length === 0) {
    return "Nouvelle conversation";
  }

  const firstMessage = userMessages[0].content;

  // Extract first few words for title
  const words = firstMessage.split(" ").slice(0, 6).join(" ");
  const title = words.length > 50 ? words.substring(0, 47) + "..." : words;

  return title || "Nouvelle conversation";
}

export default useLocalStorage;
