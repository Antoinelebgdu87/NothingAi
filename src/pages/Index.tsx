import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "react-router-dom";
import {
  Send,
  Settings,
  Download,
  Trash2,
  StopCircle,
  Brain,
  Zap,
  Crown,
  Menu,
  Image as ImageIcon,
  Sparkles,
  Plus,
  MessageSquare,
  Paperclip,
  History,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useImageGeneration } from "@/hooks/use-image-generation";
import { useChat } from "@/hooks/use-chat";
import { useMobile } from "@/hooks/use-mobile";
import { LogoGridBackground } from "@/components/ui/nothingai-logo";
import ChatMessageComponent from "@/components/ui/chat-message";
import ImageUploadModal from "@/components/ui/image-upload-modal";
import ImageGenerationModal from "@/components/ui/image-generation-modal";
import GeneratedImagesDisplay from "@/components/ui/generated-images-display";
import ConversationSidebar from "@/components/ui/conversation-sidebar";
import { PageLoading } from "@/components/ui/loading-spinner";
import DeleteAccountButton from "@/components/ui/delete-account-button";

const Index = () => {
  const {
    messages,
    settings,
    isStreaming,
    isLoading,
    availableModels,
    modelsLoading,
    recommendedModels,
    sendMessage,
    stopGeneration,
    clearMessages,
    updateSettings,
  } = useChat();

  const imageGeneration = useImageGeneration();
  const isMobile = useMobile();

  const [prompt, setPrompt] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isStreaming) return;

    const currentPrompt = prompt;
    setPrompt("");
    await sendMessage(currentPrompt);
  };

  const getModelCategory = (modelName: string) => {
    if (recommendedModels.free.includes(modelName)) return "free";
    if (recommendedModels.premium.includes(modelName)) return "premium";
    return "unknown";
  };

  const getModelIcon = (category: string) => {
    switch (category) {
      case "free":
        return <Zap className="w-4 h-4" />;
      case "premium":
        return <Crown className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getModelColor = (category: string) => {
    switch (category) {
      case "free":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "premium":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (modelsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LogoGridBackground />
        <PageLoading message="Initialisation de NothingAI..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-professional-gradient flex">
      {/* Background Pattern */}
      <LogoGridBackground />

      {/* Sidebar */}
      <div className="hidden lg:flex w-80 flex-col border-r border-border/50 pro-sidebar">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-xl font-bold">NothingAI</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => clearMessages()}
              className="w-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle conversation
            </Button>

            <Button
              onClick={() => setShowGenerationModal(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Générer une image
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-2">
          {imageGeneration.generatedImages.length > 0 && (
            <Link to="/images">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setShowSidebar(false)}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Images générées
                <Badge className="ml-auto bg-primary text-primary-foreground">
                  {imageGeneration.generatedImages.length}
                </Badge>
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
            </Link>
          )}

          <Link to="/settings">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setShowSidebar(false)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
              <ExternalLink className="w-3 h-3 ml-auto" />
            </Button>
          </Link>

          {/* Bouton Supprimer Compte */}
          <DeleteAccountButton />
        </div>

        {/* Affichage des images générées */}
        {imageGeneration.generatedImages.length > 0 && (
          <div className="mt-4 px-2">
            <GeneratedImagesDisplay />
          </div>
        )}

        {/* Conversations */}
        <ConversationSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header Mobile */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/95 backdrop-blur-sm">
            <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>NothingAI</SheetTitle>
                </SheetHeader>
                <div className="p-4">
                  <DeleteAccountButton />
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center space-x-2">
              <Badge
                className={cn(
                  "text-xs border",
                  getModelColor(getModelCategory(settings.model)),
                )}
              >
                {getModelIcon(getModelCategory(settings.model))}
                <span className="ml-1">
                  {settings.model?.split("/").pop()?.replace("-instruct", "")}
                </span>
              </Badge>
            </div>

            {/* Settings */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="w-4 h-4 mr-2" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Paramètres IA</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Modèle IA</Label>
                    <Select
                      value={settings.model}
                      onValueChange={(value) =>
                        updateSettings({ model: value })
                      }
                    >
                      <SelectTrigger className="focus-ring">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <div className="mb-2">
                            <h4 className="text-sm font-medium text-green-500 mb-1 flex items-center">
                              <Zap className="w-3 h-3 mr-1" />
                              Modèles Gratuits
                            </h4>
                            {recommendedModels.free.map((model) => (
                              <SelectItem key={model} value={model}>
                                <div className="flex items-center space-x-2">
                                  <span>
                                    {model
                                      .split("/")
                                      .pop()
                                      ?.replace("-instruct", "")}
                                  </span>
                                  <Badge className="bg-green-500/10 text-green-500 text-xs">
                                    Gratuit
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-purple-500 mb-1 flex items-center">
                              <Crown className="w-3 h-3 mr-1" />
                              Modèles Premium
                            </h4>
                            {recommendedModels.premium.map((model) => (
                              <SelectItem key={model} value={model}>
                                <div className="flex items-center space-x-2">
                                  <span>
                                    {model
                                      .split("/")
                                      .pop()
                                      ?.replace("-instruct", "")}
                                  </span>
                                  <Badge className="bg-purple-500/10 text-purple-500 text-xs">
                                    Pro
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        </div>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Température: {settings.temperature}</Label>
                      <Slider
                        value={[settings.temperature]}
                        onValueChange={(value) =>
                          updateSettings({ temperature: value })
                        }
                        max={2}
                        min={0}
                        step={0.1}
                        className="focus-ring"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Max Tokens: {settings.maxTokens}</Label>
                      <Slider
                        value={[settings.maxTokens]}
                        onValueChange={(value) =>
                          updateSettings({ maxTokens: value })
                        }
                        max={8000}
                        min={100}
                        step={100}
                        className="focus-ring"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Message système</Label>
                      <Textarea
                        value={settings.systemMessage}
                        onChange={(e) =>
                          updateSettings({ systemMessage: e.target.value })
                        }
                        className="focus-ring"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold mb-2">
                  Bienvenue sur NothingAI
                </h1>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Votre assistant IA intelligent. Posez-moi n'importe quelle
                  question ou demandez-moi de générer du contenu créatif.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left"
                    onClick={() =>
                      setPrompt("Explique-moi comment fonctionne l'IA")
                    }
                  >
                    <div>
                      <div className="font-medium">
                        Comment fonctionne l'IA ?
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Découvrez les concepts de base
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left"
                    onClick={() => setPrompt("Écris-moi un poème sur l'océan")}
                  >
                    <div>
                      <div className="font-medium">Créer du contenu</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Poèmes, histoires, articles...
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left"
                    onClick={() =>
                      setPrompt(
                        "Aide-moi à créer un plan d'entraînement sportif",
                      )
                    }
                  >
                    <div>
                      <div className="font-medium">Conseils personnalisés</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Santé, fitness, nutrition...
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left"
                    onClick={() => setShowGenerationModal(true)}
                  >
                    <div>
                      <div className="font-medium">Générer des images</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Art, illustrations, concepts...
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <ChatMessageComponent
                    key={index}
                    message={message}
                    onRegenerate={
                      message.role === "assistant"
                        ? () => {
                            const userMessage = messages[index - 1];
                            if (userMessage) {
                              sendMessage(userMessage.content);
                            }
                          }
                        : undefined
                    }
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border/50 bg-card/95 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="pr-20 focus-ring"
                  disabled={isStreaming}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setShowImageModal(true)}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {isStreaming ? (
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  onClick={stopGeneration}
                >
                  <StopCircle className="w-4 h-4" />
                </Button>
              ) : (
                <Button type="submit" size="icon" disabled={!prompt.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ImageUploadModal
        open={showImageModal}
        onOpenChange={setShowImageModal}
        onImageSelect={(file) => {
          console.log("Image sélectionnée:", file);
          setShowImageModal(false);
        }}
      />

      <ImageGenerationModal
        open={showGenerationModal}
        onOpenChange={setShowGenerationModal}
      />
    </div>
  );
};

export default Index;
