// Gestionnaire hybride qui utilise Firebase quand disponible, sinon fallback local
import { firebaseLicenseManager } from "./firebase-license-manager";
import { fallbackLicenseManager } from "./fallback-license-manager";

type LicenseType = "trial" | "standard" | "premium" | "enterprise";

class HybridLicenseManager {
  private useFirebase: boolean = true;
  private connectionTested: boolean = false;

  constructor() {
    console.log("🔗 Gestionnaire hybride de licenses initialisé");
    this.testConnectionAsync();
  }

  private async testConnectionAsync() {
    try {
      const connected = await firebaseLicenseManager.testConnection();
      this.useFirebase = connected;
      this.connectionTested = true;

      console.log(
        this.useFirebase
          ? "✅ Mode Firebase activé"
          : "🔄 Mode fallback local activé",
      );
    } catch (error) {
      console.warn("⚠️ Erreur test connexion, basculement en mode local");
      this.useFirebase = false;
      this.connectionTested = true;
    }
  }

  private async ensureConnectionTested(): Promise<void> {
    if (!this.connectionTested) {
      await this.testConnectionAsync();
    }
  }

  private getManager() {
    return this.useFirebase ? firebaseLicenseManager : fallbackLicenseManager;
  }

  public async testConnection(): Promise<boolean> {
    await this.ensureConnectionTested();

    if (this.useFirebase) {
      try {
        const connected = await firebaseLicenseManager.testConnection();
        if (!connected) {
          console.log("🔄 Firebase indisponible, basculement vers fallback");
          this.useFirebase = false;
        }
        return connected;
      } catch (error) {
        console.log("🔄 Erreur Firebase, basculement vers fallback");
        this.useFirebase = false;
        return false;
      }
    } else {
      return fallbackLicenseManager.testConnection();
    }
  }

  public async generateLicense(
    maxUsages: number = 1,
    durationDays: number = 30,
    type: LicenseType = "standard",
  ) {
    await this.ensureConnectionTested();

    try {
      if (this.useFirebase) {
        return await firebaseLicenseManager.generateLicense(
          maxUsages,
          durationDays,
          type,
        );
      } else {
        return await fallbackLicenseManager.generateLicense(
          maxUsages,
          durationDays,
          type,
        );
      }
    } catch (error) {
      console.warn("Erreur génération Firebase, basculement vers fallback");
      this.useFirebase = false;
      return await fallbackLicenseManager.generateLicense(
        maxUsages,
        durationDays,
        type,
      );
    }
  }

  public async validateLicense(licenseKey: string) {
    await this.ensureConnectionTested();

    try {
      if (this.useFirebase) {
        return await firebaseLicenseManager.validateLicense(licenseKey);
      } else {
        return await fallbackLicenseManager.validateLicense(licenseKey);
      }
    } catch (error) {
      console.warn("Erreur validation Firebase, basculement vers fallback");
      this.useFirebase = false;
      return await fallbackLicenseManager.validateLicense(licenseKey);
    }
  }

  public async useLicense(licenseKey: string) {
    await this.ensureConnectionTested();

    try {
      if (this.useFirebase) {
        return await firebaseLicenseManager.useLicense(licenseKey);
      } else {
        return await fallbackLicenseManager.useLicense(licenseKey);
      }
    } catch (error) {
      console.warn("Erreur utilisation Firebase, basculement vers fallback");
      this.useFirebase = false;
      return await fallbackLicenseManager.useLicense(licenseKey);
    }
  }

  public async hasValidLicense(): Promise<boolean> {
    await this.ensureConnectionTested();

    try {
      if (this.useFirebase) {
        return await firebaseLicenseManager.hasValidLicense();
      } else {
        return await fallbackLicenseManager.hasValidLicense();
      }
    } catch (error) {
      console.warn("Erreur vérification Firebase, basculement vers fallback");
      this.useFirebase = false;
      return await fallbackLicenseManager.hasValidLicense();
    }
  }

  public async getAllLicenses() {
    await this.ensureConnectionTested();

    try {
      if (this.useFirebase) {
        return await firebaseLicenseManager.getAllLicenses();
      } else {
        return await fallbackLicenseManager.getAllLicenses();
      }
    } catch (error) {
      console.warn("Erreur récupération Firebase, basculement vers fallback");
      this.useFirebase = false;
      return await fallbackLicenseManager.getAllLicenses();
    }
  }

  public async deleteLicense(licenseId: string): Promise<boolean> {
    await this.ensureConnectionTested();

    try {
      if (this.useFirebase) {
        return await firebaseLicenseManager.deleteLicense(licenseId);
      } else {
        return await fallbackLicenseManager.deleteLicense(licenseId);
      }
    } catch (error) {
      console.warn("Erreur suppression Firebase, basculement vers fallback");
      this.useFirebase = false;
      return await fallbackLicenseManager.deleteLicense(licenseId);
    }
  }

  public async updateLicense(
    licenseId: string,
    updates: any,
  ): Promise<boolean> {
    await this.ensureConnectionTested();

    try {
      if (this.useFirebase) {
        return await firebaseLicenseManager.updateLicense(licenseId, updates);
      } else {
        return await fallbackLicenseManager.updateLicense(licenseId, updates);
      }
    } catch (error) {
      console.warn("Erreur mise à jour Firebase, basculement vers fallback");
      this.useFirebase = false;
      return await fallbackLicenseManager.updateLicense(licenseId, updates);
    }
  }

  public async getLicenseStats() {
    await this.ensureConnectionTested();

    try {
      if (this.useFirebase) {
        return await firebaseLicenseManager.getLicenseStats();
      } else {
        return await fallbackLicenseManager.getLicenseStats();
      }
    } catch (error) {
      console.warn("Erreur stats Firebase, basculement vers fallback");
      this.useFirebase = false;
      return await fallbackLicenseManager.getLicenseStats();
    }
  }

  // Méthodes de gestion locale (communes aux deux systèmes)
  public setUserLicense(licenseKey: string): void {
    this.getManager().setUserLicense(licenseKey);
  }

  public getUserLicense(): string | null {
    return this.getManager().getUserLicense();
  }

  public clearUserLicense(): void {
    this.getManager().clearUserLicense();
  }

  // Informations sur le mode actuel
  public getStatus() {
    return {
      mode: this.useFirebase ? "firebase" : "fallback",
      connectionTested: this.connectionTested,
      timestamp: new Date().toISOString(),
    };
  }

  // Force le test de connexion
  public async forceConnectionTest(): Promise<boolean> {
    this.connectionTested = false;
    await this.testConnectionAsync();
    return this.useFirebase;
  }
}

export const hybridLicenseManager = new HybridLicenseManager();
