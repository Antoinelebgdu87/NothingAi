import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  X,
  Image as ImageIcon,
  History,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import ChatMessageComponent from "@/components/ui/chat-message";
import ImageUpload from "@/components/ui/image-upload";
import ConversationSidebar from "@/components/ui/conversation-sidebar";
import {
  NothingAIWordmark,
  LogoGridBackground,
} from "@/components/ui/nothingai-logo";
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
  } = useChat();

  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
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
    setShowImageUpload(false); // Hide image upload after sending
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
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
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "affordable":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "premium":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
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
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background Pattern */}
      <LogoGridBackground />

      {/* Header */}
      <header className="glass-card border-b border-white/10 sticky top-0 z-50 bg-white-gradient">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            {/* Mobile Menu */}
            <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
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
                />
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <NothingAIWordmark size="sm" />
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-2">
            {/* Model Badge */}
            <Badge
              variant="outline"
              className={cn(
                "hidden sm:flex items-center space-x-1 glass",
                getModelColor(getModelCategory(settings.model)),
              )}
            >
              {getModelIcon(getModelCategory(settings.model))}
              <span className="text-xs">
                {settings.model
                  .split("/")
                  .pop()
                  ?.replace("-instruct", "")
                  .replace(":free", "")}
              </span>
            </Badge>

            {/* Image Upload Toggle */}
            <Button
              variant={showImageUpload ? "default" : "outline"}
              size="sm"
              onClick={() => setShowImageUpload(!showImageUpload)}
              className="glass"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:ml-2 sm:inline">
                Images{" "}
                {imageAnalysis.hasImages &&
                  `(${imageAnalysis.uploadedImages.length})`}
              </span>
            </Button>

            {/* Settings */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="glass">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:ml-2 sm:inline">Paramètres</span>
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <div className="mb-2">
                            <h4 className="text-sm font-medium text-green-400 mb-1 flex items-center">
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
                                  <Badge className="bg-green-500/10 text-green-400 text-xs">
                                    Gratuit
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                          <div className="mb-2">
                            <h4 className="text-sm font-medium text-blue-400 mb-1 flex items-center">
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
                                  <Badge className="bg-blue-500/10 text-blue-400 text-xs">
                                    Pro
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-purple-400 mb-1 flex items-center">
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
                                  <Badge className="bg-purple-500/10 text-purple-400 text-xs">
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
                      className="min-h-[100px]"
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

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 border-r border-white/10">
          <ConversationSidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            onLoadConversation={loadConversationById}
            onDeleteConversation={deleteConversation}
            onNewConversation={clearMessages}
            onExportConversation={exportChat}
            onClearAllData={clearAllData}
            stats={getStats()}
            className="glass-card border-0"
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Image Upload Section */}
          {showImageUpload && (
            <div className="border-b border-white/10 bg-white-gradient p-4">
              <ImageUpload
                images={imageAnalysis.uploadedImages}
                onImagesAdd={imageAnalysis.addImages}
                onImageRemove={imageAnalysis.removeImage}
                onClearAll={imageAnalysis.clearAllImages}
                isDragging={imageAnalysis.isDragging}
                onDrop={imageAnalysis.handleDrop}
                onDragOver={imageAnalysis.handleDragOver}
                onDragLeave={imageAnalysis.handleDragLeave}
              />
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 px-4">
            <div
              className="max-w-4xl mx-auto"
              onDrop={imageAnalysis.handleDrop}
              onDragOver={imageAnalysis.handleDragOver}
              onDragLeave={imageAnalysis.handleDragLeave}
            >
              {/* Drop overlay */}
              {imageAnalysis.isDragging && (
                <div className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-background border-2 border-dashed border-primary rounded-xl p-8 text-center">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <p className="text-lg font-medium">
                      Relâchez pour analyser vos images
                    </p>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG, GIF, WebP jusqu'à 10MB
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
          <div className="border-t border-white/10 bg-white-gradient backdrop-blur-xl">
            <div className="max-w-4xl mx-auto p-4">
              {/* Stop Generation Button */}
              {isStreaming && (
                <div className="mb-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={stopGeneration}
                    className="flex items-center space-x-2 glass"
                  >
                    <StopCircle className="w-4 h-4" />
                    <span>Arrêter la génération</span>
                  </Button>
                </div>
              )}

              {/* Image Preview */}
              {imageAnalysis.hasImages && (
                <div className="mb-4 flex items-center space-x-2 text-sm text-muted-foreground">
                  <ImageIcon className="w-4 h-4" />
                  <span>
                    {imageAnalysis.uploadedImages.length} image(s) prête(s) pour
                    l'analyse
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={imageAnalysis.clearAllImages}
                    className="h-6 px-2 text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Supprimer
                  </Button>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      imageAnalysis.hasImages
                        ? "Décrivez ou posez une question sur vos images..."
                        : "Demandez n'importe quoi à NothingAI..."
                    }
                    disabled={isStreaming}
                    className="pr-12 py-6 text-base rounded-2xl border-2 focus:border-primary transition-colors glass"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!input.trim() || isStreaming}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Quick Actions */}
                <div className="hidden md:flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={exportChat}
                      className="h-7 px-2"
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
                      className="h-7 px-2"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Effacer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowImageUpload(!showImageUpload)}
                      className="h-7 px-2"
                    >
                      <ImageIcon className="w-3 h-3 mr-1" />
                      Images
                    </Button>
                  </div>
                  <span>
                    Appuyez sur{" "}
                    <kbd className="px-1 py-0.5 bg-muted rounded">⏎</kbd> pour
                    envoyer
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
