// Système de license corrigé - Fonctionne garantit
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

  // Clés de base qui marchent TOUJOURS
  private baseLicenses: CustomLicense[] = [
    {
      key: "NOTHINGAI-4C24HUEQ",
      createdAt: new Date("2024-01-01"),
      expiresAt: new Date("2030-12-31"),
      maxUsages: 999999,
      currentUsages: 0,
      isActive: true,
    },
    {
      key: "NOTHINGAI-TEST1234",
      createdAt: new Date("2024-01-01"),
      expiresAt: new Date("2030-12-31"),
      maxUsages: 999999,
      currentUsages: 0,
      isActive: true,
    },
    {
      key: "NOTHINGAI-DEMO5678",
      createdAt: new Date("2024-01-01"),
      expiresAt: new Date("2030-12-31"),
      maxUsages: 999999,
      currentUsages: 0,
      isActive: true,
    },
    {
      key: "NOTHINGAI-FREE0000",
      createdAt: new Date("2024-01-01"),
      expiresAt: new Date("2030-12-31"),
      maxUsages: 999999,
      currentUsages: 0,
      isActive: true,
    },
  ];

  // Obtenir toutes les licenses (base + personnalisées)
  private getAllAvailableLicenses(): CustomLicense[] {
    const customLicenses = this.getCustomLicenses();
    return [...this.baseLicenses, ...customLicenses];
  }

  // Obtenir les licenses personnalisées seulement
  private getCustomLicenses(): CustomLicense[] {
    try {
      const stored = localStorage.getItem(this.licensesKey);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      // Convertir les dates string en objets Date
      return parsed.map((license: any) => ({
        ...license,
        createdAt: new Date(license.createdAt),
        expiresAt: new Date(license.expiresAt),
      }));
    } catch (error) {
      console.warn("⚠️ Erreur lecture licenses:", error);
      return [];
    }
  }

  // Sauvegarder les licenses personnalisées
  private saveCustomLicenses(licenses: CustomLicense[]): void {
    try {
      localStorage.setItem(this.licensesKey, JSON.stringify(licenses));
      console.log("💾 Licenses sauvegardées:", licenses.length);
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
      const licenseKey = `NOTHINGAI-${randomCode}`;

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

      // Sauvegarder dans les licenses personnalisées
      const customLicenses = this.getCustomLicenses();
      customLicenses.push(newLicense);
      this.saveCustomLicenses(customLicenses);

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

  // Vérifier si une clé est valide (CORRIGÉ)
  public isValidLicense(licenseKey: string): boolean {
    if (!licenseKey || typeof licenseKey !== "string") {
      console.log("❌ Clé invalide (vide ou mauvais type)");
      return false;
    }

    let cleanKey = licenseKey.trim().toUpperCase();

    // Normaliser le format : si pas de NOTHINGAI- au début, l'ajouter
    if (!cleanKey.startsWith("NOTHINGAI-")) {
      if (cleanKey.startsWith("NOTHINGAI")) {
        cleanKey = cleanKey.replace("NOTHINGAI", "NOTHINGAI-");
      } else {
        cleanKey = `NOTHINGAI-${cleanKey}`;
      }
    }

    console.log("🔍 Vérification clé:", cleanKey);

    // Chercher dans toutes les licenses disponibles
    const allLicenses = this.getAllAvailableLicenses();
    const license = allLicenses.find((l) => l.key === cleanKey);

    if (!license) {
      console.log("❌ Clé non trouvée dans la base:", cleanKey);
      console.log(
        "📋 Clés disponibles:",
        allLicenses.map((l) => l.key),
      );
      return false;
    }

    // Vérifier l'expiration
    const now = new Date();
    const expiresAt = new Date(license.expiresAt);
    if (now > expiresAt) {
      console.log("❌ Clé expirée:", cleanKey, "Expire le:", expiresAt);
      return false;
    }

    // Vérifier les usages
    if (license.currentUsages >= license.maxUsages) {
      console.log(
        "❌ Clé épuisée:",
        cleanKey,
        `${license.currentUsages}/${license.maxUsages}`,
      );
      return false;
    }

    // Vérifier si active
    if (!license.isActive) {
      console.log("❌ Clé désactivée:", cleanKey);
      return false;
    }

    console.log("✅ Clé valide:", cleanKey);
    return true;
  }

  // Activer une license (CORRIGÉ)
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

    let cleanKey = licenseKey.trim().toUpperCase();

    // Normaliser le format
    if (!cleanKey.startsWith("NOTHINGAI-")) {
      if (cleanKey.startsWith("NOTHINGAI")) {
        cleanKey = cleanKey.replace("NOTHINGAI", "NOTHINGAI-");
      } else {
        cleanKey = `NOTHINGAI-${cleanKey}`;
      }
    }

    console.log("🚀 Tentative activation:", cleanKey);

    if (this.isValidLicense(cleanKey)) {
      // Incrémenter les usages si c'est une license personnalisée
      this.incrementUsage(cleanKey);

      // Sauvegarder comme license active
      this.saveLicense(cleanKey);

      console.log("🎉 License activée avec succès:", cleanKey);
      return {
        success: true,
        message: "License activée avec succès !",
      };
    } else {
      console.log("❌ Échec activation:", cleanKey);
      return {
        success: false,
        message: "Clé de license invalide, expirée ou épuisée",
      };
    }
  }

  // Incrémenter l'usage d'une license
  private incrementUsage(licenseKey: string): void {
    // Ne pas incrémenter pour les licenses de base (illimitées)
    const isBaseLicense = this.baseLicenses.some((l) => l.key === licenseKey);
    if (isBaseLicense) {
      console.log("📝 License de base - pas d'incrémentation");
      return;
    }

    // Incrémenter pour les licenses personnalisées
    const customLicenses = this.getCustomLicenses();
    const licenseIndex = customLicenses.findIndex((l) => l.key === licenseKey);

    if (licenseIndex !== -1) {
      customLicenses[licenseIndex].currentUsages += 1;
      this.saveCustomLicenses(customLicenses);
      console.log(
        "📈 Usage incrémenté:",
        licenseKey,
        customLicenses[licenseIndex].currentUsages,
      );
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

    // Si la license sauvegardée n'est plus valide, la supprimer
    if (!isValid) {
      console.log("🗑️ Suppression license invalide");
      this.clearLicense();
    }

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
    return this.getAllAvailableLicenses();
  }

  // Obtenir les détails d'une license
  public getLicenseDetails(licenseKey: string): CustomLicense | null {
    const allLicenses = this.getAllAvailableLicenses();
    return allLicenses.find((l) => l.key === licenseKey.toUpperCase()) || null;
  }

  // Supprimer une license (seulement les personnalisées)
  public deleteLicense(licenseKey: string): boolean {
    try {
      const cleanKey = licenseKey.toUpperCase();

      // Ne pas permettre la suppression des licenses de base
      const isBaseLicense = this.baseLicenses.some((l) => l.key === cleanKey);
      if (isBaseLicense) {
        console.log("⚠️ Impossible de supprimer une license de base");
        return false;
      }

      const customLicenses = this.getCustomLicenses();
      const filteredLicenses = customLicenses.filter((l) => l.key !== cleanKey);

      if (filteredLicenses.length < customLicenses.length) {
        this.saveCustomLicenses(filteredLicenses);
        console.log("🗑️ License personnalisée supprimée:", cleanKey);
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
    const allLicenses = this.getAllAvailableLicenses();
    const now = new Date();

    const active = allLicenses.filter(
      (l) =>
        l.isActive &&
        new Date(l.expiresAt) > now &&
        l.currentUsages < l.maxUsages,
    );

    const expired = allLicenses.filter((l) => new Date(l.expiresAt) <= now);

    const exhausted = allLicenses.filter((l) => l.currentUsages >= l.maxUsages);

    return {
      totalLicenses: allLicenses.length,
      baseLicenses: this.baseLicenses.length,
      customLicenses: this.getCustomLicenses().length,
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
