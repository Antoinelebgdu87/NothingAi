import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Sparkles, Wand2 } from "lucide-react";
import GeneratedImagesDisplay from "@/components/ui/generated-images-display";
import { NothingAIWordmark } from "@/components/ui/nothingai-logo";
import { useImageGeneration } from "@/hooks/use-image-generation";

const GeneratedImages = () => {
  const { generatedImages, getImageGenerationStats } = useImageGeneration();
  const stats = getImageGenerationStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour au Chat
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Sparkles className="w-8 h-8 text-primary" />
                  Images Générées
                </h1>
                <p className="text-muted-foreground">
                  Toutes vos créations IA en un seul endroit
                </p>
              </div>
            </div>
            <NothingAIWordmark size="md" />
          </div>
        </div>

        {/* Statistiques */}
        {generatedImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.totalGenerated}
                </div>
                <div className="text-sm text-muted-foreground">
                  Images générées
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.pollinationsCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  Pollinations
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.huggingfaceCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  Hugging Face
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.modelsUsed}
                </div>
                <div className="text-sm text-muted-foreground">
                  Modèles utilisés
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Affichage des images ou message d'accueil */}
        {generatedImages.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Wand2 className="w-8 h-8 text-muted-foreground" />
                Aucune image générée
              </CardTitle>
              <CardDescription className="text-lg">
                Commencez à créer des images incroyables avec l'IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/">
                <Button size="lg" className="mt-4">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Créer ma première image
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <GeneratedImagesDisplay />
        )}
      </div>
    </div>
  );
};

export default GeneratedImages;
