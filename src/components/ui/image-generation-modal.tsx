import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Image as ImageIcon,
  Sparkles,
  Settings,
  Wand2,
  Zap,
  Crown,
  Download,
  RotateCcw,
} from "lucide-react";
import ImageFormatSelector from "./image-format-selector";
import { LoadingSpinner } from "./loading-spinner";
import { useImageGeneration } from "@/hooks/use-image-generation";

interface ImageGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPrompt?: string;
}

const ImageGenerationModal = ({
  open,
  onOpenChange,
  initialPrompt = "",
}: ImageGenerationModalProps) => {
  const {
    settings,
    generateImage,
    updateSettings,
    isGenerating,
    pollinationsModels,
    huggingFaceModels,
    generatedImages,
    downloadImage,
    regenerateImage,
  } = useImageGeneration();

  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedFormat, setSelectedFormat] = useState<{
    width: number;
    height: number;
    format: string;
    quality: string;
  } | null>(null);
  const [step, setStep] = useState<
    "format" | "prompt" | "generating" | "success"
  >("format");

  const handleFormatSelect = (format: {
    width: number;
    height: number;
    format: string;
    quality: string;
  }) => {
    setSelectedFormat(format);
    updateSettings({
      width: format.width,
      height: format.height,
    });
    setStep("prompt");
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedFormat) return;

    try {
      setStep("generating");
      const result = await generateImage(prompt);
      if (result) {
        setStep("success");
        // Ne pas fermer la modal automatiquement, laisser l'utilisateur voir le résultat
      }
    } catch (error) {
      setStep("prompt");
    }
  };

  const handleBack = () => {
    if (step === "prompt") {
      setStep("format");
    } else if (step === "generating") {
      setStep("prompt");
    }
  };

  const getProviderInfo = (provider: string) => {
    switch (provider) {
      case "pollinations":
        return {
          name: "Pollinations",
          badge: "Gratuit",
          badgeColor: "bg-green-100 text-green-700",
          icon: <Zap className="w-4 h-4" />,
          description: "Génération rapide et illimitée",
        };
      case "huggingface":
        return {
          name: "Hugging Face",
          badge: "Pro",
          badgeColor: "bg-purple-100 text-purple-700",
          icon: <Crown className="w-4 h-4" />,
          description: "Stable Diffusion haute qualité",
        };
      default:
        return {
          name: "Pollinations",
          badge: "Gratuit",
          badgeColor: "bg-green-100 text-green-700",
          icon: <Zap className="w-4 h-4" />,
          description: "Génération rapide et illimitée",
        };
    }
  };

  const providerInfo = getProviderInfo(settings.provider);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            Générateur d'Images IA
          </DialogTitle>
          <DialogDescription>
            {step === "format" &&
              "Choisissez le format et la qualité de votre image"}
            {step === "prompt" && "Décrivez l'image que vous souhaitez créer"}
            {step === "generating" && "Génération de votre image en cours..."}
            {step === "success" && "Votre image a été générée avec succès !"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === "format" && (
            <div className="max-h-[60vh] overflow-y-auto">
              <ImageFormatSelector
                onFormatSelect={handleFormatSelect}
                currentWidth={settings.width}
                currentHeight={settings.height}
              />
            </div>
          )}

          {step === "prompt" && (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Résumé du format sélectionné */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">
                      Format sélectionné
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStep("format")}
                  >
                    Modifier
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">Format</div>
                    <div className="font-medium">{selectedFormat?.format}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">
                      Résolution
                    </div>
                    <div className="font-mono">
                      {selectedFormat?.width}×{selectedFormat?.height}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Qualité</div>
                    <div className="font-medium">{selectedFormat?.quality}</div>
                  </div>
                </div>
              </div>

              {/* Fournisseur et modèle */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Fournisseur IA</Label>
                  <Select
                    value={settings.provider}
                    onValueChange={(value: "pollinations" | "huggingface") =>
                      updateSettings({ provider: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pollinations">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          <span>Pollinations</span>
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            Gratuit
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="huggingface">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4" />
                          <span>Hugging Face</span>
                          <Badge className="bg-purple-100 text-purple-700 text-xs">
                            Pro
                          </Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {providerInfo.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Modèle IA</Label>
                  <Select
                    value={
                      settings.provider === "pollinations"
                        ? settings.pollinationsModel
                        : settings.huggingFaceModel
                    }
                    onValueChange={(value) =>
                      updateSettings(
                        settings.provider === "pollinations"
                          ? { pollinationsModel: value }
                          : { huggingFaceModel: value },
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(settings.provider === "pollinations"
                        ? pollinationsModels
                        : huggingFaceModels
                      ).map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {model.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Saisie du prompt */}
              <div className="space-y-2">
                <Label htmlFor="prompt" className="text-sm">
                  Description de l'image
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="Décrivez en détail l'image que vous souhaitez générer..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Soyez précis et détaillé pour obtenir de meilleurs résultats.
                  Exemple: "Un paysage de montagne au coucher du soleil avec un
                  lac"
                </p>
              </div>

              {/* Options avancées */}
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Options de base</TabsTrigger>
                  <TabsTrigger value="advanced">Avancé</TabsTrigger>
                </TabsList>
                <TabsContent value="basic" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Amélioration automatique</Label>
                    <Button
                      variant={settings.enhance ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        updateSettings({ enhance: !settings.enhance })
                      }
                    >
                      {settings.enhance ? "Activé" : "Désactivé"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Améliore automatiquement votre description pour de meilleurs
                    résultats
                  </p>
                </TabsContent>
                <TabsContent value="advanced" className="space-y-4">
                  {settings.provider === "huggingface" && (
                    <div className="space-y-2">
                      <Label className="text-sm">Prompt négatif</Label>
                      <Textarea
                        placeholder="Éléments à éviter dans l'image..."
                        value={settings.negative_prompt || ""}
                        onChange={(e) =>
                          updateSettings({ negative_prompt: e.target.value })
                        }
                        rows={2}
                        className="resize-none text-sm"
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {step === "generating" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <LoadingSpinner size="lg" />
              <div className="text-center space-y-2">
                <h3 className="font-medium">Génération en cours...</h3>
                <p className="text-sm text-muted-foreground">
                  Création de votre image avec {providerInfo.name}
                </p>
                <div className="flex items-center justify-center gap-2">
                  {providerInfo.icon}
                  <Badge className={providerInfo.badgeColor}>
                    {providerInfo.badge}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Affichage de la dernière image générée */}
              {generatedImages.length > 0 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="font-medium text-green-600 mb-2">
                      ✅ Image générée avec succès !
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Voici votre image créée par l'IA
                    </p>
                  </div>

                  <div className="max-w-md mx-auto">
                    <div className="relative">
                      <img
                        src={generatedImages[0].url}
                        alt={generatedImages[0].prompt}
                        className="w-full h-auto rounded-lg shadow-lg"
                        style={{ maxHeight: "300px", objectFit: "contain" }}
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className={providerInfo.badgeColor}>
                          {providerInfo.icon}
                          <span className="ml-1">{providerInfo.badge}</span>
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm">
                        <strong>Prompt:</strong> {generatedImages[0].prompt}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {generatedImages[0].width}×{generatedImages[0].height} •{" "}
                        {generatedImages[0].model}
                      </p>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => downloadImage(generatedImages[0])}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => regenerateImage(generatedImages[0])}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Régénérer
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between border-t pt-4">
          {step !== "format" && step !== "success" && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isGenerating}
            >
              Retour
            </Button>
          )}
          {step === "format" && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
          )}
          {step === "prompt" && (
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isGenerating}
              >
                Annuler
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="min-w-[120px]"
              >
                {isGenerating ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Générer
                  </>
                )}
              </Button>
            </div>
          )}
          {step === "generating" && (
            <Button
              variant="outline"
              onClick={() => setStep("prompt")}
              className="ml-auto"
            >
              Annuler
            </Button>
          )}
          {step === "success" && (
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("format");
                  setPrompt("");
                  setSelectedFormat(null);
                }}
              >
                Nouvelle Image
              </Button>
              <Button onClick={() => onOpenChange(false)}>Fermer</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageGenerationModal;
