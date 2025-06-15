import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Key,
  Shield,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Zap,
  Wifi,
  WifiOff,
  Database,
} from "lucide-react";
import { firebaseLicenseManager } from "@/lib/firebase-license-manager";
import { toast } from "sonner";

interface FirebaseLicenseGateProps {
  onLicenseValid: () => void;
}

const FirebaseLicenseGate = ({ onLicenseValid }: FirebaseLicenseGateProps) => {
  const [licenseKey, setLicenseKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  // Vérifier la connexion Firebase au chargement
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await firebaseLicenseManager.testConnection();
        setIsConnected(connected);

        if (!connected) {
          toast.error(
            "Connexion Firebase indisponible. Veuillez réessayer plus tard.",
          );
        }
      } catch (error) {
        setIsConnected(false);
        toast.error("Erreur de connexion au service de licenses");
      } finally {
        setIsCheckingConnection(false);
      }
    };

    checkConnection();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!licenseKey.trim()) {
      toast.error("Veuillez entrer une clé de license");
      return;
    }

    if (!isConnected) {
      toast.error(
        "Service de licenses indisponible. Veuillez réessayer plus tard.",
      );
      return;
    }

    setIsValidating(true);

    try {
      const result = await firebaseLicenseManager.useLicense(licenseKey.trim());

      if (result.success) {
        toast.success(
          "License activée avec succès ! Bienvenue dans NothingAI ✨",
          { duration: 3000 },
        );

        // Délai pour permettre à l'utilisateur de voir le message
        setTimeout(() => {
          onLicenseValid();
        }, 1500);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erreur lors de la validation de la license");
    } finally {
      setIsValidating(false);
    }
  };

  if (isCheckingConnection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-white">Connexion au service de licenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Arrière-plan animé */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <Card className="w-full max-w-md relative z-10 bg-card/95 backdrop-blur-sm border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="space-y-2">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Shield className="w-6 h-6 text-primary" />
              NothingAI - Accès Protégé
            </CardTitle>
            <CardDescription>
              Une license valide est requise pour accéder à NothingAI
            </CardDescription>
          </div>

          {/* Status de connexion */}
          <div className="flex items-center justify-center gap-2">
            {isConnected ? (
              <Badge className="bg-green-100 text-green-700 text-xs">
                <Database className="w-3 h-3 mr-1" />
                Service connecté
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                <WifiOff className="w-3 h-3 mr-1" />
                Service indisponible
              </Badge>
            )}
          </div>

          {/* Features badges */}
          <div className="flex flex-wrap justify-center gap-2">
            <Badge className="bg-green-100 text-green-700 text-xs">
              <Zap className="w-3 h-3 mr-1" />
              IA Avancée
            </Badge>
            <Badge className="bg-purple-100 text-purple-700 text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Génération Images
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Sécurisé
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Alerte si pas de connexion */}
          {!isConnected && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-orange-800">
                Le service de licenses est temporairement indisponible. Veuillez
                vérifier votre connexion internet et réessayer.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="license" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Clé de License
              </Label>
              <Input
                id="license"
                type="text"
                placeholder="NothingAi-XXXXXXXX"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                className="font-mono text-center text-lg tracking-wider"
                disabled={isValidating || !isConnected}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground text-center">
                Format: NothingAi-ChiffreAléatoire
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isValidating || !licenseKey.trim() || !isConnected}
            >
              {isValidating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Validation en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activer la License
                </>
              )}
            </Button>
          </form>

          {/* Informations sur les licenses */}
          <div className="space-y-3">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Important à savoir
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Chaque license a un nombre d'utilisations limité</li>
                <li>
                  • Une fois utilisée sur un appareil, elle y reste active
                </li>
                <li>• Les licenses expirent après une durée déterminée</li>
                <li>• Données synchronisées en temps réel avec Firebase</li>
                <li>• Gardez votre clé en sécurité</li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Vous êtes administrateur ?
                <br />
                <kbd className="px-2 py-1 bg-muted rounded text-xs">
                  Ctrl + F1
                </kbd>{" "}
                pour accéder au panel
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-xs text-muted-foreground">
        <p className="flex items-center gap-1 justify-center">
          NothingAI © 2024 - Système de License Sécurisé
          {isConnected ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
        </p>
      </div>
    </div>
  );
};

export default FirebaseLicenseGate;
