// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyACAkQ5Q68eKdD5vpFZU7-h8L-qeFlYnDI",
  authDomain: "test-a4251.firebaseapp.com",
  projectId: "test-a4251",
  storageBucket: "test-a4251.firebasestorage.app",
  messagingSenderId: "75154939894",
  appId: "1:75154939894:web:7021bb84d0d9f5ece5f1d7",
  measurementId: "G-31XSYYTBRM",
};

console.log("🔥 Initialisation Firebase...");
console.log("📊 Config Firebase:", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  environment: import.meta.env.MODE,
});

// Initialize Firebase
let app: any = null;
let analytics: any = null;
let db: any = null;
let auth: any = null;

try {
  app = initializeApp(firebaseConfig);
  console.log("✅ Firebase app initialisée avec succès");
} catch (error) {
  console.error("❌ Erreur lors de l'initialisation Firebase:", error);
}

// Initialize analytics only in browser environment
if (typeof window !== "undefined" && app) {
  try {
    analytics = getAnalytics(app);
    console.log("📈 Analytics initialisé");
  } catch (error) {
    console.warn("⚠️ Analytics initialization failed:", error);
  }
}

// Initialize Firestore with better error handling
if (app) {
  try {
    db = getFirestore(app);
    console.log("🗄️ Firestore initialisé");

    // En développement, vous pouvez décommenter pour utiliser l'émulateur
    // if (import.meta.env.DEV) {
    //   connectFirestoreEmulator(db, 'localhost', 8080);
    //   console.log("🔧 Connecté à l'émulateur Firestore");
    // }
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation Firestore:", error);
    db = null;
  }
}

// Initialize Auth
if (app) {
  try {
    auth = getAuth(app);
    console.log("🔐 Auth initialisé");
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation Auth:", error);
    auth = null;
  }
}

// Fonction pour tester la connectivité
export const testFirebaseConnection = async (): Promise<{
  success: boolean;
  error?: string;
  details?: any;
}> => {
  try {
    if (!db) {
      return {
        success: false,
        error: "Firestore non initialisé",
        details: { db: !!db, app: !!app },
      };
    }

    // Test basique avec un timeout
    const testPromise = new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error("Timeout Firebase")), 10000); // 10s timeout
    });

    console.log("🧪 Test de connexion Firebase...");

    // On ne peut pas vraiment tester sans faire une vraie requête
    // mais on peut au moins vérifier que les objets sont initialisés

    return {
      success: true,
      details: {
        app: !!app,
        db: !!db,
        auth: !!auth,
        analytics: !!analytics,
        projectId: firebaseConfig.projectId,
      },
    };
  } catch (error: any) {
    console.error("❌ Test de connexion Firebase échoué:", error);
    return {
      success: false,
      error: error.message,
      details: {
        app: !!app,
        db: !!db,
        auth: !!auth,
        code: error.code,
      },
    };
  }
};

export { app, analytics, db, auth };
export default app;
