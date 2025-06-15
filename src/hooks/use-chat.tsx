import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  openRouter,
  type Message,
  RECOMMENDED_MODELS,
  getModelByCategory,
  getSafeTokenLimit,
  TOKEN_LIMITS,
} from "@/lib/openrouter";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useImageAnalysis } from "@/hooks/use-image-analysis";
import { useImageGeneration } from "@/hooks/use-image-generation";
import { ImageGenerationAPI } from "@/lib/image-generation";
import { toast } from "sonner";

export interface ChatMessage extends Message {
  id: string;
  timestamp: Date;
  isStreaming?: boolean;
  model?: string;
  images?: Array<{ url: string; name: string }>;
  generatedImage?: {
    url: string;
    prompt: string;
    model: string;
  };
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
  maxTokens: 512, // Start with conservative limit
  systemMessage:
    "Tu es NothingAI, un assistant IA français avancé créé pour être utile, inoffensif et honnête. Tu es intelligent, créatif et tu t'efforces de fournir la meilleure assistance possible aux utilisateurs. Tu peux analyser des images et aussi générer des images sur demande. Quand un utilisateur demande une image (ex: 'génère une image de...', 'crée une photo de...', etc.), tu peux automatiquement générer l'image demandée. Sois concis mais informatif dans tes réponses. Sois toujours respectueux et professionnel. Réponds en français.",
};

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "👋 Bienvenue sur **NothingAI** ! Je suis votre assistant IA français avancé.\n\nJe peux vous aider avec :\n- ✨ Questions et conversations\n- 🧠 Résolution de problèmes\n- 💻 Programmation et technique\n- 📚 Recherche et explications\n- 🖼️ **Analyse d'images** (cliquez sur 📎)\n- 🎨 **Génération d'images** (dites 'génère une image de...')\n\n💡 **Astuce** : J'utilise des réponses optimisées pour économiser vos crédits OpenRouter !\n\nQue puis-je faire pour vous ?",
  timestamp: new Date(),
  model: "system",
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    DEFAULT_WELCOME_MESSAGE,
  ]);
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [isStreaming, setIsStreaming] = useState(false);
  const [creditWarning, setCreditWarning] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Local storage integration
  const {
    conversations,
    currentConversationId,
    autoSaveConversation,
    loadConversation,
    startNewConversation,
    deleteConversation,
    exportConversation,
    getStats,
    clearAllData,
  } = useLocalStorage();

  // Image analysis integration
  const imageAnalysis = useImageAnalysis();

  // Image generation integration
  const imageGeneration = useImageGeneration();

  // Auto-save messages when they change
  useEffect(() => {
    if (messages.length > 1) {
      // Only save if there are real messages beyond welcome
      const realMessages = messages.filter((msg) => msg.id !== "welcome");
      if (realMessages.length > 0) {
        autoSaveConversation(messages, settings);
      }
    }
  }, [messages, settings, autoSaveConversation]);

  // Check credit status periodically
  useEffect(() => {
    const checkCredits = async () => {
      try {
        const status = await openRouter.getCreditStatus();
        if (status.credits < 1000 && !status.unlimited) {
          setCreditWarning(true);
        }
      } catch (error) {
        // Ignore credit check errors
      }
    };

    checkCredits();
    const interval = setInterval(checkCredits, 300000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Get available models
  const { data: availableModels = [], isLoading: modelsLoading } = useQuery({
    queryKey: ["openrouter-models"],
    queryFn: () => openRouter.getModels(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
    onError: (error) => {
      console.error("Failed to fetch models:", error);
      toast.error("Échec du chargement des modèles disponibles");
    },
  });

  // Send message mutation with credit-aware handling
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: imageAnalysis.formatImagePrompt(content),
        timestamp: new Date(),
        images: imageAnalysis.hasImages
          ? imageAnalysis.uploadedImages.map((img) => ({
              url: img.url,
              name: img.name,
            }))
          : undefined,
      };

      // Add user message immediately
      setMessages((prev) => [...prev, userMessage]);

      // Check if this is an image generation request
      const isImageRequest =
        imageGeneration.detectImageGenerationIntent(content);

      if (isImageRequest) {
        // Handle image generation request
        const assistantMessageId = `assistant-${Date.now()}`;
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: "assistant",
          content: "🎨 Je génère votre image, veuillez patienter...",
          timestamp: new Date(),
          isStreaming: true,
          model: "image-generation",
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setIsStreaming(true);

        try {
          const response = await imageGeneration.generateImageResponse(content);

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: response.text,
                    isStreaming: false,
                    generatedImage: response.image
                      ? {
                          url: response.image.url,
                          prompt: response.image.prompt,
                          model: response.image.model,
                        }
                      : undefined,
                  }
                : msg,
            ),
          );
          setIsStreaming(false);
          return;
        } catch (error) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content:
                      "Désolé, je n'ai pas pu générer l'image demandée. Veuillez réessayer.",
                    isStreaming: false,
                  }
                : msg,
            ),
          );
          setIsStreaming(false);
          throw error;
        }
      } else {
        // Handle regular chat message with credit-aware settings
        const systemMessage: Message = {
          role: "system",
          content: settings.systemMessage,
        };

        // Use safe token limit based on current model
        const safeMaxTokens = getSafeTokenLimit(
          settings.model,
          settings.maxTokens,
        );

        // Prepare conversation messages with length limits for credit conservation
        const conversationMessages: Message[] = [systemMessage];

        // Add previous messages (excluding welcome) but limit history for credit conservation
        const previousMessages = messages
          .filter((m) => m.role !== "system" && m.id !== "welcome")
          .slice(-6) // Keep only last 6 messages to save tokens
          .map((m) => ({ role: m.role, content: m.content }));

        conversationMessages.push(...previousMessages);

        // Add current user message
        if (imageAnalysis.hasImages) {
          // For vision models, we need to format the message differently
          const imageContent = await imageAnalysis.getImagesForAPI();
          conversationMessages.push({
            role: "user",
            content: [{ type: "text", text: content }, ...imageContent] as any,
          });
        } else {
          conversationMessages.push({ role: "user", content });
        }

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
          // Use vision-capable model if images are present
          const modelToUse = imageAnalysis.hasImages
            ? "anthropic/claude-3-haiku" // Use cheaper vision model to save credits
            : settings.model;

          openRouter.createStreamingChatCompletion(
            conversationMessages,
            modelToUse,
            {
              temperature: settings.temperature,
              max_tokens: safeMaxTokens, // Use safe token limit
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
                      ? {
                          ...msg,
                          content: response,
                          isStreaming: false,
                          model: modelToUse,
                        }
                      : msg,
                  ),
                );
                setIsStreaming(false);

                // Clear images after successful response
                if (imageAnalysis.hasImages) {
                  imageAnalysis.clearAllImages();
                  toast.success("Images analysées avec succès !");
                }

                resolve();
              },
              onError: (error: Error) => {
                setMessages((prev) =>
                  prev.filter((msg) => msg.id !== assistantMessageId),
                );
                setIsStreaming(false);

                // Handle credit-specific errors
                if (
                  error.message.includes("crédits") ||
                  error.message.includes("credits")
                ) {
                  setCreditWarning(true);
                  toast.error(
                    "Crédits OpenRouter faibles. Utilisation de paramètres économiques.",
                    { duration: 5000 },
                  );
                } else {
                  toast.error(`Erreur: ${error.message}`);
                }
                reject(error);
              },
            },
          );
        });
      }
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

    toast.info("Génération arrêtée");
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    imageAnalysis.clearAllImages();
    startNewConversation();
  }, [imageAnalysis, startNewConversation]);

  const updateSettings = useCallback((newSettings: Partial<ChatSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };

      // Auto-adjust max tokens based on model change
      if (newSettings.model && newSettings.model !== prev.model) {
        const safeTokens = getSafeTokenLimit(
          newSettings.model,
          updated.maxTokens,
        );
        updated.maxTokens = safeTokens;

        // Show info about token adjustment
        if (safeTokens < updated.maxTokens) {
          toast.info(
            `Tokens ajustés à ${safeTokens} pour économiser vos crédits`,
            { duration: 3000 },
          );
        }
      }

      return updated;
    });
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
    if (currentConversationId) {
      exportConversation(currentConversationId);
    } else {
      // Export current session
      const chatData = {
        messages: messages.filter((m) => m.id !== "welcome"),
        settings,
        timestamp: new Date().toISOString(),
        application: "NothingAI",
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

      toast.success("Chat exporté avec succès !");
    }
  }, [currentConversationId, exportConversation, messages, settings]);

  const loadConversationById = useCallback(
    (id: string) => {
      const conversation = loadConversation(id);
      if (conversation) {
        setMessages([DEFAULT_WELCOME_MESSAGE, ...conversation.messages]);
        setSettings(conversation.settings);
        imageAnalysis.clearAllImages();
        toast.success("Conversation chargée !");
      }
    },
    [loadConversation, imageAnalysis],
  );

  // Get recommended models by category with token limits
  const recommendedModels = {
    free: RECOMMENDED_MODELS.free,
    affordable: RECOMMENDED_MODELS.affordable,
    premium: RECOMMENDED_MODELS.premium,
  };

  // Get token limits for current model
  const getTokenLimitsForCurrentModel = useCallback(() => {
    const tier = RECOMMENDED_MODELS.free.includes(settings.model as any)
      ? "free"
      : RECOMMENDED_MODELS.affordable.includes(settings.model as any)
        ? "affordable"
        : "premium";
    return TOKEN_LIMITS[tier];
  }, [settings.model]);

  return {
    messages,
    settings,
    isStreaming,
    isLoading: sendMessageMutation.isPending,
    availableModels,
    modelsLoading,
    recommendedModels,
    creditWarning,
    sendMessage,
    stopGeneration,
    clearMessages,
    updateSettings,
    regenerateLastMessage,
    exportChat,
    error: sendMessageMutation.error,
    // Local storage features
    conversations,
    currentConversationId,
    loadConversationById,
    deleteConversation,
    getStats,
    clearAllData,
    // Image analysis features
    imageAnalysis,
    // Image generation features
    imageGeneration,
    // Token management
    getTokenLimitsForCurrentModel,
    getSafeTokenLimit: (tokens: number) =>
      getSafeTokenLimit(settings.model, tokens),
  };
}

export default useChat;
