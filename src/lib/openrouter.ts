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

// Best free/affordable models for different use cases with conservative token limits
export const RECOMMENDED_MODELS = {
  // Best free models with low token usage
  free: [
    "meta-llama/llama-3.2-3b-instruct:free",
    "microsoft/phi-3-mini-128k-instruct:free",
    "huggingfaceh4/zephyr-7b-beta:free",
  ],
  // Best affordable premium models
  affordable: [
    "meta-llama/llama-3.1-8b-instruct",
    "google/gemma-2-9b-it",
    "anthropic/claude-3-haiku",
  ],
  // Best premium models for advanced tasks
  premium: [
    "anthropic/claude-3.5-sonnet",
    "openai/gpt-4o",
    "google/gemini-pro-1.5",
  ],
} as const;

// Conservative token limits for different model tiers
export const TOKEN_LIMITS = {
  free: {
    max_tokens: 512, // Very conservative for free models
    safe_limit: 256,
  },
  affordable: {
    max_tokens: 1024, // Moderate for affordable models
    safe_limit: 512,
  },
  premium: {
    max_tokens: 2048, // Higher for premium models
    safe_limit: 1024,
  },
} as const;

export class OpenRouterAPI {
  private apiKey: string;
  private baseURL: string;
  private remainingCredits: number | null = null;

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

    // If we have credit info and it's low, use safe limit
    if (this.remainingCredits !== null && this.remainingCredits < 2000) {
      return Math.min(requestedTokens, limits.safe_limit);
    }

    return Math.min(requestedTokens, limits.max_tokens);
  }

  private async handleCreditError(
    error: any,
    model: string,
    originalTokens: number,
    attempt: number = 1,
  ): Promise<{ model: string; maxTokens: number } | null> {
    console.log("Gestion erreur crédit:", error);

    // Extract available credits from error message
    const message = error.error?.message || "";
    const creditMatch = message.match(/can only afford (\d+)/);
    if (creditMatch) {
      const availableCredits = parseInt(creditMatch[1]);
      this.remainingCredits = availableCredits;
      console.log(`Crédits disponibles: ${availableCredits}`);

      // Calculate safe token limit based on available credits
      const safeTokens = Math.max(100, Math.floor(availableCredits * 0.8));

      if (safeTokens >= 100) {
        console.log(`Retry avec ${safeTokens} tokens`);
        return { model, maxTokens: safeTokens };
      }
    }

    // If we can't use the current model, try to fallback to a free model
    if (attempt === 1) {
      const currentTier = this.getModelTier(model);
      if (currentTier !== "free") {
        const freeModel = RECOMMENDED_MODELS.free[0];
        const freeTokens = TOKEN_LIMITS.free.safe_limit;
        console.log(`Fallback vers modèle gratuit: ${freeModel}`);
        return { model: freeModel, maxTokens: freeTokens };
      }
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

          // Handle credit errors specifically
          if (response.status === 402 || error.error?.code === 402) {
            const fallback = await this.handleCreditError(
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
                "Crédits OpenRouter épuisés. Veuillez recharger votre compte ou utiliser un modèle gratuit.",
              );
            }
          }

          // Handle other errors
          throw new Error(
            `OpenRouter API Error: ${response.status} - ${error.error?.message || response.statusText}`,
          );
        }

        const result = await response.json();
        console.log("Succès avec:", currentModel, maxTokens, "tokens");
        return result;
      } catch (error) {
        console.error(`Tentative ${attempt} échouée:`, error);

        if (attempt === 3) {
          throw error; // Re-throw on final attempt
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

          // Handle credit errors specifically
          if (response.status === 402 || error.error?.code === 402) {
            const fallback = await this.handleCreditError(
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
                "Crédits OpenRouter épuisés. Basculement vers un modèle gratuit recommandé.",
              );
              options.onError?.(errorMsg);
              return;
            }
          }

          const errorMsg = new Error(
            `OpenRouter API Error: ${response.status} - ${error.error?.message || response.statusText}`,
          );
          options.onError?.(errorMsg);
          return;
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
                  console.log("Stream complété avec:", currentModel);
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
          options.onError?.(error as Error);
          return;
        }

        // Wait a bit before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  async getModels(): Promise<ModelInfo[]> {
    const response = await fetch(`${this.baseURL}/models`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  async getModelInfo(modelId: string): Promise<ModelInfo> {
    const models = await this.getModels();
    const model = models.find((m) => m.id === modelId);

    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    return model;
  }

  // Get current credit status
  async getCreditStatus(): Promise<{ credits: number; unlimited: boolean }> {
    try {
      const response = await fetch(`${this.baseURL}/auth/key`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          credits: data.data?.credit_balance || 0,
          unlimited: data.data?.rate_limit?.unlimited || false,
        };
      }
    } catch (error) {
      console.warn("Impossible de récupérer le statut des crédits:", error);
    }

    return { credits: 0, unlimited: false };
  }
}

// Create a singleton instance
export const openRouter = new OpenRouterAPI();

// Utility function to get model by category with credit awareness
export function getModelByCategory(
  category: keyof typeof RECOMMENDED_MODELS,
  index: number = 0,
): string {
  return RECOMMENDED_MODELS[category][index] || RECOMMENDED_MODELS.free[0];
}

// Utility function to get safe token limit for a model
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

// Utility function to estimate cost (approximate)
export function estimateTokenCost(tokens: number, model: string): number {
  if (RECOMMENDED_MODELS.free.includes(model as any)) return 0;

  // This is a simplified estimation - real costs vary by model
  const baseCostPer1kTokens = RECOMMENDED_MODELS.affordable.includes(
    model as any,
  )
    ? 0.001
    : 0.01;
  return (tokens / 1000) * baseCostPer1kTokens;
}

export default openRouter;
