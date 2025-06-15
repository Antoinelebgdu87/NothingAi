import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Key,
  Plus,
  Eye,
  EyeOff,
  Download,
  Copy,
  Trash2,
} from "lucide-react";
import {
  simpleLicenseManager,
  type SimpleLicense,
} from "@/lib/simple-license-manager";
import { toast } from "sonner";

interface SimpleAdminPanelProps {
  open: boolean;
  onClose: () => void;
}

const SimpleAdminPanel = ({ open, onClose }: SimpleAdminPanelProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [licenses, setLicenses] = useState<SimpleLicense[]>([]);
  const [stats, setStats] = useState({
    totalLicenses: 0,
    activeLicenses: 0,
    userHasLicense: false,
    userLicense: null as string | null,
  });

  // Credentials admin simplifiés
  const ADMIN_CREDENTIALS = {
    email: "firefoxytb80@gmail.com",
    password: "Antoine80@",
  };

  useEffect(() => {
    if (open && isAuthenticated) {
      loadData();
    }
  }, [open, isAuthenticated]);

  const loadData = () => {
    const allLicenses = simpleLicenseManager.getAllLicenses();
    const currentStats = simpleLicenseManager.getStats();

    setLicenses(allLicenses);
    setStats(currentStats);

    console.log("📊 Données admin chargées:", {
      licenses: allLicenses.length,
      stats: currentStats,
    });
  };

  const handleLogin = () => {
    if (
      email === ADMIN_CREDENTIALS.email &&
      password === ADMIN_CREDENTIALS.password
    ) {
      setIsAuthenticated(true);
      toast.success("Connexion admin réussie !");
      loadData();
    } else {
      toast.error(
        "Identifiants incorrects (firefoxytb80@gmail.com / Antoine80@)",
      );
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setEmail("");
    setPassword("");
    onClose();
  };

  const generateNewLicense = () => {
    try {
      const newLicense = simpleLicenseManager.generateLicense();
      loadData();

      // Copier automatiquement
      navigator.clipboard.writeText(newLicense.key);
      toast.success(`License générée: ${newLicense.key} (copiée !)`);
    } catch (error) {
      toast.error("Erreur lors de la génération");
    }
  };

  const copyLicense = (licenseKey: string) => {
    navigator.clipboard.writeText(licenseKey);
    toast.success("Clé copiée dans le presse-papiers !");
  };

  const deleteLicense = (licenseKey: string) => {
    try {
      const result = simpleLicenseManager.deleteLicense(licenseKey);
      if (result.success) {
        loadData(); // Recharger les données
        toast.success(`License ${licenseKey} supprimée !`);
      } else {
        toast.error(result.message || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression de la license");
    }
  };

  const exportLicenses = () => {
    const data = JSON.stringify(
      { licenses, stats, exportDate: new Date() },
      null,
      2,
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nothingai-licenses-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Licenses exportées !");
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            Panel d'Administration Simple - NothingAI
          </DialogTitle>
        </DialogHeader>

        {!isAuthenticated ? (
          // Écran de connexion
          <div className="space-y-6 p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                Connexion Administrateur
              </h3>
              <p className="text-sm text-muted-foreground">
                Système local simplifié
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
                  placeholder="admin@nothingai.com"
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
                    placeholder="admin123"
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

              <div className="text-center text-xs text-muted-foreground">
                <p>Identifiants par défaut:</p>
                <p>Email: admin@nothingai.com</p>
                <p>Mot de passe: admin123</p>
              </div>
            </div>
          </div>
        ) : (
          // Interface d'administration
          <div className="space-y-6">
            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalLicenses}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Licenses
                  </div>
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
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.userHasLicense ? "Oui" : "Non"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Utilisateur Connecté
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-sm font-bold text-orange-600">
                    {stats.userLicense || "Aucune"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    License Active
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button onClick={generateNewLicense}>
                <Plus className="w-4 h-4 mr-2" />
                Générer License
              </Button>
              <Button variant="outline" onClick={loadData}>
                🔄 Actualiser
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
                <CardTitle>Gestion des Licenses (Système Local)</CardTitle>
              </CardHeader>
              <CardContent>
                {licenses.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    Aucune license trouvée
                  </div>
                ) : (
                  <div className="space-y-3">
                    {licenses.map((license, index) => (
                      <Card key={license.key} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <code
                                className="bg-muted px-2 py-1 rounded text-sm font-mono cursor-pointer hover:bg-primary/10 transition-colors"
                                onClick={() => copyLicense(license.key)}
                                title="Cliquer pour copier"
                              >
                                {license.key}
                              </code>
                              <Badge variant="default">{license.name}</Badge>
                              <Badge
                                variant={
                                  license.active ? "default" : "secondary"
                                }
                              >
                                {license.active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              License #{index + 1} - Cliquer sur la clé pour
                              copier
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyLicense(license.key)}
                              title="Copier la clé"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteLicense(license.key)}
                              title="Supprimer cette clé"
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

export default SimpleAdminPanel;
