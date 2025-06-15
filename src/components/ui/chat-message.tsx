import React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  RotateCcw,
  User,
  Sparkles,
  Download,
  Wand2,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { TypingIndicator } from "./loading-spinner";
import type { ChatMessage } from "@/hooks/use-chat";

interface ChatMessageProps {
  message: ChatMessage;
  onRegenerate?: () => void;
  showRegenerate?: boolean;
  className?: string;
}

const ChatMessageComponent = ({
  message,
  onRegenerate,
  showRegenerate = false,
  className,
}: ChatMessageProps) => {
  const isUser = message.role === "user";
  const isSystem = message.role === "system" || message.id === "welcome";
  const hasGeneratedImage = message.generatedImage;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("Message copié !");
    } catch (error) {
      toast.error("Échec de la copie");
    }
  };

  const downloadGeneratedImage = async () => {
    if (!hasGeneratedImage) return;

    try {
      const response = await fetch(hasGeneratedImage.url);
      const blob = await response.blob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nothingai-generated-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Image téléchargée !");
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Erreur lors du téléchargement");
    }
  };

  const copyImageUrl = async () => {
    if (!hasGeneratedImage) return;

    try {
      await navigator.clipboard.writeText(hasGeneratedImage.url);
      toast.success("URL de l'image copiée !");
    } catch (error) {
      toast.error("Erreur lors de la copie");
    }
  };

  const formatContent = (content: string) => {
    // Enhanced markdown formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /`(.*?)`/g,
        '<code class="px-2 py-1 bg-muted/50 rounded-md text-sm font-mono border">$1</code>',
      )
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br />")
      .replace(/^(.*)$/, "<p>$1</p>");
  };

  if (message.isStreaming && !message.content) {
    return (
      <div className={cn("flex items-start space-x-4 py-6 px-6", className)}>
        <Avatar className="w-8 h-8 border border-border/50">
          <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-600 text-white">
            <Sparkles className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <TypingIndicator />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-start space-x-4 py-6 px-6 hover:bg-muted/5 transition-colors fade-in",
        className,
      )}
    >
      {/* Avatar */}
      <Avatar className="w-8 h-8 border border-border/50 shrink-0">
        <AvatarFallback
          className={cn(
            isUser
              ? "bg-gradient-to-br from-professional-600 to-professional-700 text-white"
              : hasGeneratedImage
                ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white"
                : "bg-gradient-to-br from-primary to-emerald-600 text-white",
          )}
        >
          {isUser ? (
            <User className="w-4 h-4" />
          ) : hasGeneratedImage ? (
            <Wand2 className="w-4 h-4" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className="flex-1 space-y-3 min-w-0">
        {/* Message Header */}
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold text-foreground">
            {isUser ? "Vous" : "NothingAI"}
          </span>
          {message.model && !isUser && (
            <Badge
              variant="secondary"
              className={cn(
                "text-xs px-2 py-0.5 pro-badge",
                hasGeneratedImage &&
                  "bg-purple-500/10 text-purple-500 border-purple-500/20",
              )}
            >
              {message.model === "image-generation"
                ? "Génération d'images"
                : message.model
                    .split("/")
                    .pop()
                    ?.replace("-instruct", "")
                    .replace(":free", "")}
            </Badge>
          )}
          {message.isStreaming && (
            <Badge className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20 animate-pulse">
              {hasGeneratedImage ? "Génération..." : "Rédaction..."}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Message Bubble */}
        <div
          className={cn(
            "rounded-2xl px-5 py-4 max-w-none",
            isUser ? "message-user" : "message-assistant",
          )}
        >
          {/* User's attached images */}
          {message.images && message.images.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {message.images.map((image, index) => (
                <div
                  key={index}
                  className="relative rounded-lg overflow-hidden border border-border/30"
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-20 h-20 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              ))}
            </div>
          )}

          {/* Message Text */}
          <div
            className={cn(
              "prose prose-sm max-w-none",
              isUser
                ? "prose-invert text-primary-foreground [&_strong]:text-primary-foreground [&_em]:text-primary-foreground/90 [&_p]:text-primary-foreground [&_code]:bg-white/20 [&_code]:text-primary-foreground"
                : "text-foreground [&_strong]:text-foreground [&_em]:text-muted-foreground [&_p]:text-foreground [&_p]:mb-2 [&_p:last-child]:mb-0",
            )}
            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
          />

          {/* Generated Image */}
          {hasGeneratedImage && (
            <div className="mt-4 space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-border/50 bg-muted/20">
                <img
                  src={hasGeneratedImage.url}
                  alt={hasGeneratedImage.prompt}
                  className="w-full max-w-md mx-auto rounded-xl"
                  loading="lazy"
                />

                {/* Image overlay with actions */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-xl flex items-center justify-center opacity-0 hover:opacity-100">
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={downloadGeneratedImage}
                      className="bg-white/90 text-black hover:bg-white"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Télécharger
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={copyImageUrl}
                      className="bg-white/90 text-black hover:bg-white"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copier URL
                    </Button>
                  </div>
                </div>
              </div>

              {/* Image Details */}
              <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/20 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-3 h-3" />
                  <span className="font-medium">Image générée</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {hasGeneratedImage.model}
                  </Badge>
                  <span>Pollinations.ai</span>
                </div>
              </div>

              {/* Prompt used */}
              <div className="text-xs text-muted-foreground italic bg-muted/10 rounded-lg px-3 py-2">
                <strong>Prompt:</strong> {hasGeneratedImage.prompt}
              </div>
            </div>
          )}

          {/* Streaming cursor */}
          {message.isStreaming && (
            <span className="inline-block w-0.5 h-5 bg-primary animate-pulse ml-1" />
          )}
        </div>

        {/* Message Actions */}
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-7 px-3 text-xs hover-lift focus-ring"
          >
            <Copy className="w-3 h-3 mr-1.5" />
            Copier
          </Button>

          {hasGeneratedImage && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadGeneratedImage}
                className="h-7 px-3 text-xs hover-lift focus-ring"
              >
                <Download className="w-3 h-3 mr-1.5" />
                Télécharger
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyImageUrl}
                className="h-7 px-3 text-xs hover-lift focus-ring"
              >
                <Copy className="w-3 h-3 mr-1.5" />
                URL
              </Button>
            </>
          )}

          {showRegenerate && !isUser && onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              className="h-7 px-3 text-xs hover-lift focus-ring"
            >
              <RotateCcw className="w-3 h-3 mr-1.5" />
              Régénérer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessageComponent;
