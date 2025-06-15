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

// Best free/affordable models for different use cases
export const RECOMMENDED_MODELS = {
  // Best free models
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

export class OpenRouterAPI {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || OPENROUTER_API_KEY;
    this.baseURL = OPENROUTER_BASE_URL;
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
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "NothingAI",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 2048,
        top_p: options.top_p ?? 0.9,
        stream: options.stream ?? false,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `OpenRouter API Error: ${response.status} - ${error.error?.message || response.statusText}`,
      );
    }

    return response.json();
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
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "NothingAI",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 2048,
        top_p: options.top_p ?? 0.9,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMsg = new Error(
        `OpenRouter API Error: ${response.status} - ${error.error?.message || response.statusText}`,
      );
      options.onError?.(errorMsg);
      throw errorMsg;
    }

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
      throw error;
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
}

// Create a singleton instance
export const openRouter = new OpenRouterAPI();

// Utility function to get model by category
export function getModelByCategory(
  category: keyof typeof RECOMMENDED_MODELS,
  index: number = 0,
): string {
  return RECOMMENDED_MODELS[category][index] || RECOMMENDED_MODELS.free[0];
}

// Utility function to estimate cost (approximate)
export function estimateTokenCost(tokens: number, model: string): number {
  // This is a simplified estimation - real costs vary by model
  const baseCostPer1kTokens = model.includes("free") ? 0 : 0.001;
  return (tokens / 1000) * baseCostPer1kTokens;
}

export default openRouter;
