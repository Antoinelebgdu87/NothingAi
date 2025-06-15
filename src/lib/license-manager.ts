// Système de gestion des licenses pour NothingAI
export interface License {
  id: string;
  key: string;
  usages: number;
  maxUsages: number;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  usedBy: string[];
}

export interface LicenseUsage {
  licenseKey: string;
  usedAt: Date;
  deviceId: string;
  ipAddress?: string;
}

class LicenseManager {
  private storageKey = "nothingai_licenses";
  private usageKey = "nothingai_license_usage";
  private userLicenseKey = "nothingai_user_license";
  private deviceId: string;

  constructor() {
    this.deviceId = this.generateDeviceId();
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
    // Simple encryption (en production, utiliser une vraie encryption)
    return btoa(data.split("").reverse().join(""));
  }

  private decrypt(data: string): string {
    try {
      return atob(data).split("").reverse().join("");
    } catch {
      return "";
    }
  }

  private getLicenses(): License[] {
    try {
      const encrypted = localStorage.getItem(this.storageKey);
      if (!encrypted) return [];

      const decrypted = this.decrypt(encrypted);
      const licenses = JSON.parse(decrypted);

      return licenses.map((license: any) => ({
        ...license,
        createdAt: new Date(license.createdAt),
        expiresAt: new Date(license.expiresAt),
      }));
    } catch {
      return [];
    }
  }

  private saveLicenses(licenses: License[]): void {
    try {
      const data = JSON.stringify(licenses);
      const encrypted = this.encrypt(data);
      localStorage.setItem(this.storageKey, encrypted);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des licenses:", error);
    }
  }

  private getUsages(): LicenseUsage[] {
    try {
      const encrypted = localStorage.getItem(this.usageKey);
      if (!encrypted) return [];

      const decrypted = this.decrypt(encrypted);
      const usages = JSON.parse(decrypted);

      return usages.map((usage: any) => ({
        ...usage,
        usedAt: new Date(usage.usedAt),
      }));
    } catch {
      return [];
    }
  }

  private saveUsages(usages: LicenseUsage[]): void {
    try {
      const data = JSON.stringify(usages);
      const encrypted = this.encrypt(data);
      localStorage.setItem(this.usageKey, encrypted);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des usages:", error);
    }
  }

  public generateLicense(
    maxUsages: number = 1,
    durationDays: number = 30,
  ): License {
    const randomNumber = Math.random().toString(36).substr(2, 8).toUpperCase();
    const key = `NothingAi-${randomNumber}`;

    const license: License = {
      id: "lic_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      key,
      usages: 0,
      maxUsages,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      isActive: true,
      usedBy: [],
    };

    const licenses = this.getLicenses();
    licenses.push(license);
    this.saveLicenses(licenses);

    return license;
  }

  public validateLicense(licenseKey: string): {
    valid: boolean;
    message: string;
    license?: License;
  } {
    const licenses = this.getLicenses();
    const license = licenses.find((l) => l.key === licenseKey);

    if (!license) {
      return { valid: false, message: "License invalide" };
    }

    if (!license.isActive) {
      return { valid: false, message: "License désactivée" };
    }

    if (new Date() > license.expiresAt) {
      return { valid: false, message: "License expirée" };
    }

    if (license.usages >= license.maxUsages) {
      return {
        valid: false,
        message: "License épuisée (nombre maximum d'utilisations atteint)",
      };
    }

    return { valid: true, message: "License valide", license };
  }

  public useLicense(licenseKey: string): { success: boolean; message: string } {
    const validation = this.validateLicense(licenseKey);

    if (!validation.valid || !validation.license) {
      return { success: false, message: validation.message };
    }

    const license = validation.license;

    // Vérifier si cet appareil a déjà utilisé cette license
    if (license.usedBy.includes(this.deviceId)) {
      return {
        success: false,
        message: "Cette license a déjà été utilisée sur cet appareil",
      };
    }

    // Marquer la license comme utilisée
    license.usages += 1;
    license.usedBy.push(this.deviceId);

    // Si le nombre maximum d'utilisations est atteint, désactiver la license
    if (license.usages >= license.maxUsages) {
      license.isActive = false;
    }

    // Sauvegarder les modifications
    const licenses = this.getLicenses();
    const index = licenses.findIndex((l) => l.id === license.id);
    if (index !== -1) {
      licenses[index] = license;
      this.saveLicenses(licenses);
    }

    // Enregistrer l'usage
    const usage: LicenseUsage = {
      licenseKey,
      usedAt: new Date(),
      deviceId: this.deviceId,
    };

    const usages = this.getUsages();
    usages.push(usage);
    this.saveUsages(usages);

    // Sauvegarder la license de l'utilisateur
    this.setUserLicense(licenseKey);

    return { success: true, message: "License activée avec succès" };
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

  public hasValidLicense(): boolean {
    const userLicense = this.getUserLicense();
    if (!userLicense) return false;

    const validation = this.validateLicense(userLicense);
    if (!validation.valid) {
      // Supprimer la license invalide
      localStorage.removeItem(this.userLicenseKey);
      return false;
    }

    // Vérifier que cet appareil est autorisé
    const license = validation.license;
    if (!license?.usedBy.includes(this.deviceId)) {
      localStorage.removeItem(this.userLicenseKey);
      return false;
    }

    return true;
  }

  public getAllLicenses(): License[] {
    return this.getLicenses();
  }

  public deleteLicense(licenseId: string): boolean {
    const licenses = this.getLicenses();
    const index = licenses.findIndex((l) => l.id === licenseId);

    if (index === -1) return false;

    licenses.splice(index, 1);
    this.saveLicenses(licenses);
    return true;
  }

  public updateLicense(licenseId: string, updates: Partial<License>): boolean {
    const licenses = this.getLicenses();
    const index = licenses.findIndex((l) => l.id === licenseId);

    if (index === -1) return false;

    licenses[index] = { ...licenses[index], ...updates };
    this.saveLicenses(licenses);
    return true;
  }

  public clearUserLicense(): void {
    localStorage.removeItem(this.userLicenseKey);
  }

  public getLicenseStats() {
    const licenses = this.getLicenses();
    const usages = this.getUsages();

    return {
      totalLicenses: licenses.length,
      activeLicenses: licenses.filter((l) => l.isActive).length,
      expiredLicenses: licenses.filter((l) => new Date() > l.expiresAt).length,
      usedLicenses: licenses.filter((l) => l.usages > 0).length,
      totalUsages: usages.length,
    };
  }
}

export const licenseManager = new LicenseManager();
