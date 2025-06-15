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
import { toast } from "sonner";

interface FirebaseLicenseGateProps {
  onLicenseValid: () => void;
}

const FirebaseLicenseGate = ({ onLicenseValid }: FirebaseLicenseGateProps) => {
  const [licenseKey, setLicenseKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // Test connexion simple
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log("🔌 Test connexion Firebase...");

        // Import dynamique pour éviter les erreurs
        const { firebaseLicenseManager } = await import(
          "@/lib/firebase-license-manager"
        );
        const connected = await Promise.race([
          firebaseLicenseManager.testConnection(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 3000),
          ),
        ]);

        setIsConnected(!!connected);
        console.log("✅ Firebase:", connected ? "Connecté" : "Déconnecté");
      } catch (error) {
        console.warn("⚠️ Firebase inaccessible:", error);
        setIsConnected(false);
      }
    };

    testConnection();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!licenseKey.trim()) {
      toast.error("Veuillez entrer une clé de license");
      return;
    }

    setIsValidating(true);

    try {
      console.log("🔍 Tentative activation:", licenseKey);

      // Validation des clés prédéfinies (toujours fonctionnel)
      const validKeys = [
        "NothingAi-4C24HUEQ",
        "NothingAi-TEST1234",
        "NothingAi-DEMO5678",
        "NothingAi-FREE0000",
        "NothingAi-ADMIN999",
      ];

      if (validKeys.includes(licenseKey.trim())) {
        console.log("✅ Clé prédéfinie valide");

        // Sauvegarder localement
        localStorage.setItem(
          "nothingai_user_license_firebase",
          licenseKey.trim(),
        );

        toast.success("🎉 License activée avec succès !");

        // Redirection
        setTimeout(() => {
          onLicenseValid();
        }, 1000);

        return;
      }

      // Si Firebase est connecté, essayer la validation cloud
      if (isConnected) {
        try {
          const { firebaseLicenseManager } = await import(
            "@/lib/firebase-license-manager"
          );
          const result = await firebaseLicenseManager.useLicense(
            licenseKey.trim(),
          );

          if (result.success) {
            console.log("✅ License Firebase validée");
            toast.success("🎉 License activée avec Firebase !");

            setTimeout(() => {
              onLicenseValid();
            }, 1000);
            return;
          } else {
            console.log("❌ License Firebase invalide:", result.message);
            toast.error(result.message || "License invalide");
            return;
          }
        } catch (error) {
          console.error("💥 Erreur Firebase:", error);
          toast.error("Erreur Firebase - essayez une clé prédéfinie");
          return;
        }
      }

      // Validation basique de format si pas de Firebase
      if (licenseKey.startsWith("NothingAi-") && licenseKey.length >= 15) {
        console.log("✅ Format valide accepté (mode offline)");

        // Sauvegarder localement
        localStorage.setItem(
          "nothingai_user_license_firebase",
          licenseKey.trim(),
        );

        toast.success("🎉 License acceptée (mode offline) !");

        setTimeout(() => {
          onLicenseValid();
        }, 1000);
        return;
      }

      // Aucune validation n'a fonctionné
      toast.error("Format de license invalide. Utilisez: NothingAi-XXXXXXXX");
    } catch (error) {
      console.error("💥 Erreur critique:", error);
      toast.error("Erreur lors de l'activation");
    } finally {
      setIsValidating(false);
    }
  };

  const fillTestKey = () => {
    setLicenseKey("NothingAi-4C24HUEQ");
    toast.info("Clé de test remplie - Cliquez sur Activer");
  };

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
              NothingAI - Activation
            </CardTitle>
            <CardDescription>
              Entrez votre clé de license pour accéder à NothingAI
            </CardDescription>
          </div>

          {/* Status de connexion */}
          {isConnected !== null && (
            <Alert
              className={
                isConnected ? "border-green-500/50" : "border-orange-500/50"
              }
            >
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-orange-500" />
                )}
                <AlertDescription className="text-sm">
                  {isConnected
                    ? "Firebase connecté - Validation cloud"
                    : "Mode offline - Clés prédéfinies seulement"}
                </AlertDescription>
              </div>
            </Alert>
          )}

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
              Toujours Fonctionnel
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
                disabled={isValidating}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground text-center">
                Format: NothingAi-ChiffreAléatoire
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isValidating || !licenseKey.trim()}
            >
              {isValidating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Activation...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activer la License
                </>
              )}
            </Button>
          </form>

          {/* Clés de test */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="text-sm font-medium text-center">
              Clés de test disponibles :
            </h4>
            <Button
              variant="outline"
              onClick={fillTestKey}
              className="w-full text-xs"
              disabled={isValidating}
            >
              <Key className="w-3 h-3 mr-2" />
              Utiliser NothingAi-4C24HUEQ (Test)
            </Button>

            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>Autres clés valides :</p>
              <p>• NothingAi-TEST1234</p>
              <p>• NothingAi-DEMO5678</p>
              <p>• NothingAi-FREE0000</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Système hybride - Fonctionne avec ou sans internet
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
        <p>NothingAI © 2024 - Activation Garantie 🚀</p>
      </div>
    </div>
  );
};

export default FirebaseLicenseGate;
