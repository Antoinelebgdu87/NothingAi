import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  imageGenerator,
  type ImageGenerationRequest,
  type GeneratedImage,
  ImageGenerationAPI,
} from "@/lib/image-generation";
import { toast } from "sonner";

export interface ImageGenerationSettings {
  model: string;
  width: number;
  height: number;
  enhance: boolean;
  seed?: number;
}

const DEFAULT_SETTINGS: ImageGenerationSettings = {
  model: "flux",
  width: 1024,
  height: 1024,
  enhance: true,
};

export function useImageGeneration() {
  const [settings, setSettings] =
    useState<ImageGenerationSettings>(DEFAULT_SETTINGS);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate image mutation
  const generateImageMutation = useMutation({
    mutationFn: async (prompt: string) => {
      setIsGenerating(true);

      const request: ImageGenerationRequest = {
        prompt,
        width: settings.width,
        height: settings.height,
        model: settings.model as any,
        enhance: settings.enhance,
        seed: settings.seed,
        nologo: true,
        private: false,
      };

      const generatedImage = await imageGenerator.generateImage(request);

      // Add to generated images list
      setGeneratedImages((prev) => [generatedImage, ...prev]);

      return generatedImage;
    },
    onSuccess: (image) => {
      toast.success("Image générée avec succès !");
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
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    [],
  );

  const removeGeneratedImage = useCallback((imageId: string) => {
    setGeneratedImages((prev) => prev.filter((img) => img.id !== imageId));
    toast.success("Image supprimée");
  }, []);

  const clearGeneratedImages = useCallback(() => {
    setGeneratedImages([]);
    toast.success("Toutes les images ont été supprimées");
  }, []);

  const downloadImage = useCallback(async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nothingai-${image.id}.png`;
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
    (originalImage: GeneratedImage) => {
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
    return {
      totalGenerated: generatedImages.length,
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
      image?: GeneratedImage;
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

        return {
          text: `J'ai généré une image basée sur votre demande : "${extractedPrompt}". Voici le résultat :`,
          image,
        };
      } catch (error) {
        return {
          text: `Désolé, je n'ai pas pu générer l'image demandée. Erreur : ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        };
      }
    },
    [generateImage],
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

    // API info
    availableModels: imageGenerator.getAvailableModels(),
    commonDimensions: imageGenerator.getCommonDimensions(),

    // Error handling
    error: generateImageMutation.error,
  };
}

export default useImageGeneration;
