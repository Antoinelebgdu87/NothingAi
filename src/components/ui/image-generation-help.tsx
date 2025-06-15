import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Download,
  X,
  HelpCircle,
  Zap,
  Crown,
} from "lucide-react";

interface ImageGenerationHelpProps {
  onStartGeneration?: () => void;
}

const ImageGenerationHelp = ({
  onStartGeneration,
}: ImageGenerationHelpProps) => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-emerald-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wand2 className="w-5 h-5 text-primary" />
          Générateur d'Images IA
        </CardTitle>
        <CardDescription>
          Créez des images uniques avec l'intelligence artificielle
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-green-100 text-green-700">
            <Zap className="w-3 h-3 mr-1" />
            Gratuit & Illimité
          </Badge>
          <Badge className="bg-purple-100 text-purple-700">
            <Crown className="w-3 h-3 mr-1" />
            Haute Qualité
          </Badge>
          <Badge className="bg-blue-100 text-blue-700">
            <ImageIcon className="w-3 h-3 mr-1" />
            Formats Personnalisés
          </Badge>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="mb-2">
            ✨ <strong>Nouveau !</strong> Choisissez votre format (Instagram,
            Web, Impression...) et générez des images professionnelles en
            quelques clics.
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={onStartGeneration} className="flex-1">
            <Sparkles className="w-4 h-4 mr-2" />
            Créer une Image
          </Button>

          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <HelpCircle className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-primary" />
                  Comment ça marche ?
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">
                        Choisissez votre format
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Instagram, Facebook, Web, impression... Plus de 10
                        formats prédéfinis disponibles.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">
                        Décrivez votre image
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Soyez précis et détaillé. Ex: "Un chat orange jouant
                        dans un jardin fleuri au coucher de soleil"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">
                        Récupérez votre image
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Visualisez, téléchargez ou régénérez directement depuis
                        l'interface.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Conseils pro
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Plus vous êtes précis, meilleur sera le résultat</li>
                    <li>• Mentionnez les couleurs, styles et ambiances</li>
                    <li>
                      • Utilisez des mots-clés comme "photorealistic",
                      "artistic"
                    </li>
                    <li>
                      • Évitez les termes interdits (contenu adulte, violence)
                    </li>
                  </ul>
                </div>

                <div className="text-center">
                  <Button
                    onClick={() => {
                      setShowDialog(false);
                      onStartGeneration?.();
                    }}
                    className="w-full"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Commencer maintenant
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageGenerationHelp;
