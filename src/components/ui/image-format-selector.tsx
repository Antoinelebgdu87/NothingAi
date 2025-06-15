import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Ratio,
  Monitor,
  Smartphone,
  Square,
  RectangleHorizontal,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";

interface ImageFormat {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  aspectRatio: string;
  icon: React.ReactNode;
  category: "social" | "print" | "web" | "custom";
}

const IMAGE_FORMATS: ImageFormat[] = [
  // Réseaux sociaux
  {
    id: "instagram-square",
    name: "Instagram Carré",
    description: "Post Instagram classique",
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
    icon: <Square className="w-4 h-4" />,
    category: "social",
  },
  {
    id: "instagram-story",
    name: "Instagram Story",
    description: "Story verticale",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    icon: <Smartphone className="w-4 h-4" />,
    category: "social",
  },
  {
    id: "facebook-cover",
    name: "Couverture Facebook",
    description: "Bannière de profil",
    width: 1200,
    height: 630,
    aspectRatio: "16:9",
    icon: <RectangleHorizontal className="w-4 h-4" />,
    category: "social",
  },
  {
    id: "twitter-header",
    name: "Bannière Twitter",
    description: "En-tête de profil",
    width: 1500,
    height: 500,
    aspectRatio: "3:1",
    icon: <RectangleHorizontal className="w-4 h-4" />,
    category: "social",
  },
  // Web
  {
    id: "banner-web",
    name: "Bannière Web",
    description: "Header de site web",
    width: 1920,
    height: 600,
    aspectRatio: "16:5",
    icon: <RectangleHorizontal className="w-4 h-4" />,
    category: "web",
  },
  {
    id: "blog-featured",
    name: "Image Blog",
    description: "Image mise en avant",
    width: 1200,
    height: 800,
    aspectRatio: "3:2",
    icon: <RectangleHorizontal className="w-4 h-4" />,
    category: "web",
  },
  // Impression
  {
    id: "poster-a4",
    name: "Affiche A4",
    description: "Format d'impression",
    width: 2480,
    height: 3508,
    aspectRatio: "A4",
    icon: <RectangleHorizontal className="w-4 h-4" />,
    category: "print",
  },
  {
    id: "business-card",
    name: "Carte de Visite",
    description: "Format standard",
    width: 1050,
    height: 600,
    aspectRatio: "7:4",
    icon: <RectangleHorizontal className="w-4 h-4" />,
    category: "print",
  },
  // Standards
  {
    id: "hd-landscape",
    name: "HD Paysage",
    description: "1280×720 pixels",
    width: 1280,
    height: 720,
    aspectRatio: "16:9",
    icon: <Monitor className="w-4 h-4" />,
    category: "web",
  },
  {
    id: "hd-portrait",
    name: "HD Portrait",
    description: "720×1280 pixels",
    width: 720,
    height: 1280,
    aspectRatio: "9:16",
    icon: <Smartphone className="w-4 h-4" />,
    category: "web",
  },
];

const QUALITY_PRESETS = [
  {
    id: "draft",
    name: "Brouillon",
    description: "Rapide, qualité basique",
    multiplier: 0.5,
    badge: "Rapide",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    id: "standard",
    name: "Standard",
    description: "Équilibre qualité/vitesse",
    multiplier: 1,
    badge: "Standard",
    badgeColor: "bg-green-100 text-green-700",
  },
  {
    id: "high",
    name: "Haute Qualité",
    description: "Meilleur rendu, plus lent",
    multiplier: 1.5,
    badge: "HD",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  {
    id: "ultra",
    name: "Ultra HD",
    description: "Qualité maximale",
    multiplier: 2,
    badge: "Ultra",
    badgeColor: "bg-orange-100 text-orange-700",
  },
];

interface ImageFormatSelectorProps {
  onFormatSelect: (format: {
    width: number;
    height: number;
    format: string;
    quality: string;
  }) => void;
  currentWidth?: number;
  currentHeight?: number;
  className?: string;
}

const ImageFormatSelector = ({
  onFormatSelect,
  currentWidth = 1024,
  currentHeight = 1024,
  className,
}: ImageFormatSelectorProps) => {
  const [selectedFormat, setSelectedFormat] = useState<ImageFormat | null>(
    null,
  );
  const [selectedQuality, setSelectedQuality] = useState("standard");
  const [customWidth, setCustomWidth] = useState(currentWidth);
  const [customHeight, setCustomHeight] = useState(currentHeight);
  const [activeTab, setActiveTab] = useState("presets");

  const handleFormatSelect = (format: ImageFormat) => {
    setSelectedFormat(format);
    const quality = QUALITY_PRESETS.find((q) => q.id === selectedQuality);
    const multiplier = quality?.multiplier || 1;

    const finalWidth = Math.round(format.width * multiplier);
    const finalHeight = Math.round(format.height * multiplier);

    onFormatSelect({
      width: finalWidth,
      height: finalHeight,
      format: format.name,
      quality: quality?.name || "Standard",
    });
  };

  const handleCustomFormat = () => {
    const quality = QUALITY_PRESETS.find((q) => q.id === selectedQuality);
    const multiplier = quality?.multiplier || 1;

    const finalWidth = Math.round(customWidth * multiplier);
    const finalHeight = Math.round(customHeight * multiplier);

    onFormatSelect({
      width: finalWidth,
      height: finalHeight,
      format: `${customWidth}×${customHeight}`,
      quality: quality?.name || "Standard",
    });
  };

  const getCategoryFormats = (category: string) => {
    return IMAGE_FORMATS.filter((format) => format.category === category);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Sélection de la qualité */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4" />
            Qualité de l'Image
          </CardTitle>
          <CardDescription className="text-xs">
            Choisissez le niveau de qualité souhaité
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {QUALITY_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedQuality(preset.id)}
                className={cn(
                  "p-3 rounded-lg border text-left transition-all",
                  selectedQuality === preset.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/50",
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{preset.name}</span>
                  <Badge
                    className={cn("text-xs px-2 py-0", preset.badgeColor)}
                    variant="secondary"
                  >
                    {preset.badge}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sélection du format */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Ratio className="w-4 h-4" />
            Format et Résolution
          </CardTitle>
          <CardDescription className="text-xs">
            Sélectionnez un format prédéfini ou personnalisez
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Onglets */}
            <div className="flex space-x-1 bg-muted p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("presets")}
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  activeTab === "presets"
                    ? "bg-background shadow-sm"
                    : "hover:bg-background/50",
                )}
              >
                Formats Prédéfinis
              </button>
              <button
                onClick={() => setActiveTab("custom")}
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  activeTab === "custom"
                    ? "bg-background shadow-sm"
                    : "hover:bg-background/50",
                )}
              >
                Personnalisé
              </button>
            </div>

            {activeTab === "presets" && (
              <div className="space-y-4">
                {/* Réseaux sociaux */}
                <div>
                  <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
                    <ImageIcon className="w-3 h-3" />
                    Réseaux Sociaux
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {getCategoryFormats("social").map((format) => (
                      <button
                        key={format.id}
                        onClick={() => handleFormatSelect(format)}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all",
                          selectedFormat?.id === format.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-primary/50",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {format.icon}
                            <div>
                              <div className="font-medium text-sm">
                                {format.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format.description}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono">
                              {format.width}×{format.height}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format.aspectRatio}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Web */}
                <div>
                  <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
                    <Monitor className="w-3 h-3" />
                    Web & Digital
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {getCategoryFormats("web").map((format) => (
                      <button
                        key={format.id}
                        onClick={() => handleFormatSelect(format)}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all",
                          selectedFormat?.id === format.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-primary/50",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {format.icon}
                            <div>
                              <div className="font-medium text-sm">
                                {format.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format.description}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono">
                              {format.width}×{format.height}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format.aspectRatio}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Impression */}
                <div>
                  <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
                    <RectangleHorizontal className="w-3 h-3" />
                    Impression
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {getCategoryFormats("print").map((format) => (
                      <button
                        key={format.id}
                        onClick={() => handleFormatSelect(format)}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all",
                          selectedFormat?.id === format.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-primary/50",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {format.icon}
                            <div>
                              <div className="font-medium text-sm">
                                {format.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format.description}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono">
                              {format.width}×{format.height}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format.aspectRatio}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "custom" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-width" className="text-xs">
                      Largeur (px)
                    </Label>
                    <Input
                      id="custom-width"
                      type="number"
                      min="256"
                      max="2048"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(parseInt(e.target.value))}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-height" className="text-xs">
                      Hauteur (px)
                    </Label>
                    <Input
                      id="custom-height"
                      type="number"
                      min="256"
                      max="2048"
                      value={customHeight}
                      onChange={(e) =>
                        setCustomHeight(parseInt(e.target.value))
                      }
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">
                    Aperçu du format:
                  </div>
                  <div className="text-sm font-mono">
                    {customWidth}×{customHeight} pixels
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Ratio: {(customWidth / customHeight).toFixed(2)}:1
                  </div>
                </div>

                <Button
                  onClick={handleCustomFormat}
                  className="w-full"
                  size="sm"
                >
                  Utiliser ce Format
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Résumé de la sélection */}
      {(selectedFormat || activeTab === "custom") && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1">
              Format sélectionné:
            </div>
            <div className="font-medium text-sm">
              {selectedFormat?.name || `${customWidth}×${customHeight}`}
            </div>
            <div className="text-xs text-muted-foreground">
              Qualité:{" "}
              {QUALITY_PRESETS.find((q) => q.id === selectedQuality)?.name}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImageFormatSelector;
