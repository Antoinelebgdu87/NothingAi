import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  Trash2,
  RotateCcw,
  Eye,
  MoreVertical,
  Copy,
  Share2,
  Sparkles,
  Zap,
  Crown,
} from "lucide-react";
import {
  useImageGeneration,
  type UnifiedGeneratedImage,
} from "@/hooks/use-image-generation";
import { toast } from "sonner";

interface GeneratedImagesDisplayProps {
  className?: string;
}

const GeneratedImagesDisplay = ({ className }: GeneratedImagesDisplayProps) => {
  const {
    generatedImages,
    downloadImage,
    removeGeneratedImage,
    regenerateImage,
    clearGeneratedImages,
  } = useImageGeneration();

  if (generatedImages.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-base">
            <Sparkles className="w-5 h-5 text-muted-foreground" />
            Aucune image générée
          </CardTitle>
          <CardDescription>
            Utilisez le générateur d'images pour créer vos premières images IA
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const copyToClipboard = async (image: UnifiedGeneratedImage) => {
    try {
      if ("blob" in image) {
        // Hugging Face image - copy blob
        const item = new ClipboardItem({ [image.blob.type]: image.blob });
        await navigator.clipboard.write([item]);
      } else {
        // Pollinations image - fetch and copy
        const response = await fetch(image.url);
        const blob = await response.blob();
        const item = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
      }
      toast.success("Image copiée dans le presse-papiers !");
    } catch (error) {
      toast.error("Impossible de copier l'image");
    }
  };

  const shareImage = async (image: UnifiedGeneratedImage) => {
    try {
      if (navigator.share) {
        let blob: Blob;
        if ("blob" in image) {
          blob = image.blob;
        } else {
          const response = await fetch(image.url);
          blob = await response.blob();
        }

        const file = new File([blob], `nothingai-${image.id}.png`, {
          type: blob.type,
        });

        await navigator.share({
          title: "Image générée par NothingAI",
          text: `Image générée avec le prompt: "${image.prompt}"`,
          files: [file],
        });
      } else {
        // Fallback - copy URL to clipboard
        await navigator.clipboard.writeText(image.url);
        toast.success("Lien de l'image copié !");
      }
    } catch (error) {
      toast.error("Impossible de partager l'image");
    }
  };

  const getProviderInfo = (image: UnifiedGeneratedImage) => {
    if ("blob" in image) {
      return {
        name: "Hugging Face",
        badge: "Pro",
        badgeColor: "bg-purple-100 text-purple-700",
        icon: <Crown className="w-3 h-3" />,
      };
    }
    return {
      name: "Pollinations",
      badge: "Gratuit",
      badgeColor: "bg-green-100 text-green-700",
      icon: <Zap className="w-3 h-3" />,
    };
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Images Générées</h3>
          <p className="text-sm text-muted-foreground">
            {generatedImages.length} image(s) créée(s) avec l'IA
          </p>
        </div>
        {generatedImages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearGeneratedImages}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Tout supprimer
          </Button>
        )}
      </div>

      {/* Grille d'images */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {generatedImages.map((image) => {
          const providerInfo = getProviderInfo(image);

          return (
            <Card key={image.id} className="overflow-hidden">
              <div className="relative group">
                {/* Image */}
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Overlay avec actions rapides */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="secondary">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Aperçu de l'image</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                        />
                        <div className="text-sm text-muted-foreground">
                          <p>
                            <strong>Prompt:</strong> {image.prompt}
                          </p>
                          <p>
                            <strong>Dimensions:</strong> {image.width}×
                            {image.height}
                          </p>
                          <p>
                            <strong>Modèle:</strong> {image.model}
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => downloadImage(image)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="secondary">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => copyToClipboard(image)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => shareImage(image)}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Partager
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => regenerateImage(image)}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Régénérer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => removeGeneratedImage(image.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Badge du fournisseur */}
                <div className="absolute top-2 right-2">
                  <Badge className={cn("text-xs", providerInfo.badgeColor)}>
                    {providerInfo.icon}
                    <span className="ml-1">{providerInfo.badge}</span>
                  </Badge>
                </div>
              </div>

              {/* Informations de l'image */}
              <CardContent className="p-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium line-clamp-2">
                    {image.prompt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {image.width}×{image.height}
                    </span>
                    <span>
                      {new Date(image.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Modèle: {image.model}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadImage(image)}
                    className="flex-1"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Télécharger
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => regenerateImage(image)}
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeGeneratedImage(image.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default GeneratedImagesDisplay;
