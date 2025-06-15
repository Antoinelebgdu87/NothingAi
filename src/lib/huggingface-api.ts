// Hugging Face Inference API for Stable Diffusion
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

    // Prepare the request payload
    const payload = {
      inputs: prompt,
      parameters: {
        negative_prompt: negative_prompt || "blurry, bad quality, distorted",
        width,
        height,
        num_inference_steps,
        guidance_scale,
        ...(seed && { seed }),
      },
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authorization header if token is available
    if (this.apiToken) {
      headers["Authorization"] = `Bearer ${this.apiToken}`;
    }

    try {
      const response = await fetch(`${this.baseURL}/${model}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Erreur Hugging Face: ${response.status}`;

        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage += ` - ${errorJson.error}`;
          }
          if (errorJson.estimated_time) {
            errorMessage += ` (Temps d'attente estimé: ${errorJson.estimated_time}s)`;
          }
        } catch (e) {
          errorMessage += ` - ${errorText}`;
        }

        throw new Error(errorMessage);
      }

      const blob = await response.blob();

      // Create object URL for the image
      const imageUrl = URL.createObjectURL(blob);

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

      return generatedImage;
    } catch (error) {
      console.error("Erreur lors de la génération Hugging Face:", error);

      if (error instanceof Error) {
        if (error.message.includes("503")) {
          throw new Error(
            "Le modèle Hugging Face est en cours de chargement. Veuillez réessayer dans quelques instants.",
          );
        }
        if (error.message.includes("401") || error.message.includes("403")) {
          throw new Error(
            "Token d'API Hugging Face invalide. Veuillez configurer votre token dans les paramètres.",
          );
        }
        throw error;
      }

      throw new Error("Erreur inconnue lors de la génération d'image");
    }
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
        id: "stabilityai/stable-diffusion-xl-base-1.0",
        name: "SDXL Base 1.0",
        description: "Modèle XL pour des images de très haute résolution",
        type: "XL",
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
    ];
  }

  // Common image dimensions for Stable Diffusion
  getRecommendedDimensions() {
    return [
      { name: "SD Standard", width: 512, height: 512 },
      { name: "SD Portrait", width: 512, height: 768 },
      { name: "SD Paysage", width: 768, height: 512 },
      { name: "SDXL Carré", width: 1024, height: 1024 },
      { name: "SDXL Portrait", width: 768, height: 1344 },
      { name: "SDXL Paysage", width: 1344, height: 768 },
    ];
  }

  // Validate API token
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch("https://huggingface.co/api/whoami-v2", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Get model info
  async getModelInfo(modelId: string) {
    try {
      const response = await fetch(
        `https://huggingface.co/api/models/${modelId}`,
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
  return width % 64 === 0 && height % 64 === 0 && width >= 256 && height >= 256;
}

export function getOptimalSDDimensions(
  aspectRatio: "square" | "portrait" | "landscape",
  isXL: boolean = false,
): { width: number; height: number } {
  if (isXL) {
    switch (aspectRatio) {
      case "portrait":
        return { width: 768, height: 1344 };
      case "landscape":
        return { width: 1344, height: 768 };
      default:
        return { width: 1024, height: 1024 };
    }
  } else {
    switch (aspectRatio) {
      case "portrait":
        return { width: 512, height: 768 };
      case "landscape":
        return { width: 768, height: 512 };
      default:
        return { width: 512, height: 512 };
    }
  }
}

export default huggingFaceAPI;
