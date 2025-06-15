import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  X,
  Image as ImageIcon,
  FileImage,
  Send,
  Trash2,
} from "lucide-react";
import type { UploadedImage } from "@/hooks/use-image-analysis";

interface ImageUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: UploadedImage[];
  onImagesAdd: (files: FileList | File[]) => void;
  onImageRemove: (imageId: string) => void;
  onClearAll: () => void;
  onSend: () => void;
  isDragging: boolean;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  className?: string;
}

const ImageUploadModal = ({
  open,
  onOpenChange,
  images,
  onImagesAdd,
  onImageRemove,
  onClearAll,
  onSend,
  isDragging,
  onDrop,
  onDragOver,
  onDragLeave,
  className,
}: ImageUploadModalProps) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImagesAdd(e.target.files);
      e.target.value = ""; // Reset input
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleSendAndClose = () => {
    if (images.length > 0) {
      onSend();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden glass-card">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ImageIcon className="w-5 h-5" />
            <span>Analyser des Images</span>
          </DialogTitle>
        </DialogHeader>

        <div className={cn("space-y-4", className)}>
          {/* Drop Zone */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={cn(
              "border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 upload-zone",
              isDragging
                ? "drag-active border-primary bg-primary/10 scale-105"
                : "border-border hover:border-primary/50 hover:bg-muted/20",
            )}
          >
            <div className="flex flex-col items-center space-y-4">
              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                  isDragging
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Upload className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {isDragging
                    ? "Relâchez vos images ici"
                    : "Glissez-déposez vos images"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG, GIF, WebP jusqu'à 10MB par image
                </p>
              </div>

              <Button
                variant="outline"
                onClick={handleFileSelect}
                className="mt-4"
              >
                <FileImage className="w-4 h-4 mr-2" />
                Parcourir les fichiers
              </Button>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Uploaded Images */}
          {images.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Images sélectionnées ({images.length})
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearAll}
                  className="text-destructive hover:text-destructive h-7 px-2"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Tout supprimer
                </Button>
              </div>

              {/* Images Grid */}
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="group relative bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                  >
                    {/* Image Preview */}
                    <div className="aspect-square relative">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />

                      {/* Remove Button */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onImageRemove(image.id)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>

                      {/* File Type Badge */}
                      <Badge
                        variant="secondary"
                        className="absolute bottom-1 left-1 text-xs px-1 py-0"
                      >
                        {image.type.split("/")[1].toUpperCase()}
                      </Badge>
                    </div>

                    {/* Image Info */}
                    <div className="p-2 space-y-1">
                      <p
                        className="text-xs font-medium truncate"
                        title={image.name}
                      >
                        {image.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(image.size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Instructions */}
              <div className="bg-muted/20 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Astuce :</strong> Ces images seront analysées par
                  l'IA. Vous pourrez poser des questions dessus dans le chat.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex items-center space-x-2"
            >
              Annuler
            </Button>

            <Button
              onClick={handleSendAndClose}
              disabled={images.length === 0}
              className="flex items-center space-x-2 pro-button"
            >
              <Send className="w-4 h-4" />
              <span>
                Analyser {images.length > 0 ? `(${images.length})` : ""}
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploadModal;
