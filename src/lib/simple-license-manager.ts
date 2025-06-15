// Système de license simple et local - Pas de Firebase
export interface SimpleLicense {
  key: string;
  name: string;
  active: boolean;
}

class SimpleLicenseManager {
  private userLicenseKey = "nothingai_simple_license";

  // Clés prédéfinies qui fonctionnent toujours
  private predefinedLicenses: SimpleLicense[] = [
    { key: "NothingAi-4C24HUEQ", name: "License Standard", active: true },
    { key: "NothingAi-TEST1234", name: "License Test", active: true },
    { key: "NothingAi-DEMO5678", name: "License Demo", active: true },
    { key: "NothingAi-FREE0000", name: "License Gratuite", active: true },
    { key: "NothingAi-ADMIN999", name: "License Admin", active: true },
  ];

  constructor() {
    console.log("🔑 Système de license simple initialisé");
    console.log(
      "📋 Clés disponibles:",
      this.predefinedLicenses.map((l) => l.key),
    );
  }

  // Valider une clé (vérifie si elle existe dans la liste prédéfinie)
  public validateLicense(licenseKey: string): {
    valid: boolean;
    message: string;
    license?: SimpleLicense;
  } {
    console.log("🔍 Validation de la clé:", licenseKey);

    const license = this.predefinedLicenses.find(
      (l) => l.key.toUpperCase() === licenseKey.toUpperCase(),
    );

    if (!license) {
      console.log("❌ Clé non trouvée");
      return {
        valid: false,
        message: "Clé de license invalide",
      };
    }

    if (!license.active) {
      console.log("❌ Clé désactivée");
      return {
        valid: false,
        message: "Cette license a été désactivée",
      };
    }

    console.log("✅ Clé valide:", license.name);
    return {
      valid: true,
      message: `License valide: ${license.name}`,
      license,
    };
  }

  // Utiliser une license (l'activer pour cet utilisateur)
  public useLicense(licenseKey: string): {
    success: boolean;
    message: string;
  } {
    const validation = this.validateLicense(licenseKey);

    if (!validation.valid) {
      return {
        success: false,
        message: validation.message,
      };
    }

    // Sauvegarder la license activée
    this.setUserLicense(licenseKey);

    console.log("🎉 License activée avec succès:", licenseKey);
    return {
      success: true,
      message: `License activée: ${validation.license?.name}`,
    };
  }

  // Sauvegarder la license de l'utilisateur
  public setUserLicense(licenseKey: string): void {
    try {
      localStorage.setItem(this.userLicenseKey, licenseKey);
      console.log("💾 License sauvegardée localement");
    } catch (error) {
      console.warn("⚠️ Erreur sauvegarde license:", error);
    }
  }

  // Récupérer la license de l'utilisateur
  public getUserLicense(): string | null {
    try {
      const license = localStorage.getItem(this.userLicenseKey);
      console.log("📖 License locale récupérée:", license || "Aucune");
      return license;
    } catch {
      return null;
    }
  }

  // Vérifier si l'utilisateur a une license valide
  public hasValidLicense(): boolean {
    const userLicense = this.getUserLicense();

    if (!userLicense) {
      console.log("❌ Aucune license locale trouvée");
      return false;
    }

    const validation = this.validateLicense(userLicense);

    if (!validation.valid) {
      console.log("❌ License locale invalide, suppression");
      this.clearUserLicense();
      return false;
    }

    console.log("✅ License locale valide");
    return true;
  }

  // Supprimer la license de l'utilisateur
  public clearUserLicense(): void {
    try {
      localStorage.removeItem(this.userLicenseKey);
      console.log("🗑️ License locale supprimée");
    } catch (error) {
      console.warn("⚠️ Erreur suppression license:", error);
    }
  }

  // Générer une nouvelle clé (pour les admins)
  public generateLicense(): SimpleLicense {
    const randomCode = Math.random().toString(36).substr(2, 8).toUpperCase();
    const newLicense: SimpleLicense = {
      key: `NothingAi-${randomCode}`,
      name: "License Générée",
      active: true,
    };

    this.predefinedLicenses.push(newLicense);
    console.log("🆕 Nouvelle license générée:", newLicense.key);

    return newLicense;
  }

  // Supprimer une license spécifique
  public deleteLicense(licenseKey: string): {
    success: boolean;
    message: string;
  } {
    try {
      const index = this.predefinedLicenses.findIndex(
        (l) => l.key === licenseKey,
      );

      if (index === -1) {
        return { success: false, message: "License non trouvée" };
      }

      // Vérifier si c'est la license actuellement utilisée
      const currentUserLicense = this.getUserLicense();
      if (currentUserLicense === licenseKey) {
        this.clearUserLicense();
        console.log("🔄 License active supprimée, utilisateur déconnecté");
      }

      // Supprimer la license de la liste
      this.predefinedLicenses.splice(index, 1);
      console.log("🗑️ License supprimée:", licenseKey);

      return { success: true, message: "License supprimée avec succès" };
    } catch (error) {
      console.error("⚠️ Erreur suppression license:", error);
      return { success: false, message: "Erreur lors de la suppression" };
    }
  }

  // Obtenir toutes les licenses
  public getAllLicenses(): SimpleLicense[] {
    return [...this.predefinedLicenses];
  }

  // Statistiques simples
  public getStats() {
    return {
      totalLicenses: this.predefinedLicenses.length,
      activeLicenses: this.predefinedLicenses.filter((l) => l.active).length,
      userHasLicense: this.hasValidLicense(),
      userLicense: this.getUserLicense(),
    };
  }

  // Test de connexion (toujours true pour le système local)
  public testConnection(): boolean {
    console.log("🔌 Test connexion système local: OK");
    return true;
  }

  // Supprimer complètement le compte et réinitialiser
  public deleteAccount(): void {
    try {
      // Supprimer la license de l'utilisateur
      this.clearUserLicense();

      // Supprimer toutes les données de l'application
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("nothingai")) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      console.log("🗑️ Compte supprimé - Toutes les données effacées");
      console.log("🔄 Retour à l'écran de license requis");
    } catch (error) {
      console.error("⚠️ Erreur lors de la suppression du compte:", error);
    }
  }
}

export const simpleLicenseManager = new SimpleLicenseManager();
