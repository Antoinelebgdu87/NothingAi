import React, { useState, useEffect } from "react";
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
  CheckCircle,
  Zap,
  Wifi,
  WifiOff,
  AlertCircle,
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
        console.log("🔌 Test connexion Firebase...");
        const connected = await firebaseLicenseManager.testConnection();
        setIsConnected(connected);

        if (connected) {
          console.log("✅ Firebase connecté");
          toast.success("Connexion Firebase établie");
        } else {
          console.log("❌ Firebase déconnecté");
          toast.error("Impossible de se connecter à Firebase");
        }
      } catch (error) {
        console.error("💥 Erreur test connexion:", error);
        setIsConnected(false);
        toast.error("Erreur de connexion Firebase");
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
      toast.error("Pas de connexion Firebase - Impossible de valider");
      return;
    }

    setIsValidating(true);

    try {
      console.log("🔍 Validation de la license:", licenseKey);

      // Validation avec Firebase
      const result = await firebaseLicenseManager.useLicense(licenseKey.trim());

      if (result.success) {
        console.log("✅ License validée avec succès");
        toast.success("🎉 License activée avec succès !");

        // Redirection vers l'application
        setTimeout(() => {
          onLicenseValid();
        }, 1000);
      } else {
        console.log("❌ License invalide:", result.message);
        toast.error(result.message || "License invalide");
      }
    } catch (error) {
      console.error("💥 Erreur validation:", error);
      toast.error("Erreur lors de la validation de la license");
    } finally {
      setIsValidating(false);
    }
  };

  // Créer quelques licenses de test pour les admins
  const createTestLicense = async () => {
    if (!isConnected) {
      toast.error("Pas de connexion Firebase");
      return;
    }

    try {
      const result = await firebaseLicenseManager.createLicenseAdvanced({
        type: "standard",
        duration: 30,
        maxUsages: 100,
        features: ["chat", "images"],
      });

      if (result.success && result.license) {
        // Copier automatiquement
        navigator.clipboard.writeText(result.license.key);
        toast.success(`License créée: ${result.license.key} (copiée !)`);
        setLicenseKey(result.license.key);
      } else {
        toast.error("Erreur lors de la création");
      }
    } catch (error) {
      console.error("💥 Erreur création license:", error);
      toast.error("Erreur lors de la création de la license");
    }
  };

  if (isCheckingConnection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-medium">Connexion à Firebase...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Initialisation du système de licenses
            </p>
          </CardContent>
        </Card>
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
              NothingAI - Firebase
            </CardTitle>
            <CardDescription>
              Entrez votre clé de license pour accéder à NothingAI
            </CardDescription>
          </div>

          {/* Status de connexion */}
          <Alert
            className={
              isConnected ? "border-green-500/50" : "border-red-500/50"
            }
          >
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <AlertDescription className="text-sm">
                {isConnected
                  ? "Connecté à Firebase - Validation en temps réel"
                  : "Déconnecté de Firebase - Validation impossible"}
              </AlertDescription>
            </div>
          </Alert>

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
              Firebase Cloud
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
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
                  Validation Firebase...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activer la License
                </>
              )}
            </Button>
          </form>

          {/* Bouton de test pour les admins */}
          {isConnected && (
            <div className="border-t pt-4">
              <Button
                variant="outline"
                onClick={createTestLicense}
                className="w-full text-xs"
                disabled={isValidating}
              >
                <Key className="w-3 h-3 mr-2" />
                Créer License Test (Admin)
              </Button>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Système Firebase - Sauvegarde cloud sécurisée
              <br />
              <kbd className="px-2 py-1 bg-muted rounded text-xs">
                Ctrl + F1
              </kbd>{" "}
              pour le panel admin
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-xs text-muted-foreground">
        <p>NothingAI © 2024 - Système Firebase Cloud 🔥</p>
      </div>
    </div>
  );
};

export default FirebaseLicenseGate;
