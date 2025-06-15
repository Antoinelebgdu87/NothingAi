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
import {
  Key,
  Shield,
  Sparkles,
  CheckCircle,
  Zap,
  Rocket,
  Copy,
} from "lucide-react";
import { instantLicenseManager } from "@/lib/instant-license-manager";
import { toast } from "sonner";

interface InstantLicenseGateProps {
  onLicenseValid: () => void;
}

const InstantLicenseGate = ({ onLicenseValid }: InstantLicenseGateProps) => {
  const [licenseKey, setLicenseKey] = useState("");
  const [isActivating, setIsActivating] = useState(false);

  // Obtenir les clés de test
  const testLicenses = instantLicenseManager.getValidLicenses().slice(0, 4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!licenseKey.trim()) {
      toast.error("Veuillez entrer une clé de license");
      return;
    }

    setIsActivating(true);

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
  };

  const useTestLicense = (testKey: string) => {
    setLicenseKey(testKey);

    // Activation immédiate
    const result = instantLicenseManager.activateLicense(testKey);

    if (result.success) {
      toast.success(`🎉 ${testKey} activée !`);
      setTimeout(() => {
        onLicenseValid();
      }, 600);
    } else {
      toast.error("Erreur activation test");
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.info(`${key} copié !`);
  };

  const generateNewKey = () => {
    const newKey = instantLicenseManager.generateLicense();
    setLicenseKey(newKey);
    copyKey(newKey);
    toast.success("Nouvelle clé générée et copiée !");
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
              NothingAI - INSTANT
            </CardTitle>
            <CardDescription>
              Activation instantanée - ZERO latence sur Vercel
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
              <Rocket className="w-3 h-3 mr-1" />
              Vercel Ready
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
                disabled={isActivating}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground text-center">
                Format: NothingAi-ChiffreAléatoire
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
                  Activer Instantanément
                </>
              )}
            </Button>
          </form>

          {/* Clés de test instantanées */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="text-sm font-medium text-center text-green-400">
              🚀 Clés de test - Activation instantanée
            </h4>

            <div className="grid grid-cols-1 gap-2">
              {testLicenses.map((testKey) => (
                <div key={testKey} className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => useTestLicense(testKey)}
                    className="flex-1 text-xs font-mono"
                    disabled={isActivating}
                  >
                    <Key className="w-3 h-3 mr-2" />
                    {testKey}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyKey(testKey)}
                    className="px-2"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              variant="secondary"
              onClick={generateNewKey}
              className="w-full text-xs"
              disabled={isActivating}
            >
              <Sparkles className="w-3 h-3 mr-2" />
              Générer Nouvelle Clé
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Système local instantané - Optimisé pour Vercel
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
        <p>NothingAI © 2024 - Instant System ⚡</p>
      </div>
    </div>
  );
};

export default InstantLicenseGate;
