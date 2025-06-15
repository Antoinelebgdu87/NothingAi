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
} from "lucide-react";
import { licenseManager, type License } from "@/lib/license-manager";
import { toast } from "sonner";

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

const AdminPanel = ({ open, onClose }: AdminPanelProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [activeTab, setActiveTab] = useState<"licenses" | "stats" | "settings">(
    "licenses",
  );

  // Données d'authentification admin
  const ADMIN_CREDENTIALS = {
    email: "firefoxytb80@gmail.com",
    password: "Antoine80@",
  };

  useEffect(() => {
    if (open && isAuthenticated) {
      loadLicenses();
    }
  }, [open, isAuthenticated]);

  const loadLicenses = () => {
    const allLicenses = licenseManager.getAllLicenses();
    setLicenses(allLicenses);
  };

  const handleLogin = () => {
    if (
      email === ADMIN_CREDENTIALS.email &&
      password === ADMIN_CREDENTIALS.password
    ) {
      setIsAuthenticated(true);
      toast.success("Connexion administrateur réussie");
      loadLicenses();
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

  const generateNewLicense = () => {
    const maxUsages = parseInt(
      prompt("Nombre d'utilisations autorisées:") || "1",
    );
    const durationDays = parseInt(prompt("Durée en jours:") || "30");

    if (
      isNaN(maxUsages) ||
      isNaN(durationDays) ||
      maxUsages < 1 ||
      durationDays < 1
    ) {
      toast.error("Valeurs invalides");
      return;
    }

    const license = licenseManager.generateLicense(maxUsages, durationDays);
    loadLicenses();
    toast.success(`License générée: ${license.key}`);
  };

  const deleteLicense = (licenseId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette license ?")) {
      const success = licenseManager.deleteLicense(licenseId);
      if (success) {
        loadLicenses();
        toast.success("License supprimée");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  const toggleLicense = (licenseId: string, isActive: boolean) => {
    const success = licenseManager.updateLicense(licenseId, {
      isActive: !isActive,
    });
    if (success) {
      loadLicenses();
      toast.success(`License ${!isActive ? "activée" : "désactivée"}`);
    }
  };

  const exportLicenses = () => {
    const data = JSON.stringify(licenses, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nothingai-licenses-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Licenses exportées");
  };

  const stats = licenseManager.getLicenseStats();

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-500" />
            Panel d'Administration NothingAI
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
                Accès restreint aux administrateurs autorisés
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
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button onClick={handleLogin} className="w-full">
                <Shield className="w-4 h-4 mr-2" />
                Se connecter
              </Button>
            </div>
          </div>
        ) : (
          // Interface d'administration
          <div className="space-y-6">
            {/* En-tête avec statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            </div>

            {/* Onglets */}
            <div className="flex space-x-1 bg-muted p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("licenses")}
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all",
                  activeTab === "licenses"
                    ? "bg-background shadow-sm"
                    : "hover:bg-background/50",
                )}
              >
                <Key className="w-4 h-4 mr-2 inline" />
                Licenses
              </button>
              <button
                onClick={() => setActiveTab("stats")}
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all",
                  activeTab === "stats"
                    ? "bg-background shadow-sm"
                    : "hover:bg-background/50",
                )}
              >
                <BarChart3 className="w-4 h-4 mr-2 inline" />
                Statistiques
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all",
                  activeTab === "settings"
                    ? "bg-background shadow-sm"
                    : "hover:bg-background/50",
                )}
              >
                <Settings className="w-4 h-4 mr-2 inline" />
                Paramètres
              </button>
            </div>

            {/* Contenu des onglets */}
            <div className="max-h-96 overflow-y-auto">
              {activeTab === "licenses" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      Gestion des Licenses
                    </h3>
                    <div className="flex gap-2">
                      <Button onClick={generateNewLicense} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Nouvelle License
                      </Button>
                      <Button
                        onClick={exportLicenses}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exporter
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {licenses.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Aucune license générée
                      </div>
                    ) : (
                      licenses.map((license) => (
                        <Card key={license.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                                  {license.key}
                                </code>
                                <Badge
                                  className={cn(
                                    license.isActive &&
                                      new Date() <= license.expiresAt
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700",
                                  )}
                                >
                                  {license.isActive &&
                                  new Date() <= license.expiresAt
                                    ? "Active"
                                    : "Inactive"}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Usages: {license.usages}/{license.maxUsages} •
                                Expire: {license.expiresAt.toLocaleDateString()}{" "}
                                • Créée:{" "}
                                {license.createdAt.toLocaleDateString()}
                              </div>
                              {license.usedBy.length > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  Utilisée par: {license.usedBy.length}{" "}
                                  appareil(s)
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  toggleLicense(license.id, license.isActive)
                                }
                              >
                                {license.isActive ? "Désactiver" : "Activer"}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteLicense(license.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "stats" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Statistiques Détaillées
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Répartition des Licenses
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span>Licenses actives:</span>
                          <Badge className="bg-green-100 text-green-700">
                            {stats.activeLicenses}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Licenses expirées:</span>
                          <Badge className="bg-red-100 text-red-700">
                            {stats.expiredLicenses}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Licenses utilisées:</span>
                          <Badge className="bg-orange-100 text-orange-700">
                            {stats.usedLicenses}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Utilisation</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total usages:</span>
                          <Badge className="bg-purple-100 text-purple-700">
                            {stats.totalUsages}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Taux d'utilisation:</span>
                          <span>
                            {stats.totalLicenses > 0
                              ? Math.round(
                                  (stats.usedLicenses / stats.totalLicenses) *
                                    100,
                                )
                              : 0}
                            %
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Paramètres Système</h3>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Actions Système
                      </CardTitle>
                      <CardDescription>
                        Actions critiques du système
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (
                            confirm(
                              "Êtes-vous sûr de vouloir supprimer TOUTES les licenses ? Cette action est irréversible.",
                            )
                          ) {
                            licenses.forEach((license) =>
                              licenseManager.deleteLicense(license.id),
                            );
                            loadLicenses();
                            toast.success(
                              "Toutes les licenses ont été supprimées",
                            );
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer Toutes les Licenses
                      </Button>

                      <Separator />

                      <div className="text-sm text-muted-foreground">
                        <p>
                          <strong>Version:</strong> NothingAI v1.0
                        </p>
                        <p>
                          <strong>Panel Admin:</strong> Accessible via Ctrl+F1
                        </p>
                        <p>
                          <strong>Sécurité:</strong> Protection DevTools active
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Actions du bas */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleLogout}>
                Déconnexion
              </Button>
              <Button onClick={onClose}>Fermer</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminPanel;
