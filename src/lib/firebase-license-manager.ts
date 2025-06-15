import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase-config";

// Types pour Firebase
export interface FirebaseLicense {
  id: string;
  key: string;
  usages: number;
  maxUsages: number;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  isActive: boolean;
  usedBy: string[];
  createdBy?: string;
  type: "trial" | "standard" | "premium" | "enterprise";
  metadata?: {
    duration: number; // jours
    features: string[];
  };
}

export interface FirebaseLicenseUsage {
  id?: string;
  licenseKey: string;
  usedAt: Timestamp;
  deviceId: string;
  ipAddress?: string;
  userAgent?: string;
}

class FirebaseLicenseManager {
  private deviceId: string;
  private userLicenseKey = "nothingai_user_license_firebase";

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

  // Générer une nouvelle license dans Firebase
  public async generateLicense(
    maxUsages: number = 1,
    durationDays: number = 30,
    type: "trial" | "standard" | "premium" | "enterprise" = "standard",
  ): Promise<FirebaseLicense> {
    try {
      const randomNumber = Math.random()
        .toString(36)
        .substr(2, 8)
        .toUpperCase();
      const key = `NothingAi-${randomNumber}`;

      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + durationDays * 24 * 60 * 60 * 1000,
      );

      const licenseData: Omit<FirebaseLicense, "id"> = {
        key,
        usages: 0,
        maxUsages,
        createdAt: Timestamp.fromDate(now),
        expiresAt: Timestamp.fromDate(expiresAt),
        isActive: true,
        usedBy: [],
        type,
        metadata: {
          duration: durationDays,
          features: this.getFeaturesForType(type),
        },
      };

      // Ajouter à Firebase
      const docRef = await addDoc(collection(db, "licenses"), licenseData);

      const license: FirebaseLicense = {
        ...licenseData,
        id: docRef.id,
      };

      console.log("License créée avec succès:", license);
      return license;
    } catch (error) {
      console.error("Erreur lors de la création de la license:", error);
      throw new Error("Impossible de créer la license");
    }
  }

  private getFeaturesForType(type: string): string[] {
    switch (type) {
      case "trial":
        return ["chat_basic", "image_generation_limited"];
      case "standard":
        return ["chat_basic", "image_generation", "custom_prompts"];
      case "premium":
        return [
          "chat_advanced",
          "image_generation",
          "custom_prompts",
          "priority_support",
        ];
      case "enterprise":
        return [
          "chat_advanced",
          "image_generation",
          "custom_prompts",
          "priority_support",
          "api_access",
          "analytics",
        ];
      default:
        return ["chat_basic"];
    }
  }

  // Valider une license depuis Firebase
  public async validateLicense(licenseKey: string): Promise<{
    valid: boolean;
    message: string;
    license?: FirebaseLicense;
  }> {
    try {
      console.log("🔍 Recherche de la license dans Firebase:", licenseKey);

      // Rechercher la license par clé
      const licenseQuery = query(
        collection(db, "licenses"),
        where("key", "==", licenseKey),
        limit(1),
      );

      const querySnapshot = await getDocs(licenseQuery);
      console.log(
        "📄 Résultats de la requête Firebase:",
        querySnapshot.size,
        "document(s) trouvé(s)",
      );

      if (querySnapshot.empty) {
        console.log("❌ Aucune license trouvée avec cette clé");
        return { valid: false, message: "License invalide" };
      }

      const licenseDoc = querySnapshot.docs[0];
      const license = {
        id: licenseDoc.id,
        ...licenseDoc.data(),
      } as FirebaseLicense;

      if (!license.isActive) {
        return { valid: false, message: "License désactivée" };
      }

      // Vérifier l'expiration
      const now = new Date();
      const expiresAt = license.expiresAt.toDate();

      if (now > expiresAt) {
        return { valid: false, message: "License expirée" };
      }

      if (license.usages >= license.maxUsages) {
        return {
          valid: false,
          message: "License épuisée (nombre maximum d'utilisations atteint)",
        };
      }

      return { valid: true, message: "License valide", license };
    } catch (error) {
      console.error("Erreur lors de la validation:", error);
      return {
        valid: false,
        message: "Erreur lors de la validation de la license",
      };
    }
  }

  // Utiliser une license
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
        // L'appareil est déjà autorisé, sauvegarder localement
        this.setUserLicense(licenseKey);
        return {
          success: true,
          message: "License déjà active sur cet appareil",
        };
      }

      // Marquer la license comme utilisée
      const updatedUsedBy = [...license.usedBy, this.deviceId];
      const updatedUsages = license.usages + 1;
      const updatedIsActive = updatedUsages < license.maxUsages;

      await updateDoc(doc(db, "licenses", license.id), {
        usages: updatedUsages,
        usedBy: updatedUsedBy,
        isActive: updatedIsActive,
      });

      // Enregistrer l'usage
      const usage: Omit<FirebaseLicenseUsage, "id"> = {
        licenseKey,
        usedAt: serverTimestamp() as Timestamp,
        deviceId: this.deviceId,
        userAgent: navigator.userAgent,
      };

      await addDoc(collection(db, "license_usages"), usage);

      // Sauvegarder la license de l'utilisateur localement
      this.setUserLicense(licenseKey);

      return { success: true, message: "License activée avec succès" };
    } catch (error) {
      console.error("Erreur lors de l'utilisation de la license:", error);
      return {
        success: false,
        message: "Erreur lors de l'activation de la license",
      };
    }
  }

  // Gestion locale de la license utilisateur
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

  // Vérifier si l'utilisateur a une license valide
  public async hasValidLicense(): Promise<boolean> {
    try {
      console.log("🔍 Vérification de license existante...");
      const userLicense = this.getUserLicense();
      console.log("📋 License locale trouvée:", userLicense ? "Oui" : "Non");

      if (!userLicense) {
        console.log("❌ Aucune license locale trouvée");
        return false;
      }

      console.log("🔄 Validation de la license:", userLicense);
      const validation = await this.validateLicense(userLicense);
      console.log(
        "✅ Résultat validation:",
        validation.valid,
        validation.message,
      );

      if (!validation.valid) {
        console.log("❌ License invalide, suppression locale");
        localStorage.removeItem(this.userLicenseKey);
        return false;
      }

      // Vérifier que cet appareil est autorisé
      const license = validation.license;
      const deviceAuthorized = license?.usedBy.includes(this.deviceId);
      console.log(
        "🔐 Appareil autorisé:",
        deviceAuthorized,
        "Device ID:",
        this.deviceId,
      );

      if (!deviceAuthorized) {
        console.log("❌ Appareil non autorisé, suppression locale");
        localStorage.removeItem(this.userLicenseKey);
        return false;
      }

      console.log("✅ License valide et appareil autorisé");
      return true;
    } catch (error) {
      console.error("❌ Erreur lors de la vérification:", error);
      return false;
    }
  }

  // Fonctions d'administration
  public async getAllLicenses(): Promise<FirebaseLicense[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, "licenses"), orderBy("createdAt", "desc")),
      );

      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as FirebaseLicense,
      );
    } catch (error) {
      console.error("Erreur lors de la récupération des licenses:", error);
      return [];
    }
  }

  public async deleteLicense(licenseId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, "licenses", licenseId));
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      return false;
    }
  }

  public async updateLicense(
    licenseId: string,
    updates: Partial<FirebaseLicense>,
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, "licenses", licenseId), updates);
      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      return false;
    }
  }

  public clearUserLicense(): void {
    localStorage.removeItem(this.userLicenseKey);
  }

  // Statistiques
  public async getLicenseStats() {
    try {
      const licensesSnapshot = await getDocs(collection(db, "licenses"));
      const usagesSnapshot = await getDocs(collection(db, "license_usages"));

      const licenses = licensesSnapshot.docs.map(
        (doc) => doc.data() as FirebaseLicense,
      );
      const now = new Date();

      return {
        totalLicenses: licenses.length,
        activeLicenses: licenses.filter((l) => l.isActive).length,
        expiredLicenses: licenses.filter((l) => l.expiresAt.toDate() < now)
          .length,
        usedLicenses: licenses.filter((l) => l.usages > 0).length,
        totalUsages: usagesSnapshot.size,
        deviceCount: new Set(licenses.flatMap((l) => l.usedBy)).size,
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des stats:", error);
      return {
        totalLicenses: 0,
        activeLicenses: 0,
        expiredLicenses: 0,
        usedLicenses: 0,
        totalUsages: 0,
        deviceCount: 0,
      };
    }
  }

  // Test de connectivité Firebase
  public async testConnection(): Promise<boolean> {
    try {
      console.log("🌐 Test de connexion Firebase...");

      if (!db) {
        console.error("❌ Firestore non initialisé");
        return false;
      }

      // Test simple de lecture
      const testQuery = query(collection(db, "licenses"), limit(1));
      const result = await getDocs(testQuery);
      console.log("✅ Connexion Firebase réussie, documents:", result.size);
      return true;
    } catch (error) {
      console.error("❌ Test de connexion Firebase échoué:", error);
      return false;
    }
  }
}

export const firebaseLicenseManager = new FirebaseLicenseManager();
