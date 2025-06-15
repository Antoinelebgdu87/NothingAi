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
import { Link } from "react-router-dom";
import { useChat } from "@/hooks/use-chat";
import ChatMessageComponent from "@/components/ui/chat-message";
import ImageUploadModal from "@/components/ui/image-upload-modal";
import ImageGenerationModal from "@/components/ui/image-generation-modal";
import GeneratedImagesDisplay from "@/components/ui/generated-images-display";
import ConversationSidebar from "@/components/ui/conversation-sidebar";
import { LogoGridBackground } from "@/components/ui/nothingai-logo";
import { PageLoading } from "@/components/ui/loading-spinner";
import { toast } from "sonner";

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
    regenerateLastMessage,
    exportChat,
    conversations,
    currentConversationId,
    loadConversationById,
    deleteConversation,
    getStats,
    clearAllData,
    imageAnalysis,
    imageGeneration,
  } = useChat();

  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showImageGeneration, setShowImageGeneration] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageSend = () => {
    if (imageAnalysis.hasImages) {
      setInput("Analyse ces images pour moi");
      setTimeout(() => {
        handleSubmit(new Event("submit") as any);
      }, 100);
    }
  };

  const getModelCategory = (modelId: string) => {
    if (recommendedModels.free.includes(modelId)) return "free";
    if (recommendedModels.affordable.includes(modelId)) return "affordable";
    if (recommendedModels.premium.includes(modelId)) return "premium";
    return "unknown";
  };

  const getModelIcon = (category: string) => {
    switch (category) {
      case "free":
        return <Zap className="w-3 h-3" />;
      case "affordable":
        return <Brain className="w-3 h-3" />;
      case "premium":
        return <Crown className="w-3 h-3" />;
      default:
        return <Sparkles className="w-3 h-3" />;
    }
  };

  const getModelColor = (category: string) => {
    switch (category) {
      case "free":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "affordable":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
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
            <NothingAIWordmark size="sm" />
            <Button
              variant="outline"
              size="sm"
              onClick={clearMessages}
              className="pro-button h-8 px-3 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Nouveau
            </Button>
          </div>

          {/* Simplified Navigation - Only Chat and History */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setShowImageUpload(true)}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Analyser des Images
              {imageAnalysis.hasImages && (
                <Badge className="ml-auto text-xs">
                  {imageAnalysis.uploadedImages.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Conversations History */}
        <div className="flex-1">
          <ConversationSidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            onLoadConversation={loadConversationById}
            onDeleteConversation={deleteConversation}
            onNewConversation={clearMessages}
            onExportConversation={exportChat}
            onClearAllData={clearAllData}
            stats={getStats()}
            className="border-0"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="pro-header">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu */}
              <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="lg:hidden">
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <div className="p-4 border-b">
                    <h1 className="text-xl font-bold">NothingAI</h1>
                  </div>
                  <div className="p-4 space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setShowImageUpload(true);
                        setShowSidebar(false);
                      }}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Analyser des Images
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setShowImageGeneration(true);
                        setShowSidebar(false);
                      }}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Générer une Image
                    </Button>

                    {imageGeneration.generatedImages.length > 0 && (
                      <Link to="/images">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => setShowSidebar(false)}
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Mes Images ({imageGeneration.generatedImages.length})
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

                    {/* Affichage des images générées */}
                    {imageGeneration.generatedImages.length > 0 && (
                      <div className="mt-4 px-2">
                        <GeneratedImagesDisplay />
                      </div>
                    )}
                  </div>
                  <ConversationSidebar
                    conversations={conversations}
                    currentConversationId={currentConversationId}
                    onLoadConversation={(id) => {
                      loadConversationById(id);
                      setShowSidebar(false);
                    }}
                    onDeleteConversation={deleteConversation}
                    onNewConversation={() => {
                      clearMessages();
                      setShowSidebar(false);
                    }}
                    onExportConversation={exportChat}
                    onClearAllData={clearAllData}
                    stats={getStats()}
                    className="border-0"
                  />
                </SheetContent>
              </Sheet>

              {/* Logo for mobile */}
              <div className="lg:hidden">
                <h1 className="text-lg font-bold">NothingAI</h1>
              </div>

              {/* Model Badge */}
              <Badge
                variant="outline"
                className={cn(
                  "pro-badge flex items-center space-x-1",
                  getModelColor(getModelCategory(settings.model)),
                )}
              >
                {getModelIcon(getModelCategory(settings.model))}
                <span className="text-xs font-medium">
                  {settings.model
                    .split("/")
                    .pop()
                    ?.replace("-instruct", "")
                    .replace(":free", "")}
                </span>
              </Badge>

              {/* Feature indicators */}
              <div className="hidden md:flex items-center space-x-2">
                {imageAnalysis.hasImages && (
                  <Badge className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
                    <ImageIcon className="w-3 h-3 mr-1" />
                    {imageAnalysis.uploadedImages.length} image(s) prête(s)
                  </Badge>
                )}
                {imageGeneration.generatedImages.length > 0 && (
                  <Badge className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/20">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {imageGeneration.generatedImages.length} générée(s)
                  </Badge>
                )}
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2">
              {/* Settings */}
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="focus-ring">
                    <Settings className="w-4 h-4 mr-2" />
                    Paramètres
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto glass-card">
                  <DialogHeader>
                    <DialogTitle>Paramètres de Chat</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Model Selection */}
                    <div className="space-y-3">
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
                                        ?.replace("-instruct", "")
                                        .replace(":free", "")}
                                    </span>
                                    <Badge className="bg-green-500/10 text-green-500 text-xs">
                                      Gratuit
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                            <div className="mb-2">
                              <h4 className="text-sm font-medium text-blue-500 mb-1 flex items-center">
                                <Brain className="w-3 h-3 mr-1" />
                                Modèles Abordables
                              </h4>
                              {recommendedModels.affordable.map((model) => (
                                <SelectItem key={model} value={model}>
                                  <div className="flex items-center space-x-2">
                                    <span>
                                      {model
                                        .split("/")
                                        .pop()
                                        ?.replace("-instruct", "")}
                                    </span>
                                    <Badge className="bg-blue-500/10 text-blue-500 text-xs">
                                      Pro
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
                                      Premium
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          </div>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Temperature */}
                    <div className="space-y-3">
                      <Label>Température: {settings.temperature}</Label>
                      <Slider
                        value={[settings.temperature]}
                        onValueChange={([value]) =>
                          updateSettings({ temperature: value })
                        }
                        min={0}
                        max={2}
                        step={0.1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Contrôle la créativité. Plus bas = plus focalisé, Plus
                        haut = plus créatif
                      </p>
                    </div>

                    {/* Max Tokens */}
                    <div className="space-y-3">
                      <Label>Max Tokens: {settings.maxTokens}</Label>
                      <Slider
                        value={[settings.maxTokens]}
                        onValueChange={([value]) =>
                          updateSettings({ maxTokens: value })
                        }
                        min={256}
                        max={4096}
                        step={256}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Longueur maximale des réponses de l'IA
                      </p>
                    </div>

                    {/* System Message */}
                    <div className="space-y-3">
                      <Label>Message Système</Label>
                      <Textarea
                        value={settings.systemMessage}
                        onChange={(e) =>
                          updateSettings({ systemMessage: e.target.value })
                        }
                        placeholder="Entrez les instructions système..."
                        className="min-h-[100px] focus-ring"
                      />
                      <p className="text-xs text-muted-foreground">
                        Instructions qui guident le comportement et la
                        personnalité de l'IA
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1">
            <div
              className="max-w-4xl mx-auto"
              onDrop={imageAnalysis.handleDrop}
              onDragOver={imageAnalysis.handleDragOver}
              onDragLeave={imageAnalysis.handleDragLeave}
            >
              {/* Drop overlay */}
              {imageAnalysis.isDragging && (
                <div className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center">
                  <div className="glass-card rounded-2xl p-8 text-center border-2 border-dashed border-primary">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-primary" />
                    <p className="text-xl font-semibold mb-2">
                      Relâchez pour analyser vos images
                    </p>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG, GIF, WebP jusqu'�� 10MB
                    </p>
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <ChatMessageComponent
                  key={message.id}
                  message={message}
                  onRegenerate={regenerateLastMessage}
                  showRegenerate={
                    index === messages.length - 1 &&
                    message.role === "assistant" &&
                    !message.isStreaming
                  }
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border/30 bg-card/30 backdrop-blur-md">
            <div className="max-w-4xl mx-auto p-6">
              {/* Stop Generation Button */}
              {isStreaming && (
                <div className="mb-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={stopGeneration}
                    className="flex items-center space-x-2 hover-lift focus-ring"
                  >
                    <StopCircle className="w-4 h-4" />
                    <span>Arrêter la génération</span>
                  </Button>
                </div>
              )}

              {/* Image Preview */}
              {imageAnalysis.hasImages && (
                <div className="mb-4 p-3 bg-muted/20 rounded-xl border border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <ImageIcon className="w-4 h-4" />
                      <span>
                        {imageAnalysis.uploadedImages.length} image(s) prête(s)
                        pour l'analyse
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={imageAnalysis.clearAllImages}
                      className="h-7 px-2 text-xs"
                    >
                      Supprimer tout
                    </Button>
                  </div>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative flex items-end space-x-2">
                  {/* Attachment Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowImageUpload(true)}
                    className={cn(
                      "mb-1 focus-ring",
                      imageAnalysis.hasImages && "bg-primary/10 text-primary",
                    )}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>

                  {/* Image Generation Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowImageGeneration(true)}
                    className="mb-1 focus-ring"
                    title="Générer une image avec IA"
                  >
                    <Sparkles className="w-4 h-4" />
                  </Button>

                  {/* Text Input */}
                  <div className="relative flex-1">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        imageAnalysis.hasImages
                          ? "Posez une question sur vos images..."
                          : "Envoyez un message à NothingAI... (ou 'génère une image de...')"
                      }
                      disabled={isStreaming}
                      className="pro-input pr-14 resize-none"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!input.trim() || isStreaming}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 p-0 pro-button"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={exportChat}
                      className="h-7 px-2 hover-lift"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Exporter
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearMessages();
                        toast.success("Chat effacé !");
                      }}
                      className="h-7 px-2 hover-lift"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Nouveau chat
                    </Button>
                  </div>
                  <span>
                    <kbd className="px-2 py-1 bg-muted/50 rounded text-xs">
                      ⏎
                    </kbd>{" "}
                    pour envoyer •{" "}
                    <span className="text-blue-400">
                      Analyse d'images • Génération gratuite
                    </span>
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      <ImageUploadModal
        open={showImageUpload}
        onOpenChange={setShowImageUpload}
        images={imageAnalysis.uploadedImages}
        onImagesAdd={imageAnalysis.addImages}
        onImageRemove={imageAnalysis.removeImage}
        onClearAll={imageAnalysis.clearAllImages}
        onSend={handleImageSend}
        isDragging={imageAnalysis.isDragging}
        onDrop={imageAnalysis.handleDrop}
        onDragOver={imageAnalysis.handleDragOver}
        onDragLeave={imageAnalysis.handleDragLeave}
      />

      {/* Image Generation Modal */}
      <ImageGenerationModal
        open={showImageGeneration}
        onOpenChange={setShowImageGeneration}
        initialPrompt={
          imageGeneration.detectImageGenerationIntent(input) ? input : ""
        }
      />
    </div>
  );
};

export default Index;
