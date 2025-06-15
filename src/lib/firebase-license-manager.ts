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
      const userLicense = this.getUserLicense();

      if (!userLicense) {
        console.log("❌ Aucune license locale trouvée");
        return false;
      }

      console.log("📋 License locale trouvée:", userLicense);

      // Vérification rapide avec timeout pour éviter les blocages
      try {
        const validation = await Promise.race([
          this.validateLicense(userLicense),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 5000)
          ),
        ]);

        if (validation && validation.valid) {
          console.log("✅ License validée avec Firebase");
          return true;
        } else {
          console.log("❌ License invalide selon Firebase");
          localStorage.removeItem(this.userLicenseKey);
          return false;
        }
      } catch (error) {
        // Si Firebase ne répond pas, on fait une validation locale basique
        console.warn("⚠️ Firebase inaccessible, validation locale:", error);

        // Validation locale simple : vérifier le format de la clé
        if (userLicense.startsWith("NothingAi-") && userLicense.length > 10) {
          console.log("✅ License locale valide (mode offline)");
          return true;
        } else {
          console.log("❌ Format de license local invalide");
          localStorage.removeItem(this.userLicenseKey);
          return false;
        }
      }
    } catch (error) {
      console.error("❌ Erreur critique vérification license:", error);
      return false;
    }
  }
  }

  // Fonctions d'administration
  public async getAllLicenses(): Promise<FirebaseLicense[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, "licenses"), orderBy("createdAt", "desc")),
      );

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          key: data.key || "",
          usages: data.usages || 0,
          maxUsages: data.maxUsages || 1,
          createdAt: data.createdAt || null,
          expiresAt: data.expiresAt || null,
          isActive: data.isActive !== false, // Default to true if undefined
          usedBy: Array.isArray(data.usedBy) ? data.usedBy : [],
          type: data.type || "standard",
          metadata: data.metadata || {},
        } as FirebaseLicense;
      });
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

      const licenses = licensesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as FirebaseLicense;
      });
      const now = new Date();

      // Filtrer en sécurité avec vérifications
      const activeLicenses = licenses.filter((l) => l && l.isActive === true);

      const expiredLicenses = licenses.filter((l) => {
        if (!l || !l.expiresAt) return false;
        try {
          const expiresAt = l.expiresAt.toDate
            ? l.expiresAt.toDate()
            : new Date(l.expiresAt);
          return expiresAt < now;
        } catch (error) {
          console.warn("Erreur lors de la conversion de date:", error);
          return false;
        }
      });

      const usedLicenses = licenses.filter(
        (l) => l && typeof l.usages === "number" && l.usages > 0,
      );

      const deviceCount = new Set(
        licenses
          .filter((l) => l && Array.isArray(l.usedBy))
          .flatMap((l) => l.usedBy),
      ).size;

      return {
        totalLicenses: licenses.length,
        activeLicenses: activeLicenses.length,
        expiredLicenses: expiredLicenses.length,
        usedLicenses: usedLicenses.length,
        totalUsages: usagesSnapshot.size,
        deviceCount,
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

  // ✨ NOUVELLES FONCTIONNALITÉS AVANCÉES ✨

  // Créer une license avec options avancées
  public async createLicenseAdvanced(options: {
    type: "trial" | "standard" | "premium" | "enterprise";
    duration: number; // jours
    maxUsages: number;
    features?: string[];
  }): Promise<{
    success: boolean;
    license?: FirebaseLicense;
    message: string;
  }> {
    try {
      const randomCode = Math.random().toString(36).substr(2, 8).toUpperCase();
      const licenseKey = `NothingAi-${randomCode}`;

      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + options.duration * 24 * 60 * 60 * 1000,
      );

      const newLicense: Omit<FirebaseLicense, "id"> = {
        key: licenseKey,
        usages: 0,
        maxUsages: options.maxUsages,
        createdAt: Timestamp.fromDate(now),
        expiresAt: Timestamp.fromDate(expiresAt),
        isActive: true,
        usedBy: [],
        type: options.type,
        metadata: {
          duration: options.duration,
          features: options.features || ["chat", "images"],
        },
      };

      const docRef = await addDoc(collection(db, "licenses"), newLicense);
      const fullLicense = { id: docRef.id, ...newLicense } as FirebaseLicense;

      console.log("🆕 License avancée créée:", {
        key: licenseKey,
        type: options.type,
        duration: options.duration,
        maxUsages: options.maxUsages,
      });

      return {
        success: true,
        license: fullLicense,
        message: `License ${options.type} créée (${options.duration} jours, ${options.maxUsages} usages)`,
      };
    } catch (error) {
      console.error("❌ Erreur création license avancée:", error);
      return {
        success: false,
        message: "Erreur lors de la création de la license",
      };
    }
  }

  // Modifier une license existante
  public async modifyLicense(
    licenseId: string,
    modifications: {
      duration?: number; // nouveaux jours à partir de maintenant
      maxUsages?: number;
      type?: "trial" | "standard" | "premium" | "enterprise";
      resetUsages?: boolean;
      extend?: boolean; // étendre au lieu de redéfinir
    },
  ): Promise<{ success: boolean; message: string }> {
    try {
      const licenseDoc = await getDoc(doc(db, "licenses", licenseId));

      if (!licenseDoc.exists()) {
        return { success: false, message: "License non trouvée" };
      }

      const currentLicense = {
        id: licenseDoc.id,
        ...licenseDoc.data(),
      } as FirebaseLicense;
      const updates: any = {};

      // Modifier la durée
      if (modifications.duration) {
        const now = new Date();
        let newExpiresAt: Date;

        if (modifications.extend) {
          // Étendre à partir de la date d'expiration actuelle
          const currentExpires = currentLicense.expiresAt.toDate();
          newExpiresAt = new Date(
            currentExpires.getTime() +
              modifications.duration * 24 * 60 * 60 * 1000,
          );
        } else {
          // Redéfinir à partir de maintenant
          newExpiresAt = new Date(
            now.getTime() + modifications.duration * 24 * 60 * 60 * 1000,
          );
        }

        updates.expiresAt = Timestamp.fromDate(newExpiresAt);

        // Mettre à jour les métadonnées
        if (currentLicense.metadata) {
          updates.metadata = {
            ...currentLicense.metadata,
            duration: modifications.extend
              ? (currentLicense.metadata.duration || 0) + modifications.duration
              : modifications.duration,
          };
        }
      }

      // Modifier les usages max
      if (modifications.maxUsages !== undefined) {
        updates.maxUsages = modifications.maxUsages;
        // Réactiver si nécessaire
        if (modifications.maxUsages > currentLicense.usages) {
          updates.isActive = true;
        }
      }

      // Modifier le type
      if (modifications.type) {
        updates.type = modifications.type;
      }

      // Réinitialiser les usages
      if (modifications.resetUsages) {
        updates.usages = 0;
        updates.usedBy = [];
        updates.isActive = true;
      }

      await updateDoc(doc(db, "licenses", licenseId), updates);

      console.log("🔧 License modifiée:", {
        id: licenseId,
        modifications,
      });

      return {
        success: true,
        message: "License modifiée avec succès",
      };
    } catch (error) {
      console.error("❌ Erreur modification license:", error);
      return {
        success: false,
        message: "Erreur lors de la modification de la license",
      };
    }
  }

  // Supprimer une license
  public async deleteLicense(
    licenseId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await deleteDoc(doc(db, "licenses", licenseId));

      console.log("🗑️ License supprimée:", licenseId);

      return {
        success: true,
        message: "License supprimée avec succès",
      };
    } catch (error) {
      console.error("❌ Erreur suppression license:", error);
      return {
        success: false,
        message: "Erreur lors de la suppression de la license",
      };
    }
  }

  // Obtenir les détails d'une license par ID
  public async getLicenseById(
    licenseId: string,
  ): Promise<FirebaseLicense | null> {
    try {
      const licenseDoc = await getDoc(doc(db, "licenses", licenseId));

      if (!licenseDoc.exists()) {
        return null;
      }

      return { id: licenseDoc.id, ...licenseDoc.data() } as FirebaseLicense;
    } catch (error) {
      console.error("❌ Erreur récupération license:", error);
      return null;
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

      // Test simple de lecture avec timeout
      const testPromise = getDocs(query(collection(db, "licenses"), limit(1)));
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Timeout de connexion Firebase")),
          8000,
        ),
      );

      const result = (await Promise.race([testPromise, timeoutPromise])) as any;
      console.log("✅ Connexion Firebase réussie, documents:", result.size);
      return true;
    } catch (error: any) {
      console.error("❌ Test de connexion Firebase échoué:", error);

      // Log des détails de l'erreur pour le debug
      if (error.code) {
        console.error("Code d'erreur Firebase:", error.code);
      }
      if (error.message?.includes("Failed to fetch")) {
        console.error("🌐 Problème de connectivité réseau vers Firebase");
      }

      return false;
    }
  }
}

export const firebaseLicenseManager = new FirebaseLicenseManager();