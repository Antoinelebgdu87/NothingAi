const OPENROUTER_API_KEY =
  "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";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: Message;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
  };
  top_provider: {
    max_completion_tokens?: number;
    is_moderated: boolean;
  };
  per_request_limits?: {
    prompt_tokens: string;
    completion_tokens: string;
  };
}

// Best unlimited free models - incredibly fast and powerful
export const RECOMMENDED_MODELS = {
  // Best free unlimited models - no credit usage
  free: [
    "meta-llama/llama-3.2-3b-instruct:free", // Ultra fast and smart
    "meta-llama/llama-3.2-1b-instruct:free", // Lightning fast
    "microsoft/phi-3-mini-128k-instruct:free", // Great for long context
    "huggingfaceh4/zephyr-7b-beta:free", // Creative and helpful
    "google/gemma-2-9b-it:free", // Google's powerful model
  ],
  // Premium models for special cases
  affordable: [
    "meta-llama/llama-3.1-8b-instruct",
    "google/gemma-2-9b-it",
    "anthropic/claude-3-haiku",
  ],
  // Advanced models
  premium: [
    "anthropic/claude-3.5-sonnet",
    "openai/gpt-4o",
    "google/gemini-pro-1.5",
  ],
} as const;

// Generous token limits for unlimited free models
export const TOKEN_LIMITS = {
  free: {
    max_tokens: 2048, // Generous for free unlimited models
    safe_limit: 1024,
  },
  affordable: {
    max_tokens: 2048,
    safe_limit: 1024,
  },
  premium: {
    max_tokens: 4096,
    safe_limit: 2048,
  },
} as const;

export class OpenRouterAPI {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || OPENROUTER_API_KEY;
    this.baseURL = OPENROUTER_BASE_URL;
  }

  private getModelTier(model: string): "free" | "affordable" | "premium" {
    if (RECOMMENDED_MODELS.free.includes(model as any)) return "free";
    if (RECOMMENDED_MODELS.affordable.includes(model as any))
      return "affordable";
    return "premium";
  }

  private getOptimalTokenLimit(model: string, requestedTokens: number): number {
    const tier = this.getModelTier(model);
    const limits = TOKEN_LIMITS[tier];

    // For free models, use generous limits since they're unlimited
    return Math.min(requestedTokens, limits.max_tokens);
  }

  private async handleApiError(
    error: any,
    model: string,
    originalTokens: number,
    attempt: number = 1,
  ): Promise<{ model: string; maxTokens: number } | null> {
    console.log("Gestion erreur API:", error);

    // Always try to fallback to the best free unlimited model
    if (attempt === 1) {
      const currentTier = this.getModelTier(model);
      if (currentTier !== "free") {
        const bestFreeModel = RECOMMENDED_MODELS.free[0]; // Best unlimited free model
        const freeTokens = TOKEN_LIMITS.free.max_tokens;
        console.log(`Fallback vers modèle gratuit illimité: ${bestFreeModel}`);
        return { model: bestFreeModel, maxTokens: freeTokens };
      }

      // If already on free model, try with reduced tokens
      const reducedTokens = Math.max(512, Math.floor(originalTokens * 0.7));
      console.log(`Retry avec tokens réduits: ${reducedTokens}`);
      return { model, maxTokens: reducedTokens };
    }

    return null;
  }

  async createChatCompletion(
    messages: Message[],
    model: string = RECOMMENDED_MODELS.free[0],
    options: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      stream?: boolean;
    } = {},
  ): Promise<ChatCompletionResponse> {
    let currentModel = model;
    let maxTokens = this.getOptimalTokenLimit(
      model,
      options.max_tokens ?? 1024,
    );

    // Try up to 3 times with different configurations
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(
          `Tentative ${attempt}: ${currentModel} avec ${maxTokens} tokens`,
        );

        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "NothingAI",
          },
          body: JSON.stringify({
            model: currentModel,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: maxTokens,
            top_p: options.top_p ?? 0.9,
            stream: options.stream ?? false,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));

          // Handle any API errors with intelligent fallback
          const fallback = await this.handleApiError(
            error,
            currentModel,
            maxTokens,
            attempt,
          );

          if (fallback) {
            currentModel = fallback.model;
            maxTokens = fallback.maxTokens;
            continue; // Try again with new parameters
          } else {
            throw new Error(
              `Erreur temporaire du service. Veuillez réessayer dans un moment.`,
            );
          }
        }

        const result = await response.json();
        console.log("Succès avec modèle ultra-rapide:", currentModel);
        return result;
      } catch (error) {
        console.error(`Tentative ${attempt} échouée:`, error);

        if (attempt === 3) {
          throw new Error(
            "Service temporairement indisponible. Veuillez réessayer.",
          );
        }

        // Wait a bit before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    throw new Error("Échec après toutes les tentatives");
  }

  async createStreamingChatCompletion(
    messages: Message[],
    model: string = RECOMMENDED_MODELS.free[0],
    options: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      onToken?: (token: string) => void;
      onComplete?: (fullResponse: string) => void;
      onError?: (error: Error) => void;
    } = {},
  ): Promise<void> {
    let currentModel = model;
    let maxTokens = this.getOptimalTokenLimit(
      model,
      options.max_tokens ?? 1024,
    );

    // Try up to 3 times with different configurations
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(
          `Stream tentative ${attempt}: ${currentModel} avec ${maxTokens} tokens`,
        );

        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "NothingAI",
          },
          body: JSON.stringify({
            model: currentModel,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: maxTokens,
            top_p: options.top_p ?? 0.9,
            stream: true,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let error;
          try {
            error = JSON.parse(errorText);
          } catch {
            error = { error: { message: errorText } };
          }

          // Handle any API errors with intelligent fallback
          const fallback = await this.handleApiError(
            error,
            currentModel,
            maxTokens,
            attempt,
          );

          if (fallback) {
            currentModel = fallback.model;
            maxTokens = fallback.maxTokens;
            continue; // Try again with new parameters
          } else {
            const errorMsg = new Error(
              "Service temporairement indisponible. Réessayez dans un moment.",
            );
            options.onError?.(errorMsg);
            return;
          }
        }

        // Stream processing
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Failed to get response reader");
        }

        const decoder = new TextDecoder();
        let fullResponse = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  options.onComplete?.(fullResponse);
                  console.log(
                    "Stream complété avec modèle ultra-rapide:",
                    currentModel,
                  );
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullResponse += content;
                    options.onToken?.(content);
                  }
                } catch (e) {
                  // Ignore parsing errors for incomplete chunks
                }
              }
            }
          }
        } catch (error) {
          options.onError?.(error as Error);
          return;
        }

        // If we reach here, streaming was successful
        return;
      } catch (error) {
        console.error(`Stream tentative ${attempt} échouée:`, error);

        if (attempt === 3) {
          options.onError?.(
            new Error("Service temporairement indisponible. Réessayez."),
          );
          return;
        }

        // Wait a bit before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  async getModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        console.warn("Impossible de récupérer la liste des modèles");
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.warn("Erreur lors de la récupération des modèles:", error);
      return [];
    }
  }

  async getModelInfo(modelId: string): Promise<ModelInfo> {
    const models = await this.getModels();
    const model = models.find((m) => m.id === modelId);

    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    return model;
  }
}

// Create a singleton instance
export const openRouter = new OpenRouterAPI();

// Utility function to get model by category optimized for free unlimited usage
export function getModelByCategory(
  category: keyof typeof RECOMMENDED_MODELS,
  index: number = 0,
): string {
  return RECOMMENDED_MODELS[category][index] || RECOMMENDED_MODELS.free[0];
}

// Utility function to get optimal token limit for unlimited free models
export function getSafeTokenLimit(
  model: string,
  requestedTokens: number = 1024,
): number {
  const tier = RECOMMENDED_MODELS.free.includes(model as any)
    ? "free"
    : RECOMMENDED_MODELS.affordable.includes(model as any)
      ? "affordable"
      : "premium";

  const limits = TOKEN_LIMITS[tier];
  return Math.min(requestedTokens, limits.max_tokens);
}

// Utility function to estimate cost (all free models cost nothing!)
export function estimateTokenCost(tokens: number, model: string): number {
  if (RECOMMENDED_MODELS.free.includes(model as any)) return 0; // Free unlimited!

  // This is a simplified estimation for paid models
  const baseCostPer1kTokens = RECOMMENDED_MODELS.affordable.includes(
    model as any,
  )
    ? 0.001
    : 0.01;
  return (tokens / 1000) * baseCostPer1kTokens;
}

export default openRouter;
