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
import { contentModerator } from "@/lib/content-moderation";
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
  width: 1024,
  height: 1024,
  enhance: true,
  negative_prompt:
    "nsfw, nude, naked, sexual, explicit, inappropriate, violence, disturbing, harmful, blurry, bad quality, distorted, ugly, low resolution",
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

  // Generate image mutation with content moderation
  const generateImageMutation = useMutation({
    mutationFn: async (prompt: string) => {
      setIsGenerating(true);

      // Validation de base
      if (!prompt || prompt.trim().length === 0) {
        throw new Error("Le prompt ne peut pas être vide");
      }

      if (prompt.trim().length < 3) {
        throw new Error("Le prompt doit contenir au moins 3 caractères");
      }

      if (prompt.trim().length > 500) {
        throw new Error("Le prompt ne peut pas dépasser 500 caractères");
      }

      // ⚠️ MODÉRATION DE CONTENU ⚠️
      console.log("🛡️ Vérification du contenu...");
      const moderation = contentModerator.validateAndCleanImagePrompt(prompt);

      if (!moderation.isValid) {
        console.log("❌ Contenu bloqué:", moderation.error);
        throw new Error(
          `❌ ${moderation.error}\n\n💡 Suggestion: ${moderation.suggestion || "Reformulez votre demande de manière plus appropriée"}`,
        );
      }

      const safePrompt = moderation.cleanedPrompt || prompt;
      console.log("✅ Contenu validé, génération sécurisée");

      try {
        if (settings.provider === "huggingface") {
          // Validation HF spécifique
          if (
            settings.width % 64 !== 0 ||
            settings.height % 64 !== 0 ||
            settings.width < 256 ||
            settings.height < 256 ||
            settings.width > 1024 ||
            settings.height > 1024
          ) {
            throw new Error(
              "Pour Hugging Face, les dimensions doivent être entre 256-1024 et multiples de 64",
            );
          }

          // Use Hugging Face API avec sécurité renforcée
          const hfAPI = settings.huggingFaceToken
            ? new HuggingFaceAPI(settings.huggingFaceToken)
            : huggingFaceAPI;

          // Prompt négatif sécurisé
          const safeNegativePrompt = [
            settings.negative_prompt || "",
            contentModerator.getSafetyNegativePrompt(),
          ]
            .filter(Boolean)
            .join(", ");

          const request: HuggingFaceRequest = {
            prompt: settings.enhance
              ? hfAPI.enhancePrompt(safePrompt)
              : safePrompt,
            negative_prompt: safeNegativePrompt,
            width: settings.width,
            height: settings.height,
            num_inference_steps: settings.num_inference_steps,
            guidance_scale: settings.guidance_scale,
            seed: settings.seed,
          };

          console.log("🎨 Génération HF sécurisée avec prompt:", safePrompt);

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
          // Validation Pollinations spécifique
          if (
            settings.width < 256 ||
            settings.height < 256 ||
            settings.width > 2048 ||
            settings.height > 2048
          ) {
            throw new Error(
              "Pour Pollinations, les dimensions doivent être entre 256-2048",
            );
          }

          // Use Pollinations API avec sécurité
          const request: ImageGenerationRequest = {
            prompt: safePrompt, // Prompt déjà nettoyé par la modération
            width: settings.width,
            height: settings.height,
            model: settings.pollinationsModel as any,
            enhance: settings.enhance,
            seed: settings.seed,
            nologo: true,
            private: false,
          };

          console.log(
            "🎨 Génération Pollinations sécurisée avec prompt:",
            safePrompt,
          );

          const generatedImage = await imageGenerator.generateImage(request);
          setGeneratedImages((prev) => [generatedImage, ...prev]);
          return generatedImage;
        }
      } catch (error) {
        console.error("Erreur de génération:", error);
        throw error;
      }
    },
    onSuccess: (image) => {
      const provider =
        settings.provider === "huggingface" ? "Hugging Face" : "Pollinations";
      toast.success(`🎨 Image sécurisée générée via ${provider} !`);
      setIsGenerating(false);
    },
    onError: (error: Error) => {
      console.error("Error generating image:", error);

      // Messages d'erreur spécialisés
      let errorMessage = error.message;

      // Erreurs de modération
      if (errorMessage.includes("❌")) {
        toast.error(errorMessage, {
          duration: 8000, // Plus long pour les erreurs de modération
          style: {
            maxWidth: "500px",
          },
        });
        setIsGenerating(false);
        return;
      }

      // Autres erreurs techniques
      if (errorMessage.includes("503")) {
        errorMessage =
          "Service temporairement indisponible. Réessayez dans quelques minutes.";
      } else if (errorMessage.includes("401") || errorMessage.includes("403")) {
        errorMessage = "Problème d'authentification. Vérifiez votre token API.";
      } else if (errorMessage.includes("429")) {
        errorMessage = "Trop de requêtes. Attendez un peu avant de réessayer.";
      } else if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("Timeout")
      ) {
        errorMessage =
          "La génération a pris trop de temps. Réessayez avec un prompt plus simple.";
      } else if (
        errorMessage.includes("0 octets") ||
        errorMessage.includes("empty")
      ) {
        errorMessage = "L'image générée est vide. Essayez un prompt différent.";
      }

      toast.error(`Erreur: ${errorMessage}`);
      setIsGenerating(false);
    },
  });

  const generateImage = useCallback(
    (prompt: string) => {
      if (!prompt.trim() || isGenerating) return;

      // Clean the prompt if it contains image generation keywords
      let cleanPrompt = prompt.trim();

      if (ImageGenerationAPI.isImageGenerationRequest(prompt)) {
        cleanPrompt = ImageGenerationAPI.extractImagePrompt(prompt);
      }

      if (!cleanPrompt.trim()) {
        toast.error("Veuillez fournir une description pour l'image");
        return;
      }

      if (cleanPrompt.length < 3) {
        toast.error("La description doit contenir au moins 3 caractères");
        return;
      }

      // Pré-vérification rapide pour l'UX
      if (!contentModerator.isImagePromptSafe(cleanPrompt)) {
        toast.error(
          "❌ Contenu inapproprié détecté. Reformulez votre demande.",
          {
            duration: 5000,
          },
        );
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
            // Ensure dimensions are valid for SD
            if (updated.width % 64 !== 0) {
              updated.width = Math.round(updated.width / 64) * 64;
            }
            if (updated.height % 64 !== 0) {
              updated.height = Math.round(updated.height / 64) * 64;
            }
          } else {
            // Switch to Pollinations dimensions
            updated.width = 1024;
            updated.height = 1024;
          }
        }

        // Validate dimensions for current provider
        if (updated.provider === "huggingface") {
          if (updated.width % 64 !== 0) {
            updated.width = Math.round(updated.width / 64) * 64;
          }
          if (updated.height % 64 !== 0) {
            updated.height = Math.round(updated.height / 64) * 64;
          }
          updated.width = Math.max(256, Math.min(1024, updated.width));
          updated.height = Math.max(256, Math.min(1024, updated.height));
        } else {
          updated.width = Math.max(256, Math.min(2048, updated.width));
          updated.height = Math.max(256, Math.min(2048, updated.height));
        }

        // Assurer que le negative prompt contient toujours les éléments de sécurité
        if (newSettings.negative_prompt !== undefined) {
          const safetyPrompt = contentModerator.getSafetyNegativePrompt();
          if (!updated.negative_prompt?.includes("nsfw")) {
            updated.negative_prompt = updated.negative_prompt
              ? `${updated.negative_prompt}, ${safetyPrompt}`
              : safetyPrompt;
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
        try {
          URL.revokeObjectURL(imageToRemove.url);
        } catch (error) {
          console.warn("Erreur lors de la révocation de l'URL:", error);
        }
      }
      return prev.filter((img) => img.id !== imageId);
    });
    toast.success("Image supprimée");
  }, []);

  const clearGeneratedImages = useCallback(() => {
    // Revoke all Hugging Face blob URLs
    generatedImages.forEach((img) => {
      if ("blob" in img) {
        try {
          URL.revokeObjectURL(img.url);
        } catch (error) {
          console.warn("Erreur lors de la révocation de l'URL:", error);
        }
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
        // Pollinations image - fetch the image
        const response = await fetch(image.url);
        if (!response.ok) {
          throw new Error("Impossible de télécharger l'image");
        }
        blob = await response.blob();
        filename = `nothingai-pollinations-${image.id}.png`;
      }

      if (blob.size === 0) {
        throw new Error("L'image est vide");
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
      toast.error(
        `Erreur lors du téléchargement: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }, []);

  const regenerateImage = useCallback(
    (originalImage: UnifiedGeneratedImage) => {
      // Vérifier la sécurité avant de régénérer
      if (!contentModerator.isImagePromptSafe(originalImage.prompt)) {
        toast.error("❌ Impossible de régénérer: contenu inapproprié détecté");
        return;
      }

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

  // Auto-generate response with image (avec modération)
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

        if (extractedPrompt.length < 3) {
          return {
            text: "La description de l'image doit contenir au moins 3 caractères. Pouvez-vous donner plus de détails ?",
          };
        }

        // Vérification de sécurité avant génération
        const moderation =
          contentModerator.validateAndCleanImagePrompt(extractedPrompt);

        if (!moderation.isValid) {
          return {
            text: `❌ Je ne peux pas générer cette image : ${moderation.error}\n\n💡 ${moderation.suggestion || "Essayez de reformuler votre demande de manière plus appropriée."}`,
          };
        }

        const image = await generateImage(
          moderation.cleanedPrompt || extractedPrompt,
        );
        const provider =
          settings.provider === "huggingface"
            ? "Hugging Face (Stable Diffusion)"
            : "Pollinations.ai";

        return {
          text: `🎨 J'ai généré une image sécurisée basée sur votre demande via ${provider}. Voici le résultat :`,
          image,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";

        // Gestion spéciale des erreurs de modération
        if (errorMessage.includes("❌")) {
          return {
            text: `${errorMessage}\n\nJe suis configuré pour générer uniquement du contenu approprié et sûr. 🛡️`,
          };
        }

        return {
          text: `Désolé, je n'ai pas pu générer l'image demandée. ${errorMessage}. Voulez-vous essayer avec une description différente ?`,
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
        console.error("Token validation error:", error);
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

    // Security
    isPromptSafe: (prompt: string) =>
      contentModerator.isImagePromptSafe(prompt),
    moderatePrompt: (prompt: string) =>
      contentModerator.moderateImagePrompt(prompt),

    // Error handling
    error: generateImageMutation.error,
  };
}

export default useImageGeneration;
