import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Trash2,
  Download,
  Calendar,
  BarChart3,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type { ChatMessage } from "@/hooks/use-chat";

interface StoredConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ConversationSidebarProps {
  conversations: StoredConversation[];
  currentConversationId: string | null;
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
  onExportConversation: (id: string) => void;
  onClearAllData: () => void;
  stats: {
    totalConversations: number;
    totalMessages: number;
    oldestConversation: Date | null;
  };
  className?: string;
}

const ConversationSidebar = ({
  conversations,
  currentConversationId,
  onLoadConversation,
  onDeleteConversation,
  onNewConversation,
  onExportConversation,
  onClearAllData,
  stats,
  className,
}: ConversationSidebarProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays === 0) return "Aujourd'hui";
    if (diffInDays === 1) return "Hier";
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
    if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaines`;
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleDeleteConversation = (id: string) => {
    onDeleteConversation(id);
    setShowDeleteDialog(null);
    toast.success("Conversation supprimée");
  };

  const handleClearAllData = () => {
    onClearAllData();
    setShowClearDialog(false);
    toast.success("Toutes les données ont été supprimées");
  };

  const groupConversationsByDate = (conversations: StoredConversation[]) => {
    const groups: { [key: string]: StoredConversation[] } = {};

    // Safety check: ensure conversations is defined and is an array
    if (!conversations || !Array.isArray(conversations)) {
      return groups;
    }

    conversations.forEach((conv) => {
      const key = formatDate(conv.updatedAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(conv);
    });

    return groups;
  };

  const groupedConversations = groupConversationsByDate(conversations || []);

  return (
    <div className={cn("flex flex-col h-full bg-card border-r", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onNewConversation}
            className="h-8 px-2"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            <MessageSquare className="w-3 h-3 mr-1" />
            {stats?.totalConversations || 0}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <BarChart3 className="w-3 h-3 mr-1" />
            {stats?.totalMessages || 0}
          </Badge>
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {(conversations || []).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune conversation sauvegardée</p>
            </div>
          ) : (
            Object.entries(groupedConversations).map(([dateGroup, convs]) => (
              <div key={dateGroup} className="mb-4">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-2">
                  {dateGroup}
                </h3>
                <div className="space-y-1">
                  {convs.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={cn(
                        "group relative rounded-lg p-3 cursor-pointer transition-colors",
                        currentConversationId === conversation.id
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted/50",
                      )}
                      onClick={() => onLoadConversation(conversation.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {conversation.title}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs px-1">
                              {conversation.messages?.length || 0} messages
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {conversation.updatedAt.toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "numeric",
                                  month: "short",
                                },
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onExportConversation(conversation.id);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteDialog(conversation.id);
                            }}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      {(conversations || []).length > 0 && (
        <div className="p-4 border-t space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowClearDialog(true)}
            className="w-full text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Tout supprimer
          </Button>
        </div>
      )}

      {/* Delete Conversation Dialog */}
      <Dialog
        open={showDeleteDialog !== null}
        onOpenChange={() => setShowDeleteDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la conversation</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <p>
                Êtes-vous sûr de vouloir supprimer cette conversation ? Cette
                action est irréversible.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                showDeleteDialog && handleDeleteConversation(showDeleteDialog)
              }
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Data Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer toutes les données</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <p>
                Êtes-vous sûr de vouloir supprimer toutes les conversations
                sauvegardées ? Cette action est irréversible.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleClearAllData}>
              Tout supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConversationSidebar;
