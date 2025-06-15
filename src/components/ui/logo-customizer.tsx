import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Upload,
  Download,
  Palette,
  Type,
  Sparkles,
  RotateCcw,
  Eye,
  Save,
  Wand2,
} from "lucide-react";
import NothingAILogo, { NothingAIWordmark } from "./nothingai-logo";
import { useImageGeneration } from "@/hooks/use-image-generation";
import { toast } from "sonner";

interface LogoCustomization {
  text: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  size: "sm" | "md" | "lg" | "xl";
  showFlag: boolean;
  customImage?: string;
  style: "modern" | "classic" | "minimal" | "playful";
}

const DEFAULT_CUSTOMIZATION: LogoCustomization = {
  text: "NothingAI",
  primaryColor: "#10b981", // emerald-500
  secondaryColor: "#059669", // emerald-600
  backgroundColor: "#ffffff",
  size: "lg",
  showFlag: true,
  style: "modern",
};

const LOGO_STYLES = [
  {
    id: "modern",
    name: "Moderne",
    description: "Design épuré avec des effets de gradient",
  },
  {
    id: "classic",
    name: "Classique",
    description: "Style professionnel et intemporel",
  },
  {
    id: "minimal",
    name: "Minimaliste",
    description: "Design simple et efficace",
  },
  {
    id: "playful",
    name: "Ludique",
    description: "Style créatif avec des effets visuels",
  },
];

const COLOR_PRESETS = [
  { name: "Émeraude", primary: "#10b981", secondary: "#059669" },
  { name: "Bleu", primary: "#3b82f6", secondary: "#1d4ed8" },
  { name: "Violet", primary: "#8b5cf6", secondary: "#7c3aed" },
  { name: "Orange", primary: "#f97316", secondary: "#ea580c" },
  { name: "Rose", primary: "#ec4899", secondary: "#db2777" },
  { name: "Cyan", primary: "#06b6d4", secondary: "#0891b2" },
];

interface LogoCustomizerProps {
  onSave?: (customization: LogoCustomization) => void;
  className?: string;
}

const LogoCustomizer = ({ onSave, className }: LogoCustomizerProps) => {
  const [customization, setCustomization] = useState<LogoCustomization>(
    DEFAULT_CUSTOMIZATION,
  );
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { generateImage } = useImageGeneration();

  const updateCustomization = (updates: Partial<LogoCustomization>) => {
    setCustomization((prev) => ({ ...prev, ...updates }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        updateCustomization({ customImage: result });
        toast.success("Image uploadée avec succès");
      };
      reader.readAsDataURL(file);
    }
  };

  const generateLogoWithAI = async () => {
    try {
      setIsGeneratingLogo(true);

      const prompt = `Professional logo design for "${customization.text}", ${customization.style} style, minimalist, corporate branding, high quality, vector style, clean design, modern typography, ${customization.primaryColor} color scheme`;

      await generateImage(prompt);
      toast.success("Logo généré ! Consultez vos images générées.");
    } catch (error) {
      toast.error("Erreur lors de la génération du logo");
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const resetToDefault = () => {
    setCustomization(DEFAULT_CUSTOMIZATION);
    toast.success("Personnalisation réinitialisée");
  };

  const handleSave = () => {
    onSave?.(customization);
    toast.success("Personnalisation sauvegardée");
  };

  const downloadLogo = () => {
    // Créer un élément temporaire pour le téléchargement
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (ctx) {
      canvas.width = 400;
      canvas.height = 400;

      // Dessiner le logo sur le canvas (version simplifiée)
      ctx.fillStyle = customization.backgroundColor;
      ctx.fillRect(0, 0, 400, 400);

      // Ajouter le texte (version basique)
      ctx.fillStyle = customization.primaryColor;
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.fillText(customization.text, 200, 200);

      // Télécharger
      const link = document.createElement("a");
      link.download = `${customization.text.toLowerCase()}-logo.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast.success("Logo téléchargé !");
    }
  };

  const CustomLogoPreview = () => (
    <div
      className={cn(
        "relative rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300",
        customization.size === "sm" && "w-16 h-16",
        customization.size === "md" && "w-20 h-20",
        customization.size === "lg" && "w-24 h-24",
        customization.size === "xl" && "w-32 h-32",
      )}
      style={{
        background: customization.customImage
          ? `url(${customization.customImage})`
          : `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {!customization.customImage && (
        <>
          <Sparkles
            className={cn(
              "text-white drop-shadow-sm",
              customization.size === "sm" && "w-8 h-8",
              customization.size === "md" && "w-10 h-10",
              customization.size === "lg" && "w-12 h-12",
              customization.size === "xl" && "w-16 h-16",
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />
        </>
      )}
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Aperçu en temps réel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Aperçu du Logo
          </CardTitle>
          <CardDescription>
            Visualisez vos modifications en temps réel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="p-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: customization.backgroundColor }}
          >
            <div className="flex items-center space-x-4">
              <CustomLogoPreview />
              <div className="flex flex-col">
                <h1
                  className={cn(
                    "font-bold leading-none",
                    customization.size === "sm" && "text-lg",
                    customization.size === "md" && "text-xl",
                    customization.size === "lg" && "text-2xl",
                    customization.size === "xl" && "text-3xl",
                  )}
                  style={{ color: customization.primaryColor }}
                >
                  {customization.text}
                </h1>
                {customization.showFlag && (
                  <div className="flex items-center space-x-1 mt-1">
                    <div className="flex rounded-sm overflow-hidden w-4 h-3 border border-border/30">
                      <div className="flex-1 bg-blue-600" />
                      <div className="flex-1 bg-white" />
                      <div className="flex-1 bg-red-600" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      France
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Aperçu Complet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Aperçu du Logo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-lg border">
                      <p className="text-xs text-muted-foreground mb-2">
                        Sur fond blanc
                      </p>
                      <div className="flex items-center space-x-3">
                        <CustomLogoPreview />
                        <span
                          className="font-bold text-xl"
                          style={{ color: customization.primaryColor }}
                        >
                          {customization.text}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 bg-black rounded-lg border">
                      <p className="text-xs text-white/70 mb-2">
                        Sur fond noir
                      </p>
                      <div className="flex items-center space-x-3">
                        <CustomLogoPreview />
                        <span
                          className="font-bold text-xl"
                          style={{ color: customization.primaryColor }}
                        >
                          {customization.text}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={downloadLogo}>
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Personnalisation du texte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Texte et Style
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo-text">Texte du logo</Label>
            <Input
              id="logo-text"
              value={customization.text}
              onChange={(e) => updateCustomization({ text: e.target.value })}
              placeholder="Nom de votre marque"
            />
          </div>

          <div className="space-y-2">
            <Label>Style du logo</Label>
            <Select
              value={customization.style}
              onValueChange={(value: LogoCustomization["style"]) =>
                updateCustomization({ style: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOGO_STYLES.map((style) => (
                  <SelectItem key={style.id} value={style.id}>
                    <div>
                      <div className="font-medium">{style.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {style.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Taille</Label>
            <Select
              value={customization.size}
              onValueChange={(value: LogoCustomization["size"]) =>
                updateCustomization({ size: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Petit</SelectItem>
                <SelectItem value="md">Moyen</SelectItem>
                <SelectItem value="lg">Grand</SelectItem>
                <SelectItem value="xl">Très Grand</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Afficher le drapeau français</Label>
            <Button
              variant={customization.showFlag ? "default" : "outline"}
              size="sm"
              onClick={() =>
                updateCustomization({ showFlag: !customization.showFlag })
              }
            >
              {customization.showFlag ? "Affiché" : "Masqué"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Couleurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Couleurs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Palettes prédéfinies</Label>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() =>
                    updateCustomization({
                      primaryColor: preset.primary,
                      secondaryColor: preset.secondary,
                    })
                  }
                  className="p-2 rounded-lg border text-left hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </div>
                  <div className="text-xs font-medium">{preset.name}</div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Couleur principale</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={customization.primaryColor}
                  onChange={(e) =>
                    updateCustomization({ primaryColor: e.target.value })
                  }
                  className="w-12 h-10 p-1 border rounded-md"
                />
                <Input
                  type="text"
                  value={customization.primaryColor}
                  onChange={(e) =>
                    updateCustomization({ primaryColor: e.target.value })
                  }
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color">Couleur secondaire</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={customization.secondaryColor}
                  onChange={(e) =>
                    updateCustomization({ secondaryColor: e.target.value })
                  }
                  className="w-12 h-10 p-1 border rounded-md"
                />
                <Input
                  type="text"
                  value={customization.secondaryColor}
                  onChange={(e) =>
                    updateCustomization({ secondaryColor: e.target.value })
                  }
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bg-color">Couleur d'arrière-plan</Label>
            <div className="flex gap-2">
              <Input
                id="bg-color"
                type="color"
                value={customization.backgroundColor}
                onChange={(e) =>
                  updateCustomization({ backgroundColor: e.target.value })
                }
                className="w-12 h-10 p-1 border rounded-md"
              />
              <Input
                type="text"
                value={customization.backgroundColor}
                onChange={(e) =>
                  updateCustomization({ backgroundColor: e.target.value })
                }
                className="font-mono text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image personnalisée */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Image Personnalisée
          </CardTitle>
          <CardDescription>
            Remplacez l'icône par votre propre image (optionnel)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choisir une image
            </Button>

            {customization.customImage && (
              <Button
                variant="outline"
                onClick={() => updateCustomization({ customImage: undefined })}
              >
                Supprimer
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Formats acceptés: JPG, PNG, SVG (max 5MB)
          </p>
        </CardContent>
      </Card>

      {/* Génération IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Génération IA
          </CardTitle>
          <CardDescription>
            Laissez l'IA créer un logo unique pour vous
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={generateLogoWithAI}
            disabled={isGeneratingLogo}
            className="w-full"
          >
            {isGeneratingLogo ? (
              "Génération en cours..."
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Générer un Logo IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Sauvegarder
        </Button>
        <Button variant="outline" onClick={resetToDefault}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Réinitialiser
        </Button>
      </div>
    </div>
  );
};

export default LogoCustomizer;
