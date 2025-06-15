import React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, RotateCcw, User, Sparkles } from "lucide-react";
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("Message copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy message");
    }
  };

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /`(.*?)`/g,
        '<code class="px-1 py-0.5 bg-muted rounded text-sm font-mono">$1</code>',
      )
      .replace(/\n/g, "<br />");
  };

  if (message.isStreaming && !message.content) {
    return (
      <div className={cn("flex items-start space-x-3 py-6", className)}>
        <Avatar className="w-8 h-8 border-2 border-primary/20">
          <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-primary-foreground">
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
        "group flex items-start space-x-3 py-6 px-4 hover:bg-muted/20 transition-colors rounded-lg",
        isUser && "flex-row-reverse space-x-reverse",
        className,
      )}
    >
      {/* Avatar */}
      <Avatar
        className={cn(
          "w-8 h-8 border-2 shrink-0",
          isUser ? "border-blue-500/20" : "border-primary/20",
        )}
      >
        <AvatarFallback
          className={cn(
            isUser
              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
              : "bg-gradient-to-br from-primary to-blue-600 text-primary-foreground",
          )}
        >
          {isUser ? (
            <User className="w-4 h-4" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={cn("flex-1 space-y-2 min-w-0", isUser && "text-right")}>
        {/* Message Header */}
        <div
          className={cn(
            "flex items-center space-x-2",
            isUser && "justify-end flex-row-reverse space-x-reverse",
          )}
        >
          <span className="text-sm font-medium">
            {isUser ? "You" : "NothingAI"}
          </span>
          {message.model && !isUser && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              {message.model
                .split("/")
                .pop()
                ?.replace("-instruct", "")
                .replace(":free", "")}
            </Badge>
          )}
          {message.isStreaming && (
            <Badge
              variant="outline"
              className="text-xs px-1.5 py-0.5 animate-pulse"
            >
              Generating...
            </Badge>
          )}
        </div>

        {/* Message Bubble */}
        <div
          className={cn(
            "relative rounded-2xl px-4 py-3 max-w-4xl",
            isUser
              ? "bg-primary text-primary-foreground ml-auto"
              : "bg-card border border-border",
            message.isStreaming && "animate-fade-in",
          )}
        >
          <div
            className={cn(
              "prose prose-sm max-w-none",
              isUser
                ? "prose-invert text-primary-foreground [&_strong]:text-primary-foreground [&_em]:text-primary-foreground/90"
                : "text-foreground [&_strong]:text-foreground [&_em]:text-muted-foreground",
            )}
            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
          />

          {/* Streaming cursor */}
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
          )}
        </div>

        {/* Message Actions */}
        <div
          className={cn(
            "flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity",
            isUser && "justify-end",
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-6 px-2 text-xs"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </Button>

          {showRegenerate && !isUser && onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              className="h-6 px-2 text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Regenerate
            </Button>
          )}

          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessageComponent;
