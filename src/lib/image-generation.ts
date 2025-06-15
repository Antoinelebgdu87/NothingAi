// Pollinations.ai - Free image generation API
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

    // Clean and enhance the prompt for better results
    const enhancedPrompt = enhance ? this.enhancePrompt(prompt) : prompt;

    // Build URL parameters
    const params = new URLSearchParams();
    if (width !== 1024) params.append("width", width.toString());
    if (height !== 1024) params.append("height", height.toString());
    if (model !== "flux") params.append("model", model);
    if (nologo) params.append("nologo", "true");
    if (isPrivate) params.append("private", "true");
    if (seed) params.append("seed", seed.toString());

    // Construct the full URL
    const imageUrl = `${this.baseURL}/${encodeURIComponent(enhancedPrompt)}${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    try {
      // Test if the image is accessible
      const response = await fetch(imageUrl, { method: "HEAD" });

      if (!response.ok) {
        throw new Error(`Failed to generate image: ${response.status}`);
      }

      const generatedImage: GeneratedImage = {
        id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: imageUrl,
        prompt: enhancedPrompt,
        timestamp: new Date(),
        width,
        height,
        model,
      };

      return generatedImage;
    } catch (error) {
      console.error("Error generating image:", error);
      throw new Error("Échec de la génération de l'image. Veuillez réessayer.");
    }
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
    ];

    const randomEnhancer =
      qualityEnhancers[Math.floor(Math.random() * qualityEnhancers.length)];

    return `${cleanPrompt}, ${randomEnhancer}, beautiful lighting, sharp focus`;
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
      { name: "Bannière", width: 1536, height: 512 },
      { name: "Story Instagram", width: 1080, height: 1920 },
      { name: "Post Instagram", width: 1080, height: 1080 },
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
          lowerText.includes("dessin")),
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
  return dimension >= 256 && dimension <= 2048 && dimension % 64 === 0;
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
