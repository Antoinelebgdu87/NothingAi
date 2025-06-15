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
import { Textarea } from "@/components/ui/textarea";
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
  Bot,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  useImageGeneration,
  type ImageProvider,
} from "@/hooks/use-image-generation";
import { LoadingSpinner } from "./loading-spinner";
import type { UnifiedGeneratedImage } from "@/hooks/use-image-generation";
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
    validateHFToken,
    pollinationsModels,
    huggingFaceModels,
    pollinationsDimensions,
    huggingFaceDimensions,
  } = useImageGeneration();

  const [prompt, setPrompt] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [tempToken, setTempToken] = useState(settings.huggingFaceToken || "");

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    generateImage(prompt);
    setPrompt("");
  };

  const copyImageUrl = async (image: UnifiedGeneratedImage) => {
    try {
      await navigator.clipboard.writeText(image.url);
      toast.success("URL copiée !");
    } catch (error) {
      toast.error("Erreur lors de la copie");
    }
  };

  const handleProviderChange = (provider: ImageProvider) => {
    updateSettings({ provider });
    toast.info(
      provider === "huggingface"
        ? "Basculé vers Hugging Face (Stable Diffusion)"
        : "Basculé vers Pollinations.ai",
    );
  };

  const handleTokenSave = async () => {
    if (tempToken.trim()) {
      const isValid = await validateHFToken(tempToken.trim());
      if (isValid) {
        updateSettings({ huggingFaceToken: tempToken.trim() });
        toast.success("Token Hugging Face configuré avec succès !");
      } else {
        toast.error("Token Hugging Face invalide");
        return;
      }
    } else {
      updateSettings({ huggingFaceToken: undefined });
      toast.info("Token Hugging Face supprimé");
    }
    setShowSettings(false);
  };

  const stats = getImageGenerationStats();
  const currentDimensions =
    settings.provider === "huggingface"
      ? huggingFaceDimensions
      : pollinationsDimensions;
  const currentModels =
    settings.provider === "huggingface"
      ? huggingFaceModels
      : pollinationsModels;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              settings.provider === "huggingface"
                ? "bg-gradient-to-br from-orange-500 to-red-600"
                : "bg-gradient-to-br from-purple-500 to-pink-600",
            )}
          >
            {settings.provider === "huggingface" ? (
              <Bot className="w-5 h-5 text-white" />
            ) : (
              <Wand2 className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold">Génération d'Images</h2>
            <p className="text-sm text-muted-foreground">
              {settings.provider === "huggingface"
                ? "Stable Diffusion via Hugging Face"
                : "Génération rapide via Pollinations.ai"}
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
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Paramètres de Génération</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Provider Selection */}
              <div className="space-y-2">
                <Label>Fournisseur d'API</Label>
                <Select
                  value={settings.provider}
                  onValueChange={(value: ImageProvider) =>
                    handleProviderChange(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pollinations">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <div>
                          <div className="font-medium">Pollinations.ai</div>
                          <div className="text-xs text-muted-foreground">
                            Gratuit, rapide, aucune configuration
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="huggingface">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-orange-500" />
                        <div>
                          <div className="font-medium">Hugging Face</div>
                          <div className="text-xs text-muted-foreground">
                            Stable Diffusion, contrôle avancé
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Hugging Face Token */}
              {settings.provider === "huggingface" && (
                <div className="space-y-2">
                  <Label>Token Hugging Face (optionnel)</Label>
                  <div className="relative">
                    <Input
                      type={showToken ? "text" : "password"}
                      value={tempToken}
                      onChange={(e) => setTempToken(e.target.value)}
                      placeholder="hf_xxxxxxxxxxxxxxxxxxxxxx"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 p-0"
                    >
                      {showToken ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Créez un token gratuit sur{" "}
                    <a
                      href="https://huggingface.co/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      huggingface.co
                    </a>{" "}
                    pour éviter les limitations
                  </p>
                  <Button
                    onClick={handleTokenSave}
                    size="sm"
                    className="w-full"
                  >
                    Sauvegarder Token
                  </Button>
                </div>
              )}

              {/* Model Selection */}
              <div className="space-y-2">
                <Label>Modèle</Label>
                <Select
                  value={
                    settings.provider === "huggingface"
                      ? settings.huggingFaceModel
                      : settings.pollinationsModel
                  }
                  onValueChange={(value) =>
                    updateSettings(
                      settings.provider === "huggingface"
                        ? { huggingFaceModel: value }
                        : { pollinationsModel: value },
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentModels.map((model) => (
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
                    {currentDimensions.map((dim) => (
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
                        width: parseInt(e.target.value) || 512,
                      })
                    }
                    min={256}
                    max={2048}
                    step={settings.provider === "huggingface" ? 64 : 1}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hauteur</Label>
                  <Input
                    type="number"
                    value={settings.height}
                    onChange={(e) =>
                      updateSettings({
                        height: parseInt(e.target.value) || 512,
                      })
                    }
                    min={256}
                    max={2048}
                    step={settings.provider === "huggingface" ? 64 : 1}
                  />
                </div>
              </div>

              {/* Stable Diffusion specific settings */}
              {settings.provider === "huggingface" && (
                <>
                  <div className="space-y-2">
                    <Label>Prompt Négatif</Label>
                    <Textarea
                      value={settings.negative_prompt || ""}
                      onChange={(e) =>
                        updateSettings({ negative_prompt: e.target.value })
                      }
                      placeholder="Ce que vous ne voulez PAS dans l'image..."
                      className="min-h-[60px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Étapes d'inférence: {settings.num_inference_steps}
                    </Label>
                    <Slider
                      value={[settings.num_inference_steps || 20]}
                      onValueChange={([value]) =>
                        updateSettings({ num_inference_steps: value })
                      }
                      min={10}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Guidance Scale: {settings.guidance_scale}</Label>
                    <Slider
                      value={[settings.guidance_scale || 7.5]}
                      onValueChange={([value]) =>
                        updateSettings({ guidance_scale: value })
                      }
                      min={1}
                      max={20}
                      step={0.5}
                      className="w-full"
                    />
                  </div>
                </>
              )}

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

      {/* Provider Status */}
      <div className="p-3 bg-muted/20 rounded-lg border border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {settings.provider === "huggingface" ? (
              <Bot className="w-4 h-4 text-orange-500" />
            ) : (
              <Sparkles className="w-4 h-4 text-purple-500" />
            )}
            <span className="text-sm font-medium">
              {settings.provider === "huggingface"
                ? "Hugging Face"
                : "Pollinations.ai"}
            </span>
            <Badge variant="outline" className="text-xs">
              {settings.provider === "huggingface"
                ? settings.huggingFaceToken
                  ? "Avec Token"
                  : "Sans Token"
                : "Gratuit Illimité"}
            </Badge>
          </div>
          <Badge variant="outline" className="text-xs">
            {settings.provider === "huggingface"
              ? settings.huggingFaceModel.split("/").pop()
              : settings.pollinationsModel}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      {stats.totalGenerated > 0 && (
        <div className="grid grid-cols-2 gap-4">
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
          {stats.pollinationsCount > 0 && stats.huggingfaceCount > 0 && (
            <div className="col-span-2 grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-purple-500/10 text-purple-500 rounded">
                <div className="font-semibold">{stats.pollinationsCount}</div>
                <div className="text-xs">Pollinations</div>
              </div>
              <div className="text-center p-2 bg-orange-500/10 text-orange-500 rounded">
                <div className="font-semibold">{stats.huggingfaceCount}</div>
                <div className="text-xs">Hugging Face</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generation Form */}
      <form onSubmit={handleGenerate} className="space-y-4">
        <div className="relative">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              settings.provider === "huggingface"
                ? "Une belle montagne au coucher du soleil, style réaliste..."
                : "Décrivez l'image que vous voulez générer..."
            }
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
              {settings.width}x{settings.height}
            </Badge>
            {settings.provider === "huggingface" &&
              settings.negative_prompt && (
                <Badge variant="outline" className="text-xs">
                  Prompt négatif
                </Badge>
              )}
          </div>
          <span>
            {settings.provider === "huggingface"
              ? "Stable Diffusion via Hugging Face"
              : "Gratuit via Pollinations.ai"}
          </span>
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

                    {/* Provider Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge
                        className={cn(
                          "text-xs",
                          "provider" in image &&
                            image.provider === "huggingface"
                            ? "bg-orange-500/90 text-white"
                            : "bg-purple-500/90 text-white",
                        )}
                      >
                        {"provider" in image &&
                        image.provider === "huggingface" ? (
                          <Bot className="w-3 h-3 mr-1" />
                        ) : (
                          <Sparkles className="w-3 h-3 mr-1" />
                        )}
                        {"provider" in image && image.provider === "huggingface"
                          ? "HF"
                          : "PL"}
                      </Badge>
                    </div>

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
                        {image.model.split("/").pop()}
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
            {settings.provider === "huggingface"
              ? "Utilisez Stable Diffusion pour des images de haute qualité"
              : "Décrivez ce que vous voulez voir et laissez l'IA créer !"}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="text-center py-8">
          <LoadingSpinner size="lg" variant="pulse" />
          <p className="text-sm text-muted-foreground mt-3">
            {settings.provider === "huggingface"
              ? "Génération Stable Diffusion en cours..."
              : "Génération de votre image en cours..."}
          </p>
          {settings.provider === "huggingface" &&
            !settings.huggingFaceToken && (
              <p className="text-xs text-muted-foreground mt-1">
                Première génération peut être plus lente (chargement du modèle)
              </p>
            )}
        </div>
      )}
    </div>
  );
};

export default ImageGenerationPanel;
