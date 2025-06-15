import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
  Send,
  Settings,
  Download,
  Trash2,
  StopCircle,
  Sparkles,
  Brain,
  Zap,
  Crown,
  Menu,
  X,
} from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import ChatMessageComponent from "@/components/ui/chat-message";
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
  } = useChat();

  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
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
        <PageLoading message="Initializing NothingAI..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">NothingAI</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Advanced AI Assistant
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className={cn(
                "hidden sm:flex items-center space-x-1",
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

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:ml-2 sm:inline">Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Chat Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Model Selection */}
                  <div className="space-y-3">
                    <Label>AI Model</Label>
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
                              Free Models
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
                                    Free
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                          <div className="mb-2">
                            <h4 className="text-sm font-medium text-blue-400 mb-1 flex items-center">
                              <Brain className="w-3 h-3 mr-1" />
                              Affordable Models
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
                              Premium Models
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
                    <Label>Temperature: {settings.temperature}</Label>
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
                      Controls randomness. Lower = more focused, Higher = more
                      creative
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
                      Maximum length of AI responses
                    </p>
                  </div>

                  {/* System Message */}
                  <div className="space-y-3">
                    <Label>System Message</Label>
                    <Textarea
                      value={settings.systemMessage}
                      onChange={(e) =>
                        updateSettings({ systemMessage: e.target.value })
                      }
                      placeholder="Enter system instructions..."
                      className="min-h-[100px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Instructions that guide the AI's behavior and personality
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
        {/* Sidebar - Mobile */}
        {showSidebar && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowSidebar(false)}
            />
            <div className="absolute left-0 top-0 h-full w-64 bg-card border-r border-border p-4">
              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={exportChat}
                  className="w-full justify-start"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Chat
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    clearMessages();
                    toast.success("Chat cleared!");
                  }}
                  className="w-full justify-start"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Chat
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 px-4">
            <div className="max-w-4xl mx-auto">
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
          <div className="border-t border-border bg-card/50 backdrop-blur-xl">
            <div className="max-w-4xl mx-auto p-4">
              {isStreaming && (
                <div className="mb-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={stopGeneration}
                    className="flex items-center space-x-2"
                  >
                    <StopCircle className="w-4 h-4" />
                    <span>Stop Generation</span>
                  </Button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask NothingAI anything..."
                    disabled={isStreaming}
                    className="pr-12 py-6 text-base rounded-2xl border-2 focus:border-primary transition-colors"
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
                      Export
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearMessages();
                        toast.success("Chat cleared!");
                      }}
                      className="h-7 px-2"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                  <span>
                    Press <kbd className="px-1 py-0.5 bg-muted rounded">⏎</kbd>{" "}
                    to send
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
