import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Image, FileImage, Trash2 } from "lucide-react";
import type { UploadedImage } from "@/hooks/use-image-analysis";

interface ImageUploadProps {
  images: UploadedImage[];
  onImagesAdd: (files: FileList | File[]) => void;
  onImageRemove: (imageId: string) => void;
  onClearAll: () => void;
  isDragging: boolean;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  className?: string;
}

const ImageUpload = ({
  images,
  onImagesAdd,
  onImageRemove,
  onClearAll,
  isDragging,
  onDrop,
  onDragOver,
  onDragLeave,
  className,
}: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5 scale-105"
            : "border-border hover:border-primary/50 hover:bg-muted/20",
        )}
      >
        <div className="flex flex-col items-center space-y-3">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
              isDragging
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Upload className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isDragging
                ? "Relâchez pour ajouter les images"
                : "Glissez-déposez vos images ici"}
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, GIF, WebP jusqu'à 10MB
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleFileSelect}
            className="mt-2"
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center">
              <Image className="w-4 h-4 mr-2" />
              Images ajoutées ({images.length})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Tout supprimer
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>

                  {/* File Type Badge */}
                  <Badge
                    variant="secondary"
                    className="absolute bottom-2 left-2 text-xs px-1 py-0"
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
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
