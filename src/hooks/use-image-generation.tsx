import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  imageGenerator,
  type ImageGenerationRequest,
  type GeneratedImage,
  ImageGenerationAPI,
} from "@/lib/image-generation";
import {
  huggingFaceAPI,
  type HuggingFaceRequest,
  type HuggingFaceImage,
  HuggingFaceAPI,
} from "@/lib/huggingface-api";
import { toast } from "sonner";

export type ImageProvider = "pollinations" | "huggingface";

export interface ImageGenerationSettings {
  provider: ImageProvider;
  // Pollinations settings
  pollinationsModel: string;
  // Hugging Face settings
  huggingFaceModel: string;
  huggingFaceToken?: string;
  // Common settings
  width: number;
  height: number;
  enhance: boolean;
  seed?: number;
  // Stable Diffusion specific
  negative_prompt?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
}

export type UnifiedGeneratedImage =
  | GeneratedImage
  | (HuggingFaceImage & { provider: "huggingface" });

const DEFAULT_SETTINGS: ImageGenerationSettings = {
  provider: "pollinations",
  pollinationsModel: "flux",
  huggingFaceModel: "stabilityai/stable-diffusion-2",
  width: 512,
  height: 512,
  enhance: true,
  negative_prompt: "blurry, bad quality, distorted, ugly",
  num_inference_steps: 20,
  guidance_scale: 7.5,
};

export function useImageGeneration() {
  const [settings, setSettings] =
    useState<ImageGenerationSettings>(DEFAULT_SETTINGS);
  const [generatedImages, setGeneratedImages] = useState<
    UnifiedGeneratedImage[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate image mutation with dual API support
  const generateImageMutation = useMutation({
    mutationFn: async (prompt: string) => {
      setIsGenerating(true);

      if (settings.provider === "huggingface") {
        // Use Hugging Face API
        const hfAPI = settings.huggingFaceToken
          ? new HuggingFaceAPI(settings.huggingFaceToken)
          : huggingFaceAPI;

        const request: HuggingFaceRequest = {
          prompt: settings.enhance ? hfAPI.enhancePrompt(prompt) : prompt,
          negative_prompt: settings.negative_prompt,
          width: settings.width,
          height: settings.height,
          num_inference_steps: settings.num_inference_steps,
          guidance_scale: settings.guidance_scale,
          seed: settings.seed,
        };

        const generatedImage = await hfAPI.generateImage(
          request,
          settings.huggingFaceModel,
        );

        // Add provider identifier
        const unifiedImage: UnifiedGeneratedImage = {
          ...generatedImage,
          provider: "huggingface" as const,
        };

        setGeneratedImages((prev) => [unifiedImage, ...prev]);
        return unifiedImage;
      } else {
        // Use Pollinations API
        const request: ImageGenerationRequest = {
          prompt,
          width: settings.width,
          height: settings.height,
          model: settings.pollinationsModel as any,
          enhance: settings.enhance,
          seed: settings.seed,
          nologo: true,
          private: false,
        };

        const generatedImage = await imageGenerator.generateImage(request);
        setGeneratedImages((prev) => [generatedImage, ...prev]);
        return generatedImage;
      }
    },
    onSuccess: (image) => {
      const provider =
        settings.provider === "huggingface" ? "Hugging Face" : "Pollinations";
      toast.success(`Image générée avec succès via ${provider} !`);
      setIsGenerating(false);
    },
    onError: (error: Error) => {
      console.error("Error generating image:", error);
      toast.error(`Erreur: ${error.message}`);
      setIsGenerating(false);
    },
  });

  const generateImage = useCallback(
    (prompt: string) => {
      if (!prompt.trim() || isGenerating) return;

      // Clean the prompt if it contains image generation keywords
      const cleanPrompt = ImageGenerationAPI.isImageGenerationRequest(prompt)
        ? ImageGenerationAPI.extractImagePrompt(prompt)
        : prompt;

      if (!cleanPrompt.trim()) {
        toast.error("Veuillez fournir une description pour l'image");
        return;
      }

      return generateImageMutation.mutateAsync(cleanPrompt);
    },
    [generateImageMutation, isGenerating],
  );

  const updateSettings = useCallback(
    (newSettings: Partial<ImageGenerationSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newSettings };

        // Auto-adjust dimensions when switching providers
        if (newSettings.provider && newSettings.provider !== prev.provider) {
          if (newSettings.provider === "huggingface") {
            // Switch to SD-friendly dimensions
            updated.width = 512;
            updated.height = 512;
          } else {
            // Switch to Pollinations dimensions
            updated.width = 1024;
            updated.height = 1024;
          }
        }

        return updated;
      });
    },
    [],
  );

  const removeGeneratedImage = useCallback((imageId: string) => {
    setGeneratedImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === imageId);
      if (imageToRemove && "blob" in imageToRemove) {
        // Revoke Hugging Face blob URL
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter((img) => img.id !== imageId);
    });
    toast.success("Image supprimée");
  }, []);

  const clearGeneratedImages = useCallback(() => {
    // Revoke all Hugging Face blob URLs
    generatedImages.forEach((img) => {
      if ("blob" in img) {
        URL.revokeObjectURL(img.url);
      }
    });
    setGeneratedImages([]);
    toast.success("Toutes les images ont été supprimées");
  }, [generatedImages]);

  const downloadImage = useCallback(async (image: UnifiedGeneratedImage) => {
    try {
      let blob: Blob;
      let filename: string;

      if ("blob" in image) {
        // Hugging Face image
        blob = image.blob;
        filename = `nothingai-hf-${image.id}.png`;
      } else {
        // Pollinations image
        const response = await fetch(image.url);
        blob = await response.blob();
        filename = `nothingai-pollinations-${image.id}.png`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Image téléchargée !");
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Erreur lors du téléchargement");
    }
  }, []);

  const regenerateImage = useCallback(
    (originalImage: UnifiedGeneratedImage) => {
      // Regenerate with same prompt but new seed
      const newSeed = Math.floor(Math.random() * 1000000);
      const oldSettings = settings;

      setSettings((prev) => ({ ...prev, seed: newSeed }));

      generateImage(originalImage.prompt).finally(() => {
        setSettings(oldSettings);
      });
    },
    [generateImage, settings],
  );

  const getImageGenerationStats = useCallback(() => {
    const pollinationsCount = generatedImages.filter(
      (img) => !("blob" in img),
    ).length;
    const huggingfaceCount = generatedImages.filter(
      (img) => "blob" in img,
    ).length;

    return {
      totalGenerated: generatedImages.length,
      pollinationsCount,
      huggingfaceCount,
      modelsUsed: [...new Set(generatedImages.map((img) => img.model))].length,
      averageSize:
        generatedImages.length > 0
          ? Math.round(
              generatedImages.reduce(
                (sum, img) => sum + img.width * img.height,
                0,
              ) / generatedImages.length,
            )
          : 0,
    };
  }, [generatedImages]);

  // Check if user input is requesting image generation
  const detectImageGenerationIntent = useCallback((text: string): boolean => {
    return ImageGenerationAPI.isImageGenerationRequest(text);
  }, []);

  // Auto-generate response with image
  const generateImageResponse = useCallback(
    async (
      userPrompt: string,
    ): Promise<{
      text: string;
      image?: UnifiedGeneratedImage;
    }> => {
      try {
        const extractedPrompt =
          ImageGenerationAPI.extractImagePrompt(userPrompt);

        if (!extractedPrompt.trim()) {
          return {
            text: "Je n'ai pas pu extraire une description claire pour générer l'image. Pouvez-vous être plus spécifique ?",
          };
        }

        const image = await generateImage(extractedPrompt);
        const provider =
          settings.provider === "huggingface"
            ? "Hugging Face (Stable Diffusion)"
            : "Pollinations.ai";

        return {
          text: `J'ai généré une image basée sur votre demande : "${extractedPrompt}" via ${provider}. Voici le résultat :`,
          image,
        };
      } catch (error) {
        return {
          text: `Désolé, je n'ai pas pu générer l'image demandée. Erreur : ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        };
      }
    },
    [generateImage, settings.provider],
  );

  // Validate Hugging Face token
  const validateHFToken = useCallback(
    async (token: string): Promise<boolean> => {
      try {
        return await huggingFaceAPI.validateToken(token);
      } catch (error) {
        return false;
      }
    },
    [],
  );

  return {
    // State
    settings,
    generatedImages,
    isGenerating,
    isLoading: generateImageMutation.isPending,

    // Actions
    generateImage,
    updateSettings,
    removeGeneratedImage,
    clearGeneratedImages,
    downloadImage,
    regenerateImage,

    // Utilities
    getImageGenerationStats,
    detectImageGenerationIntent,
    generateImageResponse,
    validateHFToken,

    // API info
    pollinationsModels: imageGenerator.getAvailableModels(),
    huggingFaceModels: huggingFaceAPI.getAvailableModels(),
    pollinationsDimensions: imageGenerator.getCommonDimensions(),
    huggingFaceDimensions: huggingFaceAPI.getRecommendedDimensions(),

    // Error handling
    error: generateImageMutation.error,
  };
}

export default useImageGeneration;
