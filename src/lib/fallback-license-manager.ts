// Système de license de fallback quand Firebase n'est pas disponible
export interface FallbackLicense {
  id: string;
  key: string;
  usages: number;
  maxUsages: number;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  usedBy: string[];
  type: "trial" | "standard" | "premium" | "enterprise";
}

class FallbackLicenseManager {
  private storageKey = "nothingai_fallback_licenses";
  private userLicenseKey = "nothingai_fallback_user_license";
  private deviceId: string;

  constructor() {
    this.deviceId = this.generateDeviceId();
    console.log("🔄 Mode fallback activé - Système local");
  }

  private generateDeviceId(): string {
    let deviceId = localStorage.getItem("nothingai_device_id");
    if (!deviceId) {
      deviceId =
        "device_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
      localStorage.setItem("nothingai_device_id", deviceId);
    }
    return deviceId;
  }

  private encrypt(data: string): string {
    return btoa(data.split("").reverse().join(""));
  }

  private decrypt(data: string): string {
    try {
      return atob(data).split("").reverse().join("");
    } catch {
      return "";
    }
  }

  private getFallbackLicenses(): FallbackLicense[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return this.getDefaultLicenses();

      const licenses = JSON.parse(data);
      return licenses.map((license: any) => ({
        ...license,
        createdAt: new Date(license.createdAt),
        expiresAt: new Date(license.expiresAt),
      }));
    } catch {
      return this.getDefaultLicenses();
    }
  }

  private getDefaultLicenses(): FallbackLicense[] {
    // Créer quelques licenses de test par défaut
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 jours

    return [
      {
        id: "fallback_1",
        key: "NothingAi-4C24HUEQ", // La license mentionnée par l'utilisateur
        usages: 0,
        maxUsages: 5,
        createdAt: now,
        expiresAt: futureDate,
        isActive: true,
        usedBy: [],
        type: "standard",
      },
      {
        id: "fallback_2",
        key: "NothingAi-TEST1234",
        usages: 0,
        maxUsages: 3,
        createdAt: now,
        expiresAt: futureDate,
        isActive: true,
        usedBy: [],
        type: "trial",
      },
    ];
  }

  private saveFallbackLicenses(licenses: FallbackLicense[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(licenses));
    } catch (error) {
      console.error("Erreur sauvegarde licenses fallback:", error);
    }
  }

  public async generateLicense(
    maxUsages: number = 1,
    durationDays: number = 30,
    type: "trial" | "standard" | "premium" | "enterprise" = "standard",
  ): Promise<FallbackLicense> {
    const randomNumber = Math.random().toString(36).substr(2, 8).toUpperCase();
    const key = `NothingAi-${randomNumber}`;

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + durationDays * 24 * 60 * 60 * 1000,
    );

    const license: FallbackLicense = {
      id: "fallback_" + Date.now(),
      key,
      usages: 0,
      maxUsages,
      createdAt: now,
      expiresAt,
      isActive: true,
      usedBy: [],
      type,
    };

    const licenses = this.getFallbackLicenses();
    licenses.push(license);
    this.saveFallbackLicenses(licenses);

    console.log("📝 License fallback générée:", license.key);
    return license;
  }

  public async validateLicense(licenseKey: string): Promise<{
    valid: boolean;
    message: string;
    license?: FallbackLicense;
  }> {
    try {
      const licenses = this.getFallbackLicenses();
      const license = licenses.find((l) => l.key === licenseKey);

      if (!license) {
        return { valid: false, message: "License invalide (fallback)" };
      }

      if (!license.isActive) {
        return { valid: false, message: "License désactivée" };
      }

      const now = new Date();
      if (now > license.expiresAt) {
        return { valid: false, message: "License expirée" };
      }

      if (license.usages >= license.maxUsages) {
        return { valid: false, message: "License épuisée" };
      }

      return {
        valid: true,
        message: "License valide (mode fallback)",
        license,
      };
    } catch (error) {
      return { valid: false, message: "Erreur de validation fallback" };
    }
  }

  public async useLicense(
    licenseKey: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const validation = await this.validateLicense(licenseKey);

      if (!validation.valid || !validation.license) {
        return { success: false, message: validation.message };
      }

      const license = validation.license;

      // Vérifier si cet appareil a déjà utilisé cette license
      if (license.usedBy.includes(this.deviceId)) {
        this.setUserLicense(licenseKey);
        return {
          success: true,
          message: "License déjà active sur cet appareil (fallback)",
        };
      }

      // Marquer comme utilisée
      license.usages += 1;
      license.usedBy.push(this.deviceId);

      if (license.usages >= license.maxUsages) {
        license.isActive = false;
      }

      // Sauvegarder
      const licenses = this.getFallbackLicenses();
      const index = licenses.findIndex((l) => l.id === license.id);
      if (index !== -1) {
        licenses[index] = license;
        this.saveFallbackLicenses(licenses);
      }

      this.setUserLicense(licenseKey);
      return {
        success: true,
        message: "License activée avec succès (mode fallback)",
      };
    } catch (error) {
      return {
        success: false,
        message: "Erreur lors de l'activation (fallback)",
      };
    }
  }

  public setUserLicense(licenseKey: string): void {
    const encrypted = this.encrypt(licenseKey);
    localStorage.setItem(this.userLicenseKey, encrypted);
  }

  public getUserLicense(): string | null {
    try {
      const encrypted = localStorage.getItem(this.userLicenseKey);
      if (!encrypted) return null;
      return this.decrypt(encrypted);
    } catch {
      return null;
    }
  }

  public async hasValidLicense(): Promise<boolean> {
    try {
      const userLicense = this.getUserLicense();
      if (!userLicense) return false;

      const validation = await this.validateLicense(userLicense);
      if (!validation.valid) {
        localStorage.removeItem(this.userLicenseKey);
        return false;
      }

      const license = validation.license;
      if (!license?.usedBy.includes(this.deviceId)) {
        localStorage.removeItem(this.userLicenseKey);
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  public async getAllLicenses(): Promise<FallbackLicense[]> {
    return this.getFallbackLicenses();
  }

  public async deleteLicense(licenseId: string): Promise<boolean> {
    try {
      const licenses = this.getFallbackLicenses();
      const filtered = licenses.filter((l) => l.id !== licenseId);
      this.saveFallbackLicenses(filtered);
      return true;
    } catch {
      return false;
    }
  }

  public async updateLicense(
    licenseId: string,
    updates: Partial<FallbackLicense>,
  ): Promise<boolean> {
    try {
      const licenses = this.getFallbackLicenses();
      const index = licenses.findIndex((l) => l.id === licenseId);
      if (index === -1) return false;

      licenses[index] = { ...licenses[index], ...updates };
      this.saveFallbackLicenses(licenses);
      return true;
    } catch {
      return false;
    }
  }

  public clearUserLicense(): void {
    localStorage.removeItem(this.userLicenseKey);
  }

  public async getLicenseStats() {
    const licenses = this.getFallbackLicenses();
    const now = new Date();

    return {
      totalLicenses: licenses.length,
      activeLicenses: licenses.filter((l) => l.isActive).length,
      expiredLicenses: licenses.filter((l) => l.expiresAt < now).length,
      usedLicenses: licenses.filter((l) => l.usages > 0).length,
      totalUsages: licenses.reduce((sum, l) => sum + l.usages, 0),
      deviceCount: new Set(licenses.flatMap((l) => l.usedBy)).size,
    };
  }

  public async testConnection(): Promise<boolean> {
    // Le système fallback est toujours "connecté"
    return true;
  }
}

export const fallbackLicenseManager = new FallbackLicenseManager();
