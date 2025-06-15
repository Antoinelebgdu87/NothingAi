// Système de license personnalisable - Durée et usages configurables
interface CustomLicense {
  key: string;
  createdAt: Date;
  expiresAt: Date;
  maxUsages: number;
  currentUsages: number;
  isActive: boolean;
}

class InstantLicenseManager {
  private userLicenseKey = "nothingai_license_instant";
  private licensesKey = "nothingai_custom_licenses";

  // Obtenir toutes les licenses personnalisées
  private getCustomLicenses(): CustomLicense[] {
    try {
      const stored = localStorage.getItem(this.licensesKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Sauvegarder les licenses personnalisées
  private saveCustomLicenses(licenses: CustomLicense[]): void {
    try {
      localStorage.setItem(this.licensesKey, JSON.stringify(licenses));
    } catch (error) {
      console.warn("⚠️ Erreur sauvegarde licenses:", error);
    }
  }

  // Créer une nouvelle license avec durée et usages personnalisés
  public createCustomLicense(
    durationDays: number,
    maxUsages: number,
  ): { success: boolean; key: string; message: string } {
    try {
      // Générer une clé unique
      const randomCode = Math.random().toString(36).substr(2, 8).toUpperCase();
      const licenseKey = `NothingAi-${randomCode}`;

      // Calculer les dates
      const createdAt = new Date();
      const expiresAt = new Date(
        createdAt.getTime() + durationDays * 24 * 60 * 60 * 1000,
      );

      // Créer la license
      const newLicense: CustomLicense = {
        key: licenseKey,
        createdAt,
        expiresAt,
        maxUsages,
        currentUsages: 0,
        isActive: true,
      };

      // Sauvegarder
      const licenses = this.getCustomLicenses();
      licenses.push(newLicense);
      this.saveCustomLicenses(licenses);

      console.log("🆕 License créée:", {
        key: licenseKey,
        duration: durationDays,
        maxUsages,
        expiresAt: expiresAt.toLocaleDateString(),
      });

      return {
        success: true,
        key: licenseKey,
        message: `License créée: ${durationDays} jours, ${maxUsages} usages`,
      };
    } catch (error) {
      console.error("❌ Erreur création license:", error);
      return {
        success: false,
        key: "",
        message: "Erreur lors de la création",
      };
    }
  }

  // Vérifier si une clé est valide
  public isValidLicense(licenseKey: string): boolean {
    if (!licenseKey || typeof licenseKey !== "string") {
      return false;
    }

    const cleanKey = licenseKey.trim().toUpperCase();

    // Vérifier dans les licenses personnalisées
    const licenses = this.getCustomLicenses();
    const license = licenses.find((l) => l.key === cleanKey);

    if (!license) {
      console.log("❌ Clé non trouvée:", cleanKey);
      return false;
    }

    // Vérifier l'expiration
    const now = new Date();
    const expiresAt = new Date(license.expiresAt);
    if (now > expiresAt) {
      console.log("❌ Clé expirée:", cleanKey);
      return false;
    }

    // Vérifier les usages
    if (license.currentUsages >= license.maxUsages) {
      console.log("❌ Clé épuisée:", cleanKey);
      return false;
    }

    console.log("✅ Clé valide:", cleanKey);
    return true;
  }

  // Activer une license
  public activateLicense(licenseKey: string): {
    success: boolean;
    message: string;
  } {
    if (!licenseKey || !licenseKey.trim()) {
      return {
        success: false,
        message: "Veuillez entrer une clé de license",
      };
    }

    const cleanKey = licenseKey.trim().toUpperCase();

    if (this.isValidLicense(cleanKey)) {
      // Incrémenter les usages
      const licenses = this.getCustomLicenses();
      const licenseIndex = licenses.findIndex((l) => l.key === cleanKey);

      if (licenseIndex !== -1) {
        licenses[licenseIndex].currentUsages += 1;
        this.saveCustomLicenses(licenses);
      }

      // Sauvegarder comme license active
      this.saveLicense(cleanKey);

      console.log("🎉 License activée:", cleanKey);
      return {
        success: true,
        message: "License activée avec succès !",
      };
    } else {
      return {
        success: false,
        message: "Clé de license invalide ou expirée",
      };
    }
  }

  // Sauvegarder la license active
  private saveLicense(licenseKey: string): void {
    try {
      localStorage.setItem(this.userLicenseKey, licenseKey);
      console.log("💾 License sauvegardée:", licenseKey);
    } catch (error) {
      console.warn("⚠️ Erreur sauvegarde:", error);
    }
  }

  // Récupérer la license sauvegardée
  public getSavedLicense(): string | null {
    try {
      const saved = localStorage.getItem(this.userLicenseKey);
      console.log("📋 License sauvegardée:", saved || "Aucune");
      return saved;
    } catch (error) {
      console.warn("⚠️ Erreur récupération:", error);
      return null;
    }
  }

  // Vérifier si l'utilisateur a une license valide
  public hasValidLicense(): boolean {
    const saved = this.getSavedLicense();

    if (!saved) {
      console.log("❌ Aucune license sauvegardée");
      return false;
    }

    const isValid = this.isValidLicense(saved);
    console.log("🔍 License sauvegardée valide:", isValid);

    return isValid;
  }

  // Supprimer la license active
  public clearLicense(): void {
    try {
      localStorage.removeItem(this.userLicenseKey);
      console.log("🗑️ License supprimée");
    } catch (error) {
      console.warn("⚠️ Erreur suppression:", error);
    }
  }

  // Obtenir toutes les licenses pour l'admin
  public getAllLicenses(): CustomLicense[] {
    return this.getCustomLicenses();
  }

  // Obtenir les détails d'une license
  public getLicenseDetails(licenseKey: string): CustomLicense | null {
    const licenses = this.getCustomLicenses();
    return licenses.find((l) => l.key === licenseKey.toUpperCase()) || null;
  }

  // Supprimer une license
  public deleteLicense(licenseKey: string): boolean {
    try {
      const licenses = this.getCustomLicenses();
      const filteredLicenses = licenses.filter(
        (l) => l.key !== licenseKey.toUpperCase(),
      );

      if (filteredLicenses.length < licenses.length) {
        this.saveCustomLicenses(filteredLicenses);
        console.log("🗑️ License supprimée:", licenseKey);
        return true;
      }

      return false;
    } catch (error) {
      console.error("❌ Erreur suppression:", error);
      return false;
    }
  }

  // Statistiques
  public getStats() {
    const licenses = this.getCustomLicenses();
    const now = new Date();

    const active = licenses.filter(
      (l) =>
        l.isActive &&
        new Date(l.expiresAt) > now &&
        l.currentUsages < l.maxUsages,
    );

    const expired = licenses.filter((l) => new Date(l.expiresAt) <= now);

    const exhausted = licenses.filter((l) => l.currentUsages >= l.maxUsages);

    return {
      totalLicenses: licenses.length,
      activeLicenses: active.length,
      expiredLicenses: expired.length,
      exhaustedLicenses: exhausted.length,
      hasActiveLicense: this.hasValidLicense(),
      currentLicense: this.getSavedLicense(),
      systemType: "Custom License System",
    };
  }
}

// Instance unique
export const instantLicenseManager = new InstantLicenseManager();

// Export du type pour TypeScript
export type InstantLicenseResult = {
  success: boolean;
  message: string;
};

export type { CustomLicense };
