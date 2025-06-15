import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Image as ImageIcon,
  Download,
  Trash2,
  RefreshCw,
  Wand2,
  Settings,
  Palette,
  Zap,
  X,
  Copy,
} from "lucide-react";
import { useImageGeneration } from "@/hooks/use-image-generation";
import { LoadingSpinner } from "./loading-spinner";
import type { GeneratedImage } from "@/lib/image-generation";
import { toast } from "sonner";

interface ImageGenerationPanelProps {
  className?: string;
}

const ImageGenerationPanel = ({ className }: ImageGenerationPanelProps) => {
  const {
    settings,
    generatedImages,
    isGenerating,
    generateImage,
    updateSettings,
    removeGeneratedImage,
    clearGeneratedImages,
    downloadImage,
    regenerateImage,
    getImageGenerationStats,
    availableModels,
    commonDimensions,
  } = useImageGeneration();

  const [prompt, setPrompt] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    generateImage(prompt);
    setPrompt("");
  };

  const copyImageUrl = async (image: GeneratedImage) => {
    try {
      await navigator.clipboard.writeText(image.url);
      toast.success("URL copiée !");
    } catch (error) {
      toast.error("Erreur lors de la copie");
    }
  };

  const stats = getImageGenerationStats();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Génération d'Images</h2>
            <p className="text-sm text-muted-foreground">
              Créez des images avec l'IA - Pollinations.ai
            </p>
          </div>
        </div>

        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Paramètres de Génération</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Model Selection */}
              <div className="space-y-2">
                <Label>Modèle</Label>
                <Select
                  value={settings.model}
                  onValueChange={(value) => updateSettings({ model: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dimensions */}
              <div className="space-y-2">
                <Label>Dimensions</Label>
                <Select
                  value={`${settings.width}x${settings.height}`}
                  onValueChange={(value) => {
                    const [width, height] = value.split("x").map(Number);
                    updateSettings({ width, height });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {commonDimensions.map((dim) => (
                      <SelectItem
                        key={`${dim.width}x${dim.height}`}
                        value={`${dim.width}x${dim.height}`}
                      >
                        {dim.name} ({dim.width}x{dim.height})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom dimensions */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Largeur</Label>
                  <Input
                    type="number"
                    value={settings.width}
                    onChange={(e) =>
                      updateSettings({
                        width: parseInt(e.target.value) || 1024,
                      })
                    }
                    min={256}
                    max={2048}
                    step={64}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hauteur</Label>
                  <Input
                    type="number"
                    value={settings.height}
                    onChange={(e) =>
                      updateSettings({
                        height: parseInt(e.target.value) || 1024,
                      })
                    }
                    min={256}
                    max={2048}
                    step={64}
                  />
                </div>
              </div>

              {/* Enhancement toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Amélioration automatique</Label>
                  <p className="text-xs text-muted-foreground">
                    Ajoute des termes de qualité au prompt
                  </p>
                </div>
                <Switch
                  checked={settings.enhance}
                  onCheckedChange={(checked) =>
                    updateSettings({ enhance: checked })
                  }
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {stats.totalGenerated > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <div className="text-lg font-semibold">{stats.totalGenerated}</div>
            <div className="text-xs text-muted-foreground">Images générées</div>
          </div>
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <div className="text-lg font-semibold">{stats.modelsUsed}</div>
            <div className="text-xs text-muted-foreground">
              Modèles utilisés
            </div>
          </div>
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <div className="text-lg font-semibold">
              {Math.round(stats.averageSize / 1000)}K
            </div>
            <div className="text-xs text-muted-foreground">Pixels moyens</div>
          </div>
        </div>
      )}

      {/* Generation Form */}
      <form onSubmit={handleGenerate} className="space-y-4">
        <div className="relative">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Décrivez l'image que vous voulez générer..."
            disabled={isGenerating}
            className="pr-12"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!prompt.trim() || isGenerating}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            {isGenerating ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Badge variant="outline" className="text-xs">
              {settings.model}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {settings.width}x{settings.height}
            </Badge>
          </div>
          <span>Gratuit via Pollinations.ai</span>
        </div>
      </form>

      {/* Generated Images */}
      {generatedImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center">
              <Palette className="w-4 h-4 mr-2" />
              Images générées ({generatedImages.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearGeneratedImages}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Tout supprimer
            </Button>
          </div>

          <ScrollArea className="h-80">
            <div className="grid grid-cols-2 gap-3">
              {generatedImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                >
                  {/* Image */}
                  <div className="aspect-square relative">
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => downloadImage(image)}
                        className="w-8 h-8 p-0"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => copyImageUrl(image)}
                        className="w-8 h-8 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => regenerateImage(image)}
                        className="w-8 h-8 p-0"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeGeneratedImage(image.id)}
                        className="w-8 h-8 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="p-3 space-y-2">
                    <p
                      className="text-xs text-foreground line-clamp-2"
                      title={image.prompt}
                    >
                      {image.prompt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {image.model}
                      </Badge>
                      <span>
                        {image.width}×{image.height}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {image.timestamp.toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Empty State */}
      {generatedImages.length === 0 && !isGenerating && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Aucune image générée pour le moment</p>
          <p className="text-xs">
            Décrivez ce que vous voulez voir et laissez l'IA créer !
          </p>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="text-center py-8">
          <LoadingSpinner size="lg" variant="pulse" />
          <p className="text-sm text-muted-foreground mt-3">
            Génération de votre image en cours...
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageGenerationPanel;
