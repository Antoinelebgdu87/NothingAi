import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
  size: number;
  type: string;
}

export function useImageAnalysis() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          resolve(reader.result as string);
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const validateImageFile = (file: File): boolean => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      toast.error(`Type de fichier non supporté: ${file.type}`);
      return false;
    }

    if (file.size > maxSize) {
      toast.error("L'image est trop lourde (max 10MB)");
      return false;
    }

    return true;
  };

  const addImages = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(validateImageFile);

    if (validFiles.length === 0) return;

    const newImages: UploadedImage[] = [];

    for (const file of validFiles) {
      try {
        const url = URL.createObjectURL(file);
        const image: UploadedImage = {
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          url,
          name: file.name,
          size: file.size,
          type: file.type,
        };
        newImages.push(image);
      } catch (error) {
        console.error("Erreur lors de l'ajout de l'image:", error);
        toast.error(`Erreur avec le fichier ${file.name}`);
      }
    }

    setUploadedImages((prev) => [...prev, ...newImages]);

    if (newImages.length > 0) {
      toast.success(`${newImages.length} image(s) ajoutée(s) avec succès!`);
    }
  }, []);

  const removeImage = useCallback((imageId: string) => {
    setUploadedImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter((img) => img.id !== imageId);
    });
    toast.success("Image supprimée");
  }, []);

  const clearAllImages = useCallback(() => {
    uploadedImages.forEach((img) => URL.revokeObjectURL(img.url));
    setUploadedImages([]);
    toast.success("Toutes les images ont été supprimées");
  }, [uploadedImages]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        addImages(files);
      }
    },
    [addImages],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Prepare images for API (convert to base64)
  const getImagesForAPI = useCallback(async (): Promise<
    Array<{
      type: "image_url";
      image_url: { url: string };
    }>
  > => {
    const imagePromises = uploadedImages.map(async (img) => {
      try {
        const base64 = await convertFileToBase64(img.file);
        return {
          type: "image_url" as const,
          image_url: { url: base64 },
        };
      } catch (error) {
        console.error(`Erreur lors de la conversion de ${img.name}:`, error);
        toast.error(`Erreur avec l'image ${img.name}`);
        return null;
      }
    });

    const results = await Promise.all(imagePromises);
    return results.filter(
      (result): result is NonNullable<typeof result> => result !== null,
    );
  }, [uploadedImages]);

  const formatImagePrompt = useCallback(
    (userText: string): string => {
      if (uploadedImages.length === 0) return userText;

      const imagesList = uploadedImages
        .map((img, index) => `Image ${index + 1}: ${img.name}`)
        .join(", ");

      return `${userText}\n\n[Images jointes: ${imagesList}]`;
    },
    [uploadedImages],
  );

  return {
    uploadedImages,
    isDragging,
    addImages,
    removeImage,
    clearAllImages,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    getImagesForAPI,
    formatImagePrompt,
    hasImages: uploadedImages.length > 0,
  };
}

export default useImageAnalysis;
