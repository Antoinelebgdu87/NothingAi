// Pollinations.ai - Free image generation API with improved error handling
const POLLINATIONS_BASE_URL = "https://image.pollinations.ai/prompt";

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
  private baseURL: string;
  private retryCount: number = 3;
  private retryDelay: number = 2000;

  constructor() {
    this.baseURL = POLLINATIONS_BASE_URL;
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

    // Build URL with proper encoding
    let imageUrl: string;
    try {
      imageUrl = this.buildImageURL(enhancedPrompt, {
        width,
        height,
        model,
        nologo,
        private: isPrivate,
        seed,
      });
    } catch (error) {
      throw new Error("Erreur lors de la construction de l'URL de l'image");
    }

    // Try to generate image with retries
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        console.log(`Tentative ${attempt}/${this.retryCount} - URL:`, imageUrl);

        // Test if the image is accessible and not empty
        const response = await this.fetchWithTimeout(imageUrl, 30000);

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

        // Verify the image loads correctly
        await this.verifyImageURL(imageUrl);

        const generatedImage: GeneratedImage = {
          id: `pol-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: imageUrl,
          prompt: enhancedPrompt,
          timestamp: new Date(),
          width,
          height,
          model,
        };

        console.log("Image générée avec succès:", generatedImage);
        return generatedImage;
      } catch (error) {
        console.error(`Tentative ${attempt} échouée:`, error);

        if (attempt === this.retryCount) {
          throw new Error(
            `Échec de la génération après ${this.retryCount} tentatives: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          );
        }

        // Wait before retry
        await this.delay(this.retryDelay);

        // Try with different seed on retry
        imageUrl = this.buildImageURL(enhancedPrompt, {
          width,
          height,
          model,
          nologo,
          private: isPrivate,
          seed: Math.floor(Math.random() * 1000000),
        });
      }
    }

    throw new Error("Échec de la génération d'image");
  }

  private buildImageURL(
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

    // Build URL parameters
    const params = new URLSearchParams();
    if (width !== 1024) params.append("width", width.toString());
    if (height !== 1024) params.append("height", height.toString());
    if (model !== "flux") params.append("model", model);
    if (nologo) params.append("nologo", "true");
    if (isPrivate) params.append("private", "true");
    if (seed) params.append("seed", seed.toString());

    // Encode prompt properly
    const encodedPrompt = encodeURIComponent(prompt);

    // Construct the full URL
    const baseUrl = `${this.baseURL}/${encodedPrompt}`;
    const queryString = params.toString();

    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  private async fetchWithTimeout(
    url: string,
    timeout: number = 30000,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "NothingAI/1.0",
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Timeout: La génération d'image a pris trop de temps");
      }
      throw error;
    }
  }

  private async verifyImageURL(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        if (img.naturalWidth === 0 || img.naturalHeight === 0) {
          reject(new Error("L'image générée est invalide"));
        } else {
          resolve();
        }
      };

      img.onerror = () => {
        reject(new Error("Impossible de charger l'image générée"));
      };

      // Set timeout for image loading
      setTimeout(() => {
        reject(new Error("Timeout lors du chargement de l'image"));
      }, 15000);

      img.src = url;
    });
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
