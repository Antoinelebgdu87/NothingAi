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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Key,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Calendar,
  Users,
  Settings,
  Download,
  BarChart3,
  RefreshCw,
  Database,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  firebaseLicenseManager,
  type FirebaseLicense,
} from "@/lib/firebase-license-manager";
import { toast } from "sonner";

interface FirebaseAdminPanelProps {
  open: boolean;
  onClose: () => void;
}

const FirebaseAdminPanel = ({ open, onClose }: FirebaseAdminPanelProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [licenses, setLicenses] = useState<FirebaseLicense[]>([]);
  const [activeTab, setActiveTab] = useState<"licenses" | "stats" | "settings">(
    "licenses",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [stats, setStats] = useState({
    totalLicenses: 0,
    activeLicenses: 0,
    expiredLicenses: 0,
    usedLicenses: 0,
    totalUsages: 0,
    deviceCount: 0,
  });

  // Données d'authentification admin
  const ADMIN_CREDENTIALS = {
    email: "firefoxytb80@gmail.com",
    password: "Antoine80@",
  };

  useEffect(() => {
    if (open) {
      checkConnection();
    }
  }, [open]);

  useEffect(() => {
    if (open && isAuthenticated && isConnected) {
      loadData();
    }
  }, [open, isAuthenticated, isConnected]);

  const checkConnection = async () => {
    try {
      const connected = await firebaseLicenseManager.testConnection();
      setIsConnected(connected);
      if (!connected) {
        toast.error("Connexion Firebase indisponible");
      }
    } catch (error) {
      setIsConnected(false);
      toast.error("Erreur de connexion Firebase");
    }
  };

  const loadData = async () => {
    if (!isConnected) return;

    setIsLoading(true);
    try {
      const [licensesData, statsData] = await Promise.all([
        firebaseLicenseManager.getAllLicenses(),
        firebaseLicenseManager.getLicenseStats(),
      ]);

      setLicenses(licensesData);
      setStats(statsData);
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    if (
      email === ADMIN_CREDENTIALS.email &&
      password === ADMIN_CREDENTIALS.password
    ) {
      setIsAuthenticated(true);
      toast.success("Connexion administrateur réussie");
      if (isConnected) {
        loadData();
      }
    } else {
      toast.error("Identifiants incorrects");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setEmail("");
    setPassword("");
    onClose();
  };

  const generateNewLicense = async () => {
    if (!isConnected) {
      toast.error("Service indisponible");
      return;
    }

    const maxUsages = parseInt(
      prompt("Nombre d'utilisations autorisées:") || "1",
    );
    const durationDays = parseInt(prompt("Durée en jours:") || "30");
    const type = (prompt(
      "Type (trial/standard/premium/enterprise):",
      "standard",
    ) || "standard") as "trial" | "standard" | "premium" | "enterprise";

    if (
      isNaN(maxUsages) ||
      isNaN(durationDays) ||
      maxUsages < 1 ||
      durationDays < 1
    ) {
      toast.error("Valeurs invalides");
      return;
    }

    setIsLoading(true);
    try {
      const license = await firebaseLicenseManager.generateLicense(
        maxUsages,
        durationDays,
        type,
      );
      await loadData();
      toast.success(`License générée: ${license.key}`);

      // Copier automatiquement la clé
      navigator.clipboard.writeText(license.key);
      toast.info("Clé copiée dans le presse-papiers");
    } catch (error) {
      toast.error("Erreur lors de la génération de la license");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLicense = async (licenseId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette license ?")) {
      return;
    }

    setIsLoading(true);
    try {
      const success = await firebaseLicenseManager.deleteLicense(licenseId);
      if (success) {
        await loadData();
        toast.success("License supprimée");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLicense = async (licenseId: string, isActive: boolean) => {
    setIsLoading(true);
    try {
      const success = await firebaseLicenseManager.updateLicense(licenseId, {
        isActive: !isActive,
      });
      if (success) {
        await loadData();
        toast.success(`License ${!isActive ? "activée" : "désactivée"}`);
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsLoading(false);
    }
  };

  const exportLicenses = () => {
    const data = JSON.stringify(licenses, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nothingai-firebase-licenses-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Licenses exportées");
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("fr-FR") + " " + date.toLocaleTimeString();
  };

  const getLicenseTypeColor = (type: string) => {
    switch (type) {
      case "trial":
        return "bg-gray-100 text-gray-700";
      case "standard":
        return "bg-blue-100 text-blue-700";
      case "premium":
        return "bg-purple-100 text-purple-700";
      case "enterprise":
        return "bg-gold-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-500" />
            Panel d'Administration Firebase - NothingAI
            {isConnected !== null && (
              <Badge
                className={cn(
                  "ml-2",
                  isConnected
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700",
                )}
              >
                {isConnected ? (
                  <>
                    <Database className="w-3 h-3 mr-1" />
                    Connecté
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 mr-1" />
                    Déconnecté
                  </>
                )}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {!isAuthenticated ? (
          // Écran de connexion
          <div className="space-y-6 p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                Authentification Administrateur
              </h3>
              <p className="text-sm text-muted-foreground">
                Accès restreint aux administrateurs autorisés - Système Firebase
              </p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  disabled={!isConnected}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    disabled={!isConnected}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={!isConnected}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleLogin}
                className="w-full"
                disabled={!isConnected}
              >
                <Shield className="w-4 h-4 mr-2" />
                Se connecter
              </Button>

              {!isConnected && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkConnection}
                    className="mt-2"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Tester la connexion
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Interface d'administration
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* En-tête avec statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalLicenses}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.activeLicenses}
                  </div>
                  <div className="text-xs text-muted-foreground">Actives</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.usedLicenses}
                  </div>
                  <div className="text-xs text-muted-foreground">Utilisées</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {stats.expiredLicenses}
                  </div>
                  <div className="text-xs text-muted-foreground">Expirées</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.totalUsages}
                  </div>
                  <div className="text-xs text-muted-foreground">Usages</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-teal-600">
                    {stats.deviceCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Appareils</div>
                </CardContent>
              </Card>
            </div>

            {/* Actions rapides */}
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={generateNewLicense}
                disabled={isLoading || !isConnected}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle License
              </Button>
              <Button
                variant="outline"
                onClick={loadData}
                disabled={isLoading || !isConnected}
              >
                <RefreshCw
                  className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")}
                />
                Actualiser
              </Button>
              <Button variant="outline" onClick={exportLicenses}>
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                <Shield className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>

            {/* Liste des licenses */}
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Licenses Firebase</CardTitle>
                <CardDescription>
                  Toutes les licenses sont synchronisées en temps réel avec
                  Firebase
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Chargement...
                  </div>
                ) : licenses.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    Aucune license trouvée
                  </div>
                ) : (
                  <div className="space-y-4">
                    {licenses.map((license) => (
                      <Card key={license.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                {license.key}
                              </code>
                              <Badge
                                className={getLicenseTypeColor(license.type)}
                              >
                                {license.type}
                              </Badge>
                              <Badge
                                variant={
                                  license.isActive ? "default" : "secondary"
                                }
                              >
                                {license.isActive ? "Active" : "Inactive"}
                              </Badge>
                              {new Date() > license.expiresAt.toDate() && (
                                <Badge variant="destructive">Expirée</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <div>
                                Usages: {license.usages}/{license.maxUsages}
                              </div>
                              <div>Créée: {formatDate(license.createdAt)}</div>
                              <div>Expire: {formatDate(license.expiresAt)}</div>
                              {license.usedBy.length > 0 && (
                                <div>
                                  Appareils: {license.usedBy.length} appareil(s)
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                toggleLicense(license.id, license.isActive)
                              }
                              disabled={isLoading}
                            >
                              {license.isActive ? "Désactiver" : "Activer"}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteLicense(license.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FirebaseAdminPanel;
