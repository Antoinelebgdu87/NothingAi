// Hugging Face Inference API for Stable Diffusion with enhanced error handling
const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models";

// Free API key for demonstration - users can add their own
const DEFAULT_HF_TOKEN = ""; // Users can add their own token for better performance

export interface HuggingFaceRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  seed?: number;
}

export interface HuggingFaceImage {
  id: string;
  url: string;
  blob: Blob;
  prompt: string;
  model: string;
  timestamp: Date;
  width: number;
  height: number;
  settings: {
    negative_prompt?: string;
    num_inference_steps: number;
    guidance_scale: number;
    seed?: number;
  };
}

export class HuggingFaceAPI {
  private apiToken: string;
  private baseURL: string;
  private retryCount: number = 3;
  private retryDelay: number = 5000;

  constructor(apiToken?: string) {
    this.apiToken = apiToken || DEFAULT_HF_TOKEN;
    this.baseURL = HUGGINGFACE_API_URL;
  }

  async generateImage(
    request: HuggingFaceRequest,
    model: string = "stabilityai/stable-diffusion-2",
  ): Promise<HuggingFaceImage> {
    const {
      prompt,
      negative_prompt,
      width = 512,
      height = 512,
      num_inference_steps = 20,
      guidance_scale = 7.5,
      seed,
    } = request;

    // Validate parameters
    if (!prompt || prompt.trim().length === 0) {
      throw new Error("Le prompt ne peut pas être vide");
    }

    if (width % 64 !== 0 || height % 64 !== 0) {
      throw new Error(
        "Les dimensions doivent être des multiples de 64 pour Stable Diffusion",
      );
    }

    if (width < 256 || height < 256 || width > 1024 || height > 1024) {
      throw new Error(
        "Les dimensions doivent être entre 256x256 et 1024x1024 pixels",
      );
    }

    // Prepare the request payload
    const payload = {
      inputs: prompt,
      parameters: {
        negative_prompt:
          negative_prompt ||
          "blurry, bad quality, distorted, ugly, low resolution",
        width,
        height,
        num_inference_steps: Math.max(10, Math.min(50, num_inference_steps)),
        guidance_scale: Math.max(1, Math.min(20, guidance_scale)),
        ...(seed && { seed: Math.abs(Math.floor(seed)) }),
      },
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "NothingAI/1.0",
    };

    // Add authorization header if token is available
    if (this.apiToken) {
      headers["Authorization"] = `Bearer ${this.apiToken}`;
    }

    // Try to generate image with retries
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        console.log(
          `HF Tentative ${attempt}/${this.retryCount} - Modèle: ${model}`,
        );

        const response = await this.fetchWithTimeout(
          `${this.baseURL}/${model}`,
          {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          },
          60000, // 60 seconds timeout
        );

        if (!response.ok) {
          const errorText = await response.text();
          await this.handleAPIError(response.status, errorText, attempt);
          continue; // Try again
        }

        // Check content type
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.startsWith("image/")) {
          // If we get JSON, it might be an error or estimated time
          if (contentType?.includes("application/json")) {
            const errorData = await response.json();
            if (errorData.estimated_time) {
              const waitTime = Math.min(errorData.estimated_time * 1000, 30000);
              console.log(
                `Modèle en cours de chargement, attente de ${waitTime / 1000}s`,
              );
              await this.delay(waitTime);
              continue; // Try again
            }
            throw new Error(
              errorData.error || "Réponse inattendue de l'API Hugging Face",
            );
          }
          throw new Error(
            `Type de contenu invalide: ${contentType || "unknown"}`,
          );
        }

        // Get the blob
        const blob = await response.blob();

        // Validate blob
        if (blob.size === 0) {
          throw new Error("L'image générée est vide (0 octets)");
        }

        if (blob.size < 1000) {
          // Very small blob, probably an error
          throw new Error("L'image générée semble corrompue (trop petite)");
        }

        // Create object URL for the image
        const imageUrl = URL.createObjectURL(blob);

        // Verify the image loads correctly
        await this.verifyImageBlob(blob);

        const generatedImage: HuggingFaceImage = {
          id: `hf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: imageUrl,
          blob,
          prompt,
          model,
          timestamp: new Date(),
          width,
          height,
          settings: {
            negative_prompt,
            num_inference_steps,
            guidance_scale,
            seed,
          },
        };

        console.log("Image HF générée avec succès:", {
          id: generatedImage.id,
          size: `${blob.size} bytes`,
          dimensions: `${width}x${height}`,
        });

        return generatedImage;
      } catch (error) {
        console.error(`HF Tentative ${attempt} échouée:`, error);

        if (attempt === this.retryCount) {
          throw new Error(
            `Échec de la génération Hugging Face après ${this.retryCount} tentatives: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          );
        }

        // Wait before retry (exponential backoff)
        const waitTime = this.retryDelay * Math.pow(2, attempt - 1);
        await this.delay(waitTime);
      }
    }

    throw new Error("Échec de la génération d'image Hugging Face");
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number = 60000,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          "Timeout: La génération Stable Diffusion a pris trop de temps",
        );
      }
      throw error;
    }
  }

  private async handleAPIError(
    status: number,
    errorText: string,
    attempt: number,
  ): Promise<void> {
    let errorMessage = `Erreur Hugging Face ${status}`;

    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error) {
        errorMessage += ` - ${errorJson.error}`;
      }
      if (errorJson.estimated_time) {
        const waitTime = Math.min(errorJson.estimated_time * 1000, 30000);
        errorMessage += ` (Modèle en chargement, attente ${waitTime / 1000}s)`;
        await this.delay(waitTime);
        return; // Don't throw, let it retry
      }
    } catch (e) {
      errorMessage += ` - ${errorText}`;
    }

    // Handle specific errors
    if (status === 503) {
      const waitTime = 10000 * attempt; // Increase wait time with attempts
      console.log(`Service indisponible, attente de ${waitTime / 1000}s`);
      await this.delay(waitTime);
      return; // Don't throw, let it retry
    }

    if (status === 401 || status === 403) {
      throw new Error(
        "Token d'API Hugging Face invalide. Veuillez configurer votre token dans les paramètres.",
      );
    }

    if (status === 429) {
      const waitTime = 15000 * attempt; // Rate limit backoff
      console.log(`Rate limit atteint, attente de ${waitTime / 1000}s`);
      await this.delay(waitTime);
      return; // Don't throw, let it retry
    }

    throw new Error(errorMessage);
  }

  private async verifyImageBlob(blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const img = new Image();

        img.onload = () => {
          if (img.naturalWidth === 0 || img.naturalHeight === 0) {
            reject(new Error("L'image Hugging Face générée est invalide"));
          } else {
            resolve();
          }
        };

        img.onerror = () => {
          reject(new Error("Impossible de charger l'image Hugging Face"));
        };

        // Set timeout for image loading
        setTimeout(() => {
          reject(new Error("Timeout lors du chargement de l'image HF"));
        }, 10000);

        img.src = reader.result as string;
      };

      reader.onerror = () => {
        reject(new Error("Erreur lors de la lecture du blob"));
      };

      reader.readAsDataURL(blob);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Enhanced prompt for better Stable Diffusion results
  enhancePrompt(prompt: string): string {
    // Clean and enhance the prompt for Stable Diffusion
    const cleanPrompt = prompt
      .replace(
        /^(génère|créé|fais|dessine|imagine|montre)\s*(moi\s*)?(une?\s*)?/i,
        "",
      )
      .replace(
        /^(generate|create|make|draw|imagine|show)\s*(me\s*)?(an?\s*)?/i,
        "",
      )
      .trim();

    // Add quality enhancers specific to Stable Diffusion
    const sdEnhancers = [
      "highly detailed",
      "professional photography",
      "8k uhd",
      "masterpiece",
      "best quality",
      "sharp focus",
      "beautiful lighting",
      "intricate details",
    ];

    const randomEnhancer =
      sdEnhancers[Math.floor(Math.random() * sdEnhancers.length)];

    return `${cleanPrompt}, ${randomEnhancer}`;
  }

  // Get available Stable Diffusion models
  getAvailableModels() {
    return [
      {
        id: "stabilityai/stable-diffusion-2",
        name: "Stable Diffusion 2.0",
        description:
          "Modèle principal de Stability AI, polyvalent et de haute qualité",
        type: "Base",
      },
      {
        id: "stabilityai/stable-diffusion-2-1",
        name: "Stable Diffusion 2.1",
        description: "Version améliorée avec de meilleurs résultats",
        type: "Base",
      },
      {
        id: "runwayml/stable-diffusion-v1-5",
        name: "Stable Diffusion 1.5",
        description: "Version classique et fiable",
        type: "Base",
      },
      {
        id: "prompthero/openjourney-v4",
        name: "OpenJourney v4",
        description: "Style artistique inspiré de Midjourney",
        type: "Artistique",
      },
      {
        id: "wavymulder/Analog-Diffusion",
        name: "Analog Diffusion",
        description: "Style photo analogique vintage",
        type: "Style",
      },
      {
        id: "dreamlike-art/dreamlike-diffusion-1.0",
        name: "Dreamlike Diffusion",
        description: "Style onirique et artistique",
        type: "Artistique",
      },
    ];
  }

  // Common image dimensions for Stable Diffusion
  getRecommendedDimensions() {
    return [
      { name: "SD Standard", width: 512, height: 512 },
      { name: "SD Portrait", width: 512, height: 768 },
      { name: "SD Paysage", width: 768, height: 512 },
      { name: "SD Tall", width: 448, height: 832 },
      { name: "SD Wide", width: 832, height: 448 },
      { name: "SD Square HD", width: 640, height: 640 },
    ];
  }

  // Validate API token
  async validateToken(token: string): Promise<boolean> {
    if (!token || token.trim().length === 0) return false;

    try {
      const response = await fetch("https://huggingface.co/api/whoami-v2", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      return response.ok;
    } catch (error) {
      console.error("Token validation failed:", error);
      return false;
    }
  }

  // Get model info
  async getModelInfo(modelId: string) {
    try {
      const response = await fetch(
        `https://huggingface.co/api/models/${modelId}`,
        {
          signal: AbortSignal.timeout(5000), // 5 second timeout
        },
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Impossible de récupérer les infos du modèle:", modelId);
    }
    return null;
  }
}

// Create singleton instance
export const huggingFaceAPI = new HuggingFaceAPI();

// Utility functions
export function isValidSDDimension(width: number, height: number): boolean {
  // Stable Diffusion works best with dimensions that are multiples of 64
  return (
    width % 64 === 0 &&
    height % 64 === 0 &&
    width >= 256 &&
    height >= 256 &&
    width <= 1024 &&
    height <= 1024
  );
}

export function getOptimalSDDimensions(
  aspectRatio: "square" | "portrait" | "landscape",
): { width: number; height: number } {
  switch (aspectRatio) {
    case "portrait":
      return { width: 512, height: 768 };
    case "landscape":
      return { width: 768, height: 512 };
    default:
      return { width: 512, height: 512 };
  }
}

export default huggingFaceAPI;
