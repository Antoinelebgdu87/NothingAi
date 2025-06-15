// Pollinations.ai - Free image generation API with improved error handling and fallbacks
const POLLINATIONS_ENDPOINTS = [
  "https://image.pollinations.ai/prompt",
  "https://pollinations.ai/p", // Alternative endpoint
];

export interface ImageGenerationRequest {
  prompt: string;
  width?: number;
  height?: number;
  model?:
    | "flux"
    | "flux-realism"
    | "flux-anime"
    | "flux-3d"
    | "any-dark"
    | "turbo";
  enhance?: boolean;
  nologo?: boolean;
  private?: boolean;
  seed?: number;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
  width: number;
  height: number;
  model: string;
}

export class ImageGenerationAPI {
  private endpoints: string[];
  private retryCount: number = 3;
  private retryDelay: number = 2000;
  private currentEndpointIndex: number = 0;

  constructor() {
    this.endpoints = [...POLLINATIONS_ENDPOINTS];
  }

  async generateImage(
    request: ImageGenerationRequest,
  ): Promise<GeneratedImage> {
    const {
      prompt,
      width = 1024,
      height = 1024,
      model = "flux",
      enhance = true,
      nologo = true,
      private: isPrivate = false,
      seed,
    } = request;

    // Validate parameters
    if (!prompt || prompt.trim().length === 0) {
      throw new Error("Le prompt ne peut pas être vide");
    }

    if (width < 256 || height < 256 || width > 2048 || height > 2048) {
      throw new Error(
        "Les dimensions doivent être entre 256x256 et 2048x2048 pixels",
      );
    }

    // Clean and enhance the prompt for better results
    const enhancedPrompt = enhance ? this.enhancePrompt(prompt) : prompt;

    // Try each endpoint with retries
    let lastError: Error | null = null;

    for (
      let endpointIndex = 0;
      endpointIndex < this.endpoints.length;
      endpointIndex++
    ) {
      const baseURL = this.endpoints[endpointIndex];

      for (let attempt = 1; attempt <= this.retryCount; attempt++) {
        try {
          console.log(
            `🎨 Tentative ${attempt}/${this.retryCount} avec endpoint ${endpointIndex + 1}/${this.endpoints.length}`,
          );

          // Build URL with proper encoding
          const imageUrl = this.buildImageURL(baseURL, enhancedPrompt, {
            width,
            height,
            model,
            nologo,
            private: isPrivate,
            seed,
          });

          console.log(`🔗 URL générée:`, imageUrl);

          // Test if the image is accessible
          const response = await this.fetchWithTimeout(imageUrl, 45000);

          if (!response.ok) {
            throw new Error(
              `Erreur HTTP ${response.status}: ${response.statusText}`,
            );
          }

          // Check content type
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.startsWith("image/")) {
            throw new Error(
              `Type de contenu invalide: ${contentType || "unknown"}`,
            );
          }

          // Check content length
          const contentLength = response.headers.get("content-length");
          if (contentLength && parseInt(contentLength) === 0) {
            throw new Error("L'image générée est vide (0 octets)");
          }

          // For Pollinations, we don't need to verify loading as it's a direct URL
          // Just check if we can fetch it successfully

          const generatedImage: GeneratedImage = {
            id: `pol-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: imageUrl,
            prompt: enhancedPrompt,
            timestamp: new Date(),
            width,
            height,
            model,
          };

          console.log("✅ Image générée avec succès:", generatedImage);
          this.currentEndpointIndex = endpointIndex; // Remember successful endpoint
          return generatedImage;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.error(
            `❌ Tentative ${attempt} échouée (endpoint ${endpointIndex + 1}):`,
            lastError.message,
          );

          // If it's the last attempt for this endpoint, try next endpoint
          if (attempt === this.retryCount) {
            break;
          }

          // Wait before retry
          await this.delay(this.retryDelay);
        }
      }
    }

    // If all endpoints failed, throw the last error
    throw new Error(
      `Échec de la génération après avoir essayé tous les endpoints: ${lastError?.message || "Erreur inconnue"}`,
    );
  }

  private buildImageURL(
    baseURL: string,
    prompt: string,
    options: {
      width: number;
      height: number;
      model: string;
      nologo: boolean;
      private: boolean;
      seed?: number;
    },
  ): string {
    const { width, height, model, nologo, private: isPrivate, seed } = options;

    // Clean the prompt for URL encoding
    const cleanPrompt = prompt.trim().replace(/\s+/g, " ").substring(0, 500); // Limit prompt length

    // For the main endpoint
    if (baseURL.includes("image.pollinations.ai")) {
      // Build URL parameters
      const params = new URLSearchParams();
      if (width !== 1024) params.append("width", width.toString());
      if (height !== 1024) params.append("height", height.toString());
      if (model !== "flux") params.append("model", model);
      if (nologo) params.append("nologo", "true");
      if (isPrivate) params.append("private", "true");
      if (seed) params.append("seed", seed.toString());

      // Encode prompt properly
      const encodedPrompt = encodeURIComponent(cleanPrompt);

      // Construct the full URL
      const fullURL = `${baseURL}/${encodedPrompt}`;
      const queryString = params.toString();

      return queryString ? `${fullURL}?${queryString}` : fullURL;
    }

    // For alternative endpoint
    else if (baseURL.includes("pollinations.ai/p")) {
      const encodedPrompt = encodeURIComponent(cleanPrompt);
      const params = new URLSearchParams({
        prompt: cleanPrompt,
        width: width.toString(),
        height: height.toString(),
        model: model,
      });

      if (nologo) params.append("nologo", "true");
      if (seed) params.append("seed", seed.toString());

      return `${baseURL}?${params.toString()}`;
    }

    // Fallback
    return `${baseURL}/${encodeURIComponent(cleanPrompt)}?width=${width}&height=${height}`;
  }

  private async fetchWithTimeout(
    url: string,
    timeout: number = 45000,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "NothingAI/1.0",
          Accept: "image/*",
          "Cache-Control": "no-cache",
        },
        mode: "cors",
        cache: "no-cache",
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Timeout: La génération d'image a pris trop de temps");
      }

      // Handle specific network errors
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        throw new Error(
          "Problème de connexion réseau. Vérifiez votre connexion internet.",
        );
      }

      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private enhancePrompt(prompt: string): string {
    // Remove common French trigger words and enhance for better image generation
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

    // Add quality enhancers for better results
    const qualityEnhancers = [
      "high quality",
      "detailed",
      "professional",
      "8k resolution",
      "masterpiece",
      "beautiful lighting",
      "sharp focus",
    ];

    const randomEnhancer =
      qualityEnhancers[Math.floor(Math.random() * qualityEnhancers.length)];

    return `${cleanPrompt}, ${randomEnhancer}`;
  }

  // Health check for endpoints
  async checkEndpointHealth(): Promise<
    { endpoint: string; healthy: boolean }[]
  > {
    const results = [];

    for (const endpoint of this.endpoints) {
      try {
        const testUrl = this.buildImageURL(endpoint, "test", {
          width: 512,
          height: 512,
          model: "flux",
          nologo: true,
          private: false,
        });

        const response = await this.fetchWithTimeout(testUrl, 10000);
        results.push({ endpoint, healthy: response.ok });
      } catch (error) {
        results.push({ endpoint, healthy: false });
      }
    }

    return results;
  }

  // Predefined image styles for quick access
  getAvailableModels() {
    return [
      {
        id: "flux",
        name: "Flux (Général)",
        description: "Modèle polyvalent pour tous types d'images",
      },
      {
        id: "flux-realism",
        name: "Flux Réalisme",
        description: "Photos réalistes et portraits",
      },
      {
        id: "flux-anime",
        name: "Flux Anime",
        description: "Style anime et manga",
      },
      {
        id: "flux-3d",
        name: "Flux 3D",
        description: "Rendus 3D et objets volumétriques",
      },
      {
        id: "any-dark",
        name: "Any Dark",
        description: "Images sombres et dramatiques",
      },
      {
        id: "turbo",
        name: "Turbo",
        description: "Génération rapide, qualité standard",
      },
    ];
  }

  // Common image dimensions
  getCommonDimensions() {
    return [
      { name: "Carré", width: 1024, height: 1024 },
      { name: "Portrait", width: 768, height: 1024 },
      { name: "Paysage", width: 1024, height: 768 },
      { name: "HD Portrait", width: 720, height: 1280 },
      { name: "HD Paysage", width: 1280, height: 720 },
      { name: "Bannière", width: 1536, height: 512 },
    ];
  }

  // Check if a prompt is requesting image generation
  static isImageGenerationRequest(text: string): boolean {
    const imageKeywords = [
      // French
      "génère",
      "créé",
      "fais",
      "dessine",
      "imagine",
      "montre",
      "image",
      "photo",
      "dessin",
      "illustration",
      "artwork",
      // English
      "generate",
      "create",
      "make",
      "draw",
      "imagine",
      "show",
      "picture",
      "painting",
      "sketch",
      "render",
    ];

    const lowerText = text.toLowerCase();
    return imageKeywords.some(
      (keyword) =>
        lowerText.includes(keyword) &&
        (lowerText.includes("image") ||
          lowerText.includes("photo") ||
          lowerText.includes("dessin") ||
          lowerText.includes("picture") ||
          lowerText.includes("illustration")),
    );
  }

  // Extract image prompt from user message
  static extractImagePrompt(text: string): string {
    // Remove common trigger phrases and return the core prompt
    return text
      .replace(
        /^.*(génère|créé|fais|dessine|imagine|montre)\s*(moi\s*)?(une?\s*)?/i,
        "",
      )
      .replace(
        /^.*(generate|create|make|draw|imagine|show)\s*(me\s*)?(an?\s*)?/i,
        "",
      )
      .replace(
        /(image|photo|dessin|illustration|picture|painting)\s*(de\s*|of\s*)?/i,
        "",
      )
      .trim();
  }
}

// Create singleton instance
export const imageGenerator = new ImageGenerationAPI();

// Utility functions
export function generateRandomSeed(): number {
  return Math.floor(Math.random() * 1000000);
}

export function isValidImageDimension(dimension: number): boolean {
  return dimension >= 256 && dimension <= 2048;
}

export function getOptimalDimensions(
  aspectRatio: "square" | "portrait" | "landscape",
): { width: number; height: number } {
  switch (aspectRatio) {
    case "portrait":
      return { width: 768, height: 1024 };
    case "landscape":
      return { width: 1024, height: 768 };
    default:
      return { width: 1024, height: 1024 };
  }
}

export default imageGenerator;
