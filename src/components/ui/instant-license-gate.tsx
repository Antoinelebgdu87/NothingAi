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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Key,
  Shield,
  Sparkles,
  CheckCircle,
  Zap,
  Rocket,
  Copy,
  Plus,
  Clock,
  Hash,
} from "lucide-react";
import { instantLicenseManager } from "@/lib/instant-license-manager";
import { toast } from "sonner";

interface InstantLicenseGateProps {
  onLicenseValid: () => void;
}

const InstantLicenseGate = ({ onLicenseValid }: InstantLicenseGateProps) => {
  const [licenseKey, setLicenseKey] = useState("");
  const [isActivating, setIsActivating] = useState(false);

  // États pour la création de license
  const [duration, setDuration] = useState(30);
  const [maxUsages, setMaxUsages] = useState(100);
  const [isCreating, setIsCreating] = useState(false);

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

  const createCustomLicense = () => {
    if (duration < 1 || duration > 365) {
      toast.error("Durée doit être entre 1 et 365 jours");
      return;
    }

    if (maxUsages < 1 || maxUsages > 10000) {
      toast.error("Usages doivent être entre 1 et 10000");
      return;
    }

    setIsCreating(true);

    // Création instantanée
    const result = instantLicenseManager.createCustomLicense(
      duration,
      maxUsages,
    );

    if (result.success) {
      // Copier automatiquement
      navigator.clipboard.writeText(result.key);
      setLicenseKey(result.key);

      toast.success(`🎉 ${result.message} - Clé copiée !`);

      // Auto-switch vers l'onglet activation
      setTimeout(() => {
        const activateTab = document.querySelector(
          '[data-value="activate"]',
        ) as HTMLElement;
        if (activateTab) activateTab.click();
      }, 500);
    } else {
      toast.error(result.message);
    }

    setIsCreating(false);
  };

  const copyGeneratedKey = () => {
    if (licenseKey) {
      navigator.clipboard.writeText(licenseKey);
      toast.info("Clé copiée !");
    }
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

      <Card className="w-full max-w-lg relative z-10 bg-card/95 backdrop-blur-sm border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="space-y-2">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Rocket className="w-6 h-6 text-primary" />
              NothingAI - License Manager
            </CardTitle>
            <CardDescription>
              Créez et activez vos licenses personnalisées
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
              Personnalisable
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 text-xs">
              <Rocket className="w-3 h-3 mr-1" />
              Instant
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Créer License</TabsTrigger>
              <TabsTrigger value="activate" data-value="activate">
                Activer License
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Durée (jours)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="365"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="text-center"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Entre 1 et 365 jours
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usages" className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Nombre d'utilisations
                  </Label>
                  <Input
                    id="usages"
                    type="number"
                    min="1"
                    max="10000"
                    value={maxUsages}
                    onChange={(e) => setMaxUsages(Number(e.target.value))}
                    className="text-center"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Entre 1 et 10000 utilisations
                  </p>
                </div>

                <Button
                  onClick={createCustomLicense}
                  className="w-full"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Créer License ({duration} jours, {maxUsages} usages)
                    </>
                  )}
                </Button>

                {licenseKey && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                      License créée avec succès :
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">
                        {licenseKey}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyGeneratedKey}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activate" className="space-y-4">
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
                    onChange={(e) =>
                      setLicenseKey(e.target.value.toUpperCase())
                    }
                    className="font-mono text-center text-lg tracking-wider"
                    disabled={isActivating}
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Entrez votre clé de license personnalisée
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
            </TabsContent>
          </Tabs>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Système personnalisable - Créez vos propres licenses
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
        <p>NothingAI © 2024 - Custom License System ⚡</p>
      </div>
    </div>
  );
};

export default InstantLicenseGate;
