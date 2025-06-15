import React, { useState } from "react";
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
import { Key, Shield, Sparkles, CheckCircle, Zap } from "lucide-react";
import { simpleLicenseManager } from "@/lib/simple-license-manager";
import { toast } from "sonner";

interface SimpleLicenseGateProps {
  onLicenseValid: () => void;
}

const SimpleLicenseGate = ({ onLicenseValid }: SimpleLicenseGateProps) => {
  const [licenseKey, setLicenseKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!licenseKey.trim()) {
      toast.error("Veuillez entrer une clé de license");
      return;
    }

    setIsValidating(true);

    try {
      // Petite pause pour l'effet visuel
      await new Promise((resolve) => setTimeout(resolve, 800));

      const result = simpleLicenseManager.useLicense(licenseKey.trim());

      if (result.success) {
        toast.success("🎉 " + result.message + " - Accès autorisé !");

        // Redirection immédiate vers l'application
        setTimeout(() => {
          onLicenseValid();
        }, 500);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erreur lors de la validation");
    } finally {
      setIsValidating(false);
    }
  };

  const testLicenses = simpleLicenseManager.getAllLicenses().slice(0, 3);

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
              NothingAI - Accès Simple
            </CardTitle>
            <CardDescription>
              Entrez votre clé de license pour accéder à NothingAI
            </CardDescription>
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
              Simple & Local
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
                  Validation...
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
          <div className="space-y-3">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                🧪 Clés de test disponibles
              </h4>
              <div className="space-y-2">
                {testLicenses.map((license) => (
                  <div
                    key={license.key}
                    className="flex items-center justify-between"
                  >
                    <code className="text-xs bg-background px-2 py-1 rounded">
                      {license.key}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs"
                      onClick={() => {
                        setLicenseKey(license.key);
                        toast.info("Clé copiée !");
                      }}
                    >
                      Copier
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Système local - Aucune connexion internet requise
                <br />
                <kbd className="px-2 py-1 bg-muted rounded text-xs">
                  Ctrl + F1
                </kbd>{" "}
                pour le panel admin
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-xs text-muted-foreground">
        <p>NothingAI © 2024 - Système Simple & Local 🚀</p>
      </div>
    </div>
  );
};

export default SimpleLicenseGate;
