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
import { Shield, Key, Plus, Eye, EyeOff, Copy, Trash2 } from "lucide-react";
import { instantLicenseManager } from "@/lib/instant-license-manager";
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

  const generateNewLicense = () => {
    const newKey = instantLicenseManager.generateLicense();
    navigator.clipboard.writeText(newKey);
    toast.success(`License générée: ${newKey} (copiée !)`);
  };

  const copyLicense = (licenseKey: string) => {
    navigator.clipboard.writeText(licenseKey);
    toast.success("Clé copiée !");
  };

  const clearUserLicense = () => {
    instantLicenseManager.clearLicense();
    toast.success("License utilisateur supprimée !");
  };

  if (!open) return null;

  const stats = instantLicenseManager.getStats();
  const validLicenses = instantLicenseManager.getValidLicenses();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            Panel Admin Instant - NothingAI ⚡
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
                Système instantané local
              </p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="firefoxytb80@gmail.com"
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
                    placeholder="Antoine80@"
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalValidLicenses}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Clés Valides
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.hasActiveLicense ? "Oui" : "Non"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    License Active
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-sm font-bold text-purple-600">
                    {stats.currentLicense || "Aucune"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    License Actuelle
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-sm font-bold text-orange-600">
                    {stats.systemType}
                  </div>
                  <div className="text-xs text-muted-foreground">Système</div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button onClick={generateNewLicense}>
                <Plus className="w-4 h-4 mr-2" />
                Générer License
              </Button>
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
                <CardTitle>Clés Valides (Système Instant)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {validLicenses.map((license, index) => (
                    <Card key={license} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <code
                              className="bg-muted px-2 py-1 rounded text-sm font-mono cursor-pointer hover:bg-primary/10 transition-colors"
                              onClick={() => copyLicense(license)}
                              title="Cliquer pour copier"
                            >
                              {license}
                            </code>
                            <Badge variant="default">
                              {index < 5 ? "Prédéfinie" : "Générée"}
                            </Badge>
                            <Badge variant="default">Active</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Clé #{index + 1} - Cliquer pour copier
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyLicense(license)}
                            title="Copier"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InstantAdminPanel;
