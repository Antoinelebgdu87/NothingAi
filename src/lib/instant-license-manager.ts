// Système de license instantané pour Vercel - ZERO latence
class InstantLicenseManager {
  private userLicenseKey = "nothingai_license_instant";

  // Clés valides prédéfinies (marche TOUJOURS)
  private validLicenses = [
    "NothingAi-4C24HUEQ",
    "NothingAi-TEST1234",
    "NothingAi-DEMO5678",
    "NothingAi-FREE0000",
    "NothingAi-ADMIN999",
    "NothingAi-VERCEL01",
    "NothingAi-INSTANT1",
    "NothingAi-RAPID123",
  ];

  // Vérifier si une clé est valide (INSTANTANÉ)
  public isValidLicense(licenseKey: string): boolean {
    if (!licenseKey || typeof licenseKey !== "string") {
      return false;
    }

    const cleanKey = licenseKey.trim().toUpperCase();

    // Vérifier les clés prédéfinies
    if (this.validLicenses.includes(cleanKey)) {
      console.log("✅ Clé prédéfinie valide:", cleanKey);
      return true;
    }

    // Vérifier le format générique NothingAi-XXXXXXXX (8+ caractères)
    const formatRegex = /^NOTHINGAI-[A-Z0-9]{8,}$/;
    if (formatRegex.test(cleanKey)) {
      console.log("✅ Format valide accepté:", cleanKey);
      return true;
    }

    console.log("❌ Clé invalide:", cleanKey);
    return false;
  }

  // Activer une license (INSTANTANÉ)
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
      // Sauvegarder immédiatement
      this.saveLicense(cleanKey);

      console.log("🎉 License activée:", cleanKey);
      return {
        success: true,
        message: "License activée avec succès !",
      };
    } else {
      return {
        success: false,
        message: "Clé de license invalide. Format attendu: NothingAi-XXXXXXXX",
      };
    }
  }

  // Sauvegarder la license (INSTANTANÉ)
  private saveLicense(licenseKey: string): void {
    try {
      localStorage.setItem(this.userLicenseKey, licenseKey);
      console.log("💾 License sauvegardée:", licenseKey);
    } catch (error) {
      console.warn("⚠️ Erreur sauvegarde:", error);
    }
  }

  // Récupérer la license sauvegardée (INSTANTANÉ)
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

  // Vérifier si l'utilisateur a une license valide (INSTANTANÉ)
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

  // Supprimer la license (INSTANTANÉ)
  public clearLicense(): void {
    try {
      localStorage.removeItem(this.userLicenseKey);
      console.log("🗑️ License supprimée");
    } catch (error) {
      console.warn("⚠️ Erreur suppression:", error);
    }
  }

  // Obtenir toutes les clés valides (pour les tests)
  public getValidLicenses(): string[] {
    return [...this.validLicenses];
  }

  // Générer une nouvelle clé aléatoire (INSTANTANÉ)
  public generateLicense(): string {
    const randomCode = Math.random().toString(36).substr(2, 8).toUpperCase();
    const newKey = `NothingAi-${randomCode}`;

    // Ajouter à la liste des clés valides
    this.validLicenses.push(newKey);

    console.log("🆕 Nouvelle clé générée:", newKey);
    return newKey;
  }

  // Statistiques simples (INSTANTANÉ)
  public getStats() {
    return {
      totalValidLicenses: this.validLicenses.length,
      hasActiveLicense: this.hasValidLicense(),
      currentLicense: this.getSavedLicense(),
      systemType: "Instant Vercel",
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
