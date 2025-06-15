import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
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
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wifi,
  Globe,
} from "lucide-react";
import { imageGenerator } from "@/lib/image-generation";
import { huggingFaceAPI } from "@/lib/huggingface-api";

interface HealthStatus {
  endpoint: string;
  healthy: boolean;
  responseTime?: number;
  error?: string;
}

const APIHealthCheck = () => {
  const [pollinationsHealth, setPollinationsHealth] = useState<HealthStatus[]>(
    [],
  );
  const [huggingFaceHealth, setHuggingFaceHealth] =
    useState<HealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkHealth = async () => {
    setIsChecking(true);

    try {
      // Check Pollinations endpoints
      const pollinationsResults = await imageGenerator.checkEndpointHealth();
      setPollinationsHealth(pollinationsResults);

      // Check Hugging Face (if token available)
      const hfStartTime = Date.now();
      try {
        const hfHealthy = await huggingFaceAPI.validateToken("");
        setHuggingFaceHealth({
          endpoint: "Hugging Face API",
          healthy: hfHealthy,
          responseTime: Date.now() - hfStartTime,
        });
      } catch (error) {
        setHuggingFaceHealth({
          endpoint: "Hugging Face API",
          healthy: false,
          responseTime: Date.now() - hfStartTime,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }

      setLastCheck(new Date());
    } catch (error) {
      console.error("Health check failed:", error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check on mount
    checkHealth();
  }, []);

  const getStatusIcon = (healthy: boolean) => {
    return healthy ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusBadge = (healthy: boolean) => {
    return (
      <Badge
        className={cn(
          "text-xs",
          healthy ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
        )}
      >
        {healthy ? "Actif" : "Indisponible"}
      </Badge>
    );
  };

  const overallHealth = {
    pollinations: pollinationsHealth.some((h) => h.healthy),
    huggingface: huggingFaceHealth?.healthy || false,
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Wifi className="w-4 h-4 mr-2" />
          État des Services
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            État des Services de Génération d'Images
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Résumé global */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getStatusIcon(overallHealth.pollinations)}
                  <span className="font-medium">Pollinations.ai</span>
                </div>
                {getStatusBadge(overallHealth.pollinations)}
                <p className="text-xs text-muted-foreground mt-1">
                  Génération gratuite
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getStatusIcon(overallHealth.huggingface)}
                  <span className="font-medium">Hugging Face</span>
                </div>
                {getStatusBadge(overallHealth.huggingface)}
                <p className="text-xs text-muted-foreground mt-1">
                  Stable Diffusion
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Détails Pollinations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Pollinations.ai Endpoints
              </CardTitle>
              <CardDescription>
                Vérification de la disponibilité des serveurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pollinationsHealth.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  Aucune vérification effectuée
                </div>
              ) : (
                pollinationsHealth.map((health, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(health.healthy)}
                      <div>
                        <p className="font-medium text-sm">
                          Endpoint {index + 1}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {health.endpoint}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(health.healthy)}
                      {health.responseTime && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {health.responseTime}ms
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Détails Hugging Face */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Hugging Face API</CardTitle>
              <CardDescription>
                Vérification de l'accès à Stable Diffusion
              </CardDescription>
            </CardHeader>
            <CardContent>
              {huggingFaceHealth ? (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(huggingFaceHealth.healthy)}
                    <div>
                      <p className="font-medium text-sm">
                        {huggingFaceHealth.endpoint}
                      </p>
                      {huggingFaceHealth.error && (
                        <p className="text-xs text-red-500">
                          {huggingFaceHealth.error}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(huggingFaceHealth.healthy)}
                    {huggingFaceHealth.responseTime && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {huggingFaceHealth.responseTime}ms
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  Aucune vérification effectuée
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {lastCheck && (
                <>
                  Dernière vérification: {lastCheck.toLocaleTimeString("fr-FR")}
                </>
              )}
            </div>
            <Button
              onClick={checkHealth}
              disabled={isChecking}
              variant="outline"
            >
              {isChecking ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Actualiser
            </Button>
          </div>

          {/* Conseils de dépannage */}
          {(!overallHealth.pollinations || !overallHealth.huggingface) && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  Conseils de Dépannage
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Vérifiez votre connexion internet</li>
                  <li>• Essayez de rafraîchir la page</li>
                  <li>• Certains réseaux bloquent les APIs externes</li>
                  <li>
                    • Si le problème persiste, les services peuvent être
                    temporairement indisponibles
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default APIHealthCheck;
