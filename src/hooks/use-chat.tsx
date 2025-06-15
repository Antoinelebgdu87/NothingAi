import { useState, useCallback, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  openRouter,
  type Message,
  RECOMMENDED_MODELS,
  getModelByCategory,
} from "@/lib/openrouter";
import { toast } from "sonner";

export interface ChatMessage extends Message {
  id: string;
  timestamp: Date;
  isStreaming?: boolean;
  model?: string;
}

export interface ChatSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  systemMessage: string;
}

const DEFAULT_SETTINGS: ChatSettings = {
  model: getModelByCategory("free", 0),
  temperature: 0.7,
  maxTokens: 2048,
  systemMessage:
    "You are NothingAI, an advanced AI assistant created to be helpful, harmless, and honest. You are knowledgeable, creative, and strive to provide the best possible assistance to users. Always be respectful and professional in your responses.",
};

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "👋 Welcome to **NothingAI**! I'm your advanced AI assistant, powered by cutting-edge language models.\n\nI can help you with:\n- ✨ Creative writing and brainstorming\n- 🧠 Problem-solving and analysis  \n- 💻 Programming and technical questions\n- 📚 Research and explanations\n- 🎨 And much more!\n\nWhat would you like to explore today?",
  timestamp: new Date(),
  model: "system",
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    DEFAULT_WELCOME_MESSAGE,
  ]);
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get available models
  const { data: availableModels = [], isLoading: modelsLoading } = useQuery({
    queryKey: ["openrouter-models"],
    queryFn: () => openRouter.getModels(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
    onError: (error) => {
      console.error("Failed to fetch models:", error);
      toast.error("Failed to load available models");
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };

      // Add user message immediately
      setMessages((prev) => [...prev, userMessage]);

      // Prepare messages for API
      const systemMessage: Message = {
        role: "system",
        content: settings.systemMessage,
      };

      const conversationMessages: Message[] = [
        systemMessage,
        ...messages
          .filter((m) => m.role !== "system" && m.id !== "welcome")
          .map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content },
      ];

      // Create assistant message placeholder
      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
        model: settings.model,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsStreaming(true);

      let fullResponse = "";

      return new Promise<void>((resolve, reject) => {
        openRouter.createStreamingChatCompletion(
          conversationMessages,
          settings.model,
          {
            temperature: settings.temperature,
            max_tokens: settings.maxTokens,
            onToken: (token: string) => {
              fullResponse += token;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullResponse }
                    : msg,
                ),
              );
            },
            onComplete: (response: string) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: response, isStreaming: false }
                    : msg,
                ),
              );
              setIsStreaming(false);
              resolve();
            },
            onError: (error: Error) => {
              setMessages((prev) =>
                prev.filter((msg) => msg.id !== assistantMessageId),
              );
              setIsStreaming(false);
              toast.error(`Failed to send message: ${error.message}`);
              reject(error);
            },
          },
        );
      });
    },
  });

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || isStreaming) return;

      // Cancel any ongoing request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      sendMessageMutation.mutate(content);
    },
    [sendMessageMutation, isStreaming],
  );

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);

    // Remove the streaming message
    setMessages((prev) => prev.filter((msg) => !msg.isStreaming));

    toast.info("Generation stopped");
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<ChatSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const regenerateLastMessage = useCallback(() => {
    if (messages.length < 2) return;

    // Find the last user message
    const lastUserMessageIndex = [...messages]
      .reverse()
      .findIndex((m) => m.role === "user");
    if (lastUserMessageIndex === -1) return;

    const actualIndex = messages.length - 1 - lastUserMessageIndex;
    const lastUserMessage = messages[actualIndex];

    // Remove messages after the last user message
    setMessages((prev) => prev.slice(0, actualIndex + 1));

    // Resend the message
    sendMessage(lastUserMessage.content);
  }, [messages, sendMessage]);

  const exportChat = useCallback(() => {
    const chatData = {
      messages: messages.filter((m) => m.id !== "welcome"),
      settings,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nothingai-chat-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Chat exported successfully!");
  }, [messages, settings]);

  // Get recommended models by category
  const recommendedModels = {
    free: RECOMMENDED_MODELS.free,
    affordable: RECOMMENDED_MODELS.affordable,
    premium: RECOMMENDED_MODELS.premium,
  };

  return {
    messages,
    settings,
    isStreaming,
    isLoading: sendMessageMutation.isPending,
    availableModels,
    modelsLoading,
    recommendedModels,
    sendMessage,
    stopGeneration,
    clearMessages,
    updateSettings,
    regenerateLastMessage,
    exportChat,
    error: sendMessageMutation.error,
  };
}

export default useChat;
