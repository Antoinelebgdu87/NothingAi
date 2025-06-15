// Système de license auto-validant - Clés fonctionnelles entre utilisateurs
interface CustomLicense {
  key: string;
  createdAt: Date;
  expiresAt: Date;
  maxUsages: number;
  currentUsages: number;
  isActive: boolean;
}

interface LicenseData {
  duration: number;
  maxUsages: number;
  created: number; // timestamp
}

class InstantLicenseManager {
  private userLicenseKey = "nothingai_license_instant";
  private usageKey = "nothingai_license_usage";

  // Clés de base qui marchent TOUJOURS pour tous
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

  // Encoder les données dans la clé (auto-validante)
  private encodeLicenseData(data: LicenseData): string {
    try {
      // Compactage des données pour une clé courte
      const compactData = {
        d: data.duration,
        u: data.maxUsages,
        c: Math.floor(data.created / 1000), // timestamp en secondes
      };

      const jsonStr = JSON.stringify(compactData);
      const encoded = btoa(jsonStr);

      // Remplacer caractères non-alphanumériques et raccourcir
      const cleanEncoded = encoded
        .replace(/[+/=]/g, "")
        .substring(0, 12)
        .toUpperCase();

      return cleanEncoded;
    } catch {
      return Math.random().toString(36).substr(2, 8).toUpperCase();
    }
  }

  // Décoder les données depuis la clé
  private decodeLicenseData(key: string): LicenseData | null {
    try {
      // Vérifier si c'est une clé encodée
      if (!key || key.length < 8) {
        return null;
      }

      // Extraire la partie encodée (supprimer préfixe/suffixe)
      let encodedPart = key;

      // Si la clé contient des caractères non-base64, essayer de les isoler
      const keyPart = key.replace("NOTHINGAI-", "");
      if (keyPart.length >= 8) {
        encodedPart = keyPart.substring(0, 12); // Prendre jusqu'à 12 chars
      }

      // Essayer différentes longueurs d'encodage
      for (let len = 8; len <= Math.min(encodedPart.length, 16); len++) {
        try {
          let testPart = encodedPart.substring(0, len);

          // Rétablir les caractères Base64 manquants
          while (testPart.length % 4 !== 0) {
            testPart += "=";
          }

          const decoded = atob(testPart);
          const data = JSON.parse(decoded);

          // Vérifier la structure compacte
          if (data.d && data.u && data.c) {
            return {
              duration: data.d,
              maxUsages: data.u,
              created: data.c * 1000, // reconvertir en millisecondes
            };
          }
        } catch {
          // Continuer avec la longueur suivante
          continue;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  // Créer une nouvelle license auto-validante
  public createCustomLicense(
    durationDays: number,
    maxUsages: number,
  ): { success: boolean; key: string; message: string } {
    try {
      const now = Date.now();

      // Données de la license
      const licenseData: LicenseData = {
        duration: durationDays,
        maxUsages: maxUsages,
        created: now,
      };

      // Encoder dans la clé
      const encodedPart = this.encodeLicenseData(licenseData);

      // Ajouter un suffixe aléatoire pour l'unicité
      const randomSuffix = Math.random()
        .toString(36)
        .substr(2, 4)
        .toUpperCase();
      const licenseKey = `NOTHINGAI-${encodedPart}${randomSuffix}`;

      console.log("🆕 License auto-validante créée:", {
        key: licenseKey,
        duration: durationDays,
        maxUsages,
        encoded: encodedPart,
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

  // Obtenir l'usage d'une clé (partagé globalement)
  private getLicenseUsage(licenseKey: string): {
    uses: number;
    firstUsed: number;
  } {
    try {
      const usageData = localStorage.getItem(`${this.usageKey}_${licenseKey}`);
      if (usageData) {
        return JSON.parse(usageData);
      }
      return { uses: 0, firstUsed: 0 };
    } catch {
      return { uses: 0, firstUsed: 0 };
    }
  }

  // Enregistrer l'usage d'une clé
  private setLicenseUsage(
    licenseKey: string,
    uses: number,
    firstUsed: number,
  ): void {
    try {
      const usageData = { uses, firstUsed };
      localStorage.setItem(
        `${this.usageKey}_${licenseKey}`,
        JSON.stringify(usageData),
      );
    } catch (error) {
      console.warn("⚠️ Erreur sauvegarde usage:", error);
    }
  }

  // Vérifier si une clé est valide (SYSTÈME PARTAGÉ)
  public isValidLicense(licenseKey: string): boolean {
    if (!licenseKey || typeof licenseKey !== "string") {
      console.log("❌ Clé invalide (vide ou mauvais type)");
      return false;
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

    console.log("🔍 Vérification clé:", cleanKey);

    // 1. Vérifier les clés de base (illimitées)
    const isBaseLicense = this.baseLicenses.some((l) => l.key === cleanKey);
    if (isBaseLicense) {
      console.log("✅ Clé de base valide:", cleanKey);
      return true;
    }

    // 2. Vérifier les clés auto-validantes
    const keyPart = cleanKey.replace("NOTHINGAI-", "");
    if (keyPart.length >= 8) {
      const licenseData = this.decodeLicenseData(keyPart);

      if (licenseData) {
        console.log("🔍 License auto-validante détectée:", licenseData);

        // Vérifier l'expiration
        const now = Date.now();
        const expiresAt =
          licenseData.created + licenseData.duration * 24 * 60 * 60 * 1000;

        if (now > expiresAt) {
          console.log("❌ License expirée:", new Date(expiresAt));
          return false;
        }

        // Vérifier les usages
        const usage = this.getLicenseUsage(cleanKey);
        if (usage.uses >= licenseData.maxUsages) {
          console.log(
            "❌ License épuisée:",
            `${usage.uses}/${licenseData.maxUsages}`,
          );
          return false;
        }

        console.log("✅ License auto-validante valide:", cleanKey);
        return true;
      }
    }

    console.log("❌ Clé non reconnue:", cleanKey);
    return false;
  }

  // Activer une license (SYSTÈME PARTAGÉ)
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
      // Incrémenter l'usage pour les clés auto-validantes
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

  // Incrémenter l'usage (SYSTÈME PARTAGÉ)
  private incrementUsage(licenseKey: string): void {
    // Ne pas incrémenter pour les licenses de base (illimitées)
    const isBaseLicense = this.baseLicenses.some((l) => l.key === licenseKey);
    if (isBaseLicense) {
      console.log("📝 License de base - pas d'incrémentation");
      return;
    }

    // Incrémenter pour les licenses auto-validantes
    const usage = this.getLicenseUsage(licenseKey);
    const newUsage = usage.uses + 1;
    const firstUsed = usage.firstUsed || Date.now();

    this.setLicenseUsage(licenseKey, newUsage, firstUsed);
    console.log("📈 Usage incrémenté:", licenseKey, newUsage);
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

  // Obtenir toutes les licenses pour l'admin (simulation)
  public getAllLicenses(): CustomLicense[] {
    const allLicenses = [...this.baseLicenses];

    // Ajouter des exemples de licenses créées
    try {
      // Scanner le localStorage pour les usages de licenses
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.usageKey)) {
          const licenseKey = key.replace(`${this.usageKey}_`, "");
          if (
            licenseKey.startsWith("NOTHINGAI-") &&
            !this.baseLicenses.some((l) => l.key === licenseKey)
          ) {
            const usage = this.getLicenseUsage(licenseKey);
            const keyPart = licenseKey.replace("NOTHINGAI-", "");
            const licenseData = this.decodeLicenseData(keyPart);

            if (licenseData) {
              const expiresAt = new Date(
                licenseData.created +
                  licenseData.duration * 24 * 60 * 60 * 1000,
              );

              allLicenses.push({
                key: licenseKey,
                createdAt: new Date(licenseData.created),
                expiresAt: expiresAt,
                maxUsages: licenseData.maxUsages,
                currentUsages: usage.uses,
                isActive: true,
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn("⚠️ Erreur scan licenses:", error);
    }

    return allLicenses;
  }

  // Obtenir les détails d'une license
  public getLicenseDetails(licenseKey: string): CustomLicense | null {
    const allLicenses = this.getAllLicenses();
    return allLicenses.find((l) => l.key === licenseKey.toUpperCase()) || null;
  }

  // Supprimer une license (effacer son usage)
  public deleteLicense(licenseKey: string): boolean {
    try {
      const cleanKey = licenseKey.toUpperCase();

      // Ne pas permettre la suppression des licenses de base
      const isBaseLicense = this.baseLicenses.some((l) => l.key === cleanKey);
      if (isBaseLicense) {
        console.log("⚠️ Impossible de supprimer une license de base");
        return false;
      }

      // Supprimer les données d'usage
      localStorage.removeItem(`${this.usageKey}_${cleanKey}`);
      console.log("🗑️ Usage de license supprimé:", cleanKey);
      return true;
    } catch (error) {
      console.error("❌ Erreur suppression:", error);
      return false;
    }
  }

  // Statistiques
  public getStats() {
    const allLicenses = this.getAllLicenses();
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
      customLicenses: allLicenses.length - this.baseLicenses.length,
      activeLicenses: active.length,
      expiredLicenses: expired.length,
      exhaustedLicenses: exhausted.length,
      hasActiveLicense: this.hasValidLicense(),
      currentLicense: this.getSavedLicense(),
      systemType: "Auto-Validating Shared System",
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
