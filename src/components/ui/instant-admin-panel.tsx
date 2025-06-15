import React, { useState } from "react";
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
  Copy,
  Trash2,
  Clock,
  Hash,
} from "lucide-react";
import {
  instantLicenseManager,
  type CustomLicense,
} from "@/lib/instant-license-manager";
import { toast } from "sonner";

interface InstantAdminPanelProps {
  open: boolean;
  onClose: () => void;
}

const InstantAdminPanel = ({ open, onClose }: InstantAdminPanelProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // États pour création de license
  const [duration, setDuration] = useState(30);
  const [maxUsages, setMaxUsages] = useState(100);

  // Credentials admin
  const ADMIN_CREDENTIALS = {
    email: "firefoxytb80@gmail.com",
    password: "Antoine80@",
  };

  const handleLogin = () => {
    if (
      email === ADMIN_CREDENTIALS.email &&
      password === ADMIN_CREDENTIALS.password
    ) {
      setIsAuthenticated(true);
      toast.success("Connexion admin réussie !");
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

  const createNewLicense = () => {
    if (duration < 1 || duration > 365) {
      toast.error("Durée doit être entre 1 et 365 jours");
      return;
    }

    if (maxUsages < 1 || maxUsages > 10000) {
      toast.error("Usages doivent être entre 1 et 10000");
      return;
    }

    const result = instantLicenseManager.createCustomLicense(
      duration,
      maxUsages,
    );

    if (result.success) {
      navigator.clipboard.writeText(result.key);
      toast.success(`License créée: ${result.key} (copiée !)`);
    } else {
      toast.error(result.message);
    }
  };

  const copyLicense = (licenseKey: string) => {
    navigator.clipboard.writeText(licenseKey);
    toast.success("Clé copiée !");
  };

  const deleteLicense = (licenseKey: string) => {
    const success = instantLicenseManager.deleteLicense(licenseKey);
    if (success) {
      toast.success("License supprimée !");
    } else {
      toast.error("Erreur lors de la suppression");
    }
  };

  const clearUserLicense = () => {
    instantLicenseManager.clearLicense();
    toast.success("License utilisateur supprimée !");
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR");
  };

  const getDaysRemaining = (expiresAt: Date | string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  if (!open) return null;

  const stats = instantLicenseManager.getStats();
  const allLicenses = instantLicenseManager.getAllLicenses();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            Panel Admin - License Manager ⚡
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
                Gestion des licenses personnalisées
              </p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder=""
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder=""
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                Se connecter
              </Button>
            </div>
          </div>
        ) : (
          // Panel admin
          <div className="space-y-6 p-6">
            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                  <div className="text-2xl font-bold text-red-600">
                    {stats.expiredLicenses}
                  </div>
                  <div className="text-xs text-muted-foreground">Expirées</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.exhaustedLicenses}
                  </div>
                  <div className="text-xs text-muted-foreground">Épuisées</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-sm font-bold text-purple-600">
                    {stats.hasActiveLicense ? "Oui" : "Non"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    User Connecté
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Création de license */}
            <Card>
              <CardHeader>
                <CardTitle>Créer Nouvelle License</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="admin-duration">Durée (jours)</Label>
                    <Input
                      id="admin-duration"
                      type="number"
                      min="1"
                      max="365"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="text-center"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-usages">Max Utilisations</Label>
                    <Input
                      id="admin-usages"
                      type="number"
                      min="1"
                      max="10000"
                      value={maxUsages}
                      onChange={(e) => setMaxUsages(Number(e.target.value))}
                      className="text-center"
                    />
                  </div>

                  <Button onClick={createNewLicense} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer ({duration}j, {maxUsages} usages)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={clearUserLicense}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear User License
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                <Shield className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>

            {/* Liste des licenses */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Licenses Personnalisées ({allLicenses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allLicenses.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    Aucune license créée
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allLicenses.map((license, index) => {
                      const daysRemaining = getDaysRemaining(license.expiresAt);
                      const isExpired = daysRemaining <= 0;
                      const isExhausted =
                        license.currentUsages >= license.maxUsages;
                      const isActive =
                        !isExpired && !isExhausted && license.isActive;

                      return (
                        <Card
                          key={license.key}
                          className={`p-4 ${
                            isExpired || isExhausted
                              ? "bg-red-50 dark:bg-red-900/20"
                              : isActive
                                ? "bg-green-50 dark:bg-green-900/20"
                                : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <code
                                  className="bg-muted px-2 py-1 rounded text-sm font-mono cursor-pointer hover:bg-primary/10 transition-colors"
                                  onClick={() => copyLicense(license.key)}
                                  title="Cliquer pour copier"
                                >
                                  {license.key}
                                </code>
                                <Badge
                                  variant={
                                    isActive
                                      ? "default"
                                      : isExpired
                                        ? "destructive"
                                        : isExhausted
                                          ? "secondary"
                                          : "outline"
                                  }
                                >
                                  {isExpired
                                    ? "Expirée"
                                    : isExhausted
                                      ? "Épuisée"
                                      : isActive
                                        ? "Active"
                                        : "Inactive"}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {isExpired
                                    ? `Expirée (${Math.abs(daysRemaining)}j)`
                                    : `${daysRemaining} jours restants`}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Hash className="w-3 h-3" />
                                  {license.currentUsages}/{license.maxUsages}{" "}
                                  usages
                                </div>
                                <div>
                                  Créée: {formatDate(license.createdAt)}
                                </div>
                                <div>
                                  Expire: {formatDate(license.expiresAt)}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyLicense(license.key)}
                                title="Copier"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteLicense(license.key)}
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
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

export default InstantAdminPanel;
