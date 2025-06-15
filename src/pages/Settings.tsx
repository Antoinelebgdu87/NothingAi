import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Settings as SettingsIcon,
  Palette,
  Image as ImageIcon,
  Shield,
  Download,
  Upload,
  RotateCcw,
  Save,
  Info,
  Zap,
  Crown,
  Brain,
} from "lucide-react";
import LogoCustomizer from "@/components/ui/logo-customizer";
import ImageFormatSelector from "@/components/ui/image-format-selector";
import { NothingAIWordmark } from "@/components/ui/nothingai-logo";
import { useChat } from "@/hooks/use-chat";
import { useImageGeneration } from "@/hooks/use-image-generation";
import { toast } from "sonner";

const Settings = () => {
  const { settings, updateSettings, exportChat, getStats, clearAllData } =
    useChat();
  const { settings: imageSettings, updateSettings: updateImageSettings } =
    useImageGeneration();

  const [activeTab, setActiveTab] = useState("general");
  const [showLogoCustomizer, setShowLogoCustomizer] = useState(false);

  const handleExportSettings = () => {
    const allSettings = {
      chat: settings,
      image: imageSettings,
      timestamp: new Date().toISOString(),
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(allSettings, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nothingai-settings-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Paramètres exportés avec succès !");
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        if (settings.chat) updateSettings(settings.chat);
        if (settings.image) updateImageSettings(settings.image);
        toast.success("Paramètres importés avec succès !");
      } catch (error) {
        toast.error("Erreur lors de l'importation des paramètres");
      }
    };
    reader.readAsText(file);
  };

  const resetAllSettings = () => {
    // Reset chat settings to defaults
    updateSettings({
      model: "microsoft/wizardlm-2-8x22b:free",
      temperature: 0.7,
      maxTokens: 2048,
      systemMessage:
        "Tu es NothingAI, un assistant IA français professionnel, utile et bienveillant. Tu réponds toujours en français avec précision et empathie. Tu peux analyser des images et aider avec la génération d'images. Tu es créé par l'équipe NothingAI en France.",
    });

    // Reset image settings to defaults
    updateImageSettings({
      provider: "pollinations",
      pollinationsModel: "flux",
      huggingFaceModel: "stabilityai/stable-diffusion-2",
      width: 1024,
      height: 1024,
      enhance: true,
    });

    toast.success("Tous les paramètres ont été réinitialisés !");
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <NothingAIWordmark size="lg" />
              <div>
                <h1 className="text-3xl font-bold">Paramètres</h1>
                <p className="text-muted-foreground">
                  Personnalisez votre expérience NothingAI
                </p>
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary">
              <SettingsIcon className="w-3 h-3 mr-1" />
              Version 1.0
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              Général
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Apparence
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Images
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Sécurité
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <Info className="w-4 h-4" />À propos
            </TabsTrigger>
          </TabsList>

          {/* Onglet Général */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de Chat</CardTitle>
                <CardDescription>
                  Configurez le comportement de votre assistant IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Modèle IA */}
                <div className="space-y-3">
                  <Label>Modèle IA Actuel</Label>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Brain className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {settings.model
                              .split("/")
                              .pop()
                              ?.replace("-instruct", "")
                              .replace(":free", "")}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {settings.model}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700">
                        Gratuit
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Modèle d'IA utilisé pour les conversations. Les modèles
                    gratuits offrent d'excellentes performances sans limite.
                  </p>
                </div>

                {/* Température */}
                <div className="space-y-3">
                  <Label>
                    Créativité (Température): {settings.temperature}
                  </Label>
                  <div className="px-4">
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={settings.temperature}
                      onChange={(e) =>
                        updateSettings({
                          temperature: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Précis</span>
                      <span>Équilibré</span>
                      <span>Créatif</span>
                    </div>
                  </div>
                </div>

                {/* Longueur des réponses */}
                <div className="space-y-3">
                  <Label>
                    Longueur maximale des réponses: {settings.maxTokens} tokens
                  </Label>
                  <div className="px-4">
                    <input
                      type="range"
                      min="256"
                      max="4096"
                      step="256"
                      value={settings.maxTokens}
                      onChange={(e) =>
                        updateSettings({ maxTokens: parseInt(e.target.value) })
                      }
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Court</span>
                      <span>Moyen</span>
                      <span>Long</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gestion des données */}
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Données</CardTitle>
                <CardDescription>
                  Exportez, importez ou supprimez vos données
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    onClick={handleExportSettings}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exporter Paramètres
                  </Button>

                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportSettings}
                      className="hidden"
                      id="import-settings"
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        document.getElementById("import-settings")?.click()
                      }
                      className="flex items-center gap-2 w-full"
                    >
                      <Upload className="w-4 h-4" />
                      Importer Paramètres
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={resetAllSettings}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Réinitialiser Tout
                  </Button>
                </div>

                <Separator />

                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <h4 className="font-medium text-destructive mb-2">
                    Zone de Danger
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Cette action supprimera définitivement toutes vos
                    conversations et données.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (
                        confirm(
                          "Êtes-vous sûr de vouloir supprimer toutes vos données ? Cette action est irréversible.",
                        )
                      ) {
                        clearAllData();
                        toast.success("Toutes les données ont été supprimées");
                      }
                    }}
                  >
                    Supprimer Toutes les Données
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Apparence */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personnalisation du Logo</CardTitle>
                <CardDescription>
                  Personnalisez l'apparence du logo NothingAI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog
                  open={showLogoCustomizer}
                  onOpenChange={setShowLogoCustomizer}
                >
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Palette className="w-4 h-4 mr-2" />
                      Ouvrir le Personnalisateur de Logo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Personnalisateur de Logo</DialogTitle>
                    </DialogHeader>
                    <LogoCustomizer
                      onSave={(customization) => {
                        console.log("Logo customization saved:", customization);
                        setShowLogoCustomizer(false);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Statistiques */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiques d'Utilisation</CardTitle>
                <CardDescription>
                  Aperçu de votre activité sur NothingAI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {stats.totalConversations}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Conversations
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {stats.totalMessages}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Messages
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {stats.avgMessagesPerConversation}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Moy./Conv.
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(stats.totalStorageUsed / 1024)} KB
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Stockage
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Images */}
          <TabsContent value="images" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de Génération d'Images</CardTitle>
                <CardDescription>
                  Configurez les paramètres par défaut pour la génération
                  d'images
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Fournisseur par défaut */}
                <div className="space-y-3">
                  <Label>Fournisseur IA par Défaut</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() =>
                        updateImageSettings({ provider: "pollinations" })
                      }
                      className={cn(
                        "p-4 rounded-lg border text-left transition-all",
                        imageSettings.provider === "pollinations"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-green-500" />
                        <span className="font-medium">Pollinations</span>
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          Gratuit
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Génération rapide et illimitée avec le modèle Flux
                      </p>
                    </button>

                    <button
                      onClick={() =>
                        updateImageSettings({ provider: "huggingface" })
                      }
                      className={cn(
                        "p-4 rounded-lg border text-left transition-all",
                        imageSettings.provider === "huggingface"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="w-5 h-5 text-purple-500" />
                        <span className="font-medium">Hugging Face</span>
                        <Badge className="bg-purple-100 text-purple-700 text-xs">
                          Pro
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Stable Diffusion haute qualité avec contrôles avancés
                      </p>
                    </button>
                  </div>
                </div>

                {/* Résolution par défaut */}
                <div className="space-y-3">
                  <Label>Format par Défaut</Label>
                  <ImageFormatSelector
                    onFormatSelect={(format) => {
                      updateImageSettings({
                        width: format.width,
                        height: format.height,
                      });
                      toast.success(
                        `Format par défaut défini: ${format.format}`,
                      );
                    }}
                    currentWidth={imageSettings.width}
                    currentHeight={imageSettings.height}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Sécurité */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Modération de Contenu</CardTitle>
                <CardDescription>
                  NothingAI intègre des systèmes de sécurité avancés
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">
                        Filtrage NSFW
                      </span>
                    </div>
                    <p className="text-sm text-green-700">
                      Protection automatique contre le contenu inapproprié
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">
                        Données Locales
                      </span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Vos conversations restent sur votre appareil
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">
                    Fonctionnalités de Sécurité
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Filtrage intelligent du contenu
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Suggestions alternatives automatiques
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Stockage local des conversations
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Aucune collecte de données personnelles
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet À propos */}
          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>À propos de NothingAI</CardTitle>
                <CardDescription>
                  Assistant IA français professionnel et gratuit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  <NothingAIWordmark size="lg" />
                  <div>
                    <h3 className="text-xl font-semibold">
                      NothingAI Version 1.0
                    </h3>
                    <p className="text-muted-foreground">
                      Assistant IA professionnel développé en France
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Fonctionnalités</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>💬 Chat conversationnel avancé</li>
                      <li>📸 Analyse d'images intelligente</li>
                      <li>🎨 Génération d'images IA</li>
                      <li>💾 Stockage local sécurisé</li>
                      <li>🛡️ Modération de contenu</li>
                      <li>🎯 Interface professionnelle</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Technologies</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>🤖 OpenRouter API</li>
                      <li>🎨 Pollinations.ai</li>
                      <li>🔧 Hugging Face</li>
                      <li>⚛️ React + TypeScript</li>
                      <li>🎨 Tailwind CSS</li>
                      <li>📱 Progressive Web App</li>
                    </ul>
                  </div>
                </div>

                <Separator />

                <div className="text-center text-sm text-muted-foreground">
                  <p>
                    Développé avec ❤️ en France • Open Source • Gratuit et sans
                    limite
                  </p>
                  <p className="mt-2">
                    © 2024 NothingAI - Tous droits réservés
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
