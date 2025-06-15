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
import { Key, Shield, Sparkles, CheckCircle, Zap, Rocket } from "lucide-react";
import { instantLicenseManager } from "@/lib/instant-license-manager";
import { toast } from "sonner";

interface InstantLicenseGateProps {
  onLicenseValid: () => void;
}

const InstantLicenseGate = ({ onLicenseValid }: InstantLicenseGateProps) => {
  const [licenseKey, setLicenseKey] = useState("");
  const [isActivating, setIsActivating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!licenseKey.trim()) {
      toast.error("Veuillez entrer une clé de license");
      return;
    }

    setIsActivating(true);

    try {
      console.log("🔍 Tentative activation avec:", licenseKey);

      // Activation INSTANTANÉE
      const result = instantLicenseManager.activateLicense(licenseKey.trim());

      if (result.success) {
        console.log("✅ License activée:", licenseKey);
        toast.success("🎉 License activée instantanément !");

        // Redirection immédiate
        setTimeout(() => {
          onLicenseValid();
          setIsActivating(false);
        }, 800);
      } else {
        console.log("❌ Échec activation:", result.message);
        toast.error(result.message);
        setIsActivating(false);
      }
    } catch (error) {
      console.error("💥 Erreur critique activation:", error);
      toast.error("Erreur lors de l'activation");
      setIsActivating(false);
    }
  };

  // Test rapide avec une clé qui marche
  const testWithWorkingKey = () => {
    const workingKey = "4C24HUEQ";
    setLicenseKey(workingKey);
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
              <Rocket className="w-6 h-6 text-primary" />
              NothingAI - Activation
            </CardTitle>
            <CardDescription>
              Entrez votre clé de license pour accéder à NothingAI
            </CardDescription>
          </div>

          {/* Features badges */}
          <div className="flex flex-wrap justify-center gap-2">
            <Badge className="bg-green-100 text-green-700 text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Ultra-Rapide
            </Badge>
            <Badge className="bg-purple-100 text-purple-700 text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              IA Avancée
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Sécurisé
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Formulaire d'activation */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="license" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Clé de License
              </Label>
              <Input
                id="license"
                type="text"
                placeholder="Ex: 4C24HUEQ ou NothingAi-4C24HUEQ"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                className="font-mono text-center text-lg tracking-wider"
                disabled={isActivating}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground text-center">
                Format accepté : 4C24HUEQ ou NothingAi-4C24HUEQ
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isActivating || !licenseKey.trim()}
            >
              {isActivating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Activation...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activer License
                </>
              )}
            </Button>
          </form>

          {/* Informations pour les utilisateurs */}
          <div className="border-t pt-4">
            <div className="text-center space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Besoin d'une license ?
              </h4>
              <p className="text-xs text-muted-foreground">
                Contactez l'administrateur pour obtenir votre clé de license
                personnalisée avec la durée et le nombre d'utilisations
                souhaités.
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Système de license corrigé - Fonctionne garantit !
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
        <p>NothingAI © 2024 - System FIXED ✅</p>
      </div>
    </div>
  );
};

export default InstantLicenseGate;
