// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDMsFeXMVm61NlmN8QBk7UmH1ngPFW8TWo",
  authDomain: "keysystem-d0b86.firebaseapp.com",
  projectId: "keysystem-d0b86",
  storageBucket: "keysystem-d0b86.firebasestorage.app",
  messagingSenderId: "1012783086146",
  appId: "1:1012783086146:web:8e3e31012b4436df2a4bdb",
  measurementId: "G-4DF4R93YYT",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
let analytics: any = null;
let db: any = null;
let auth: any = null;

// Initialize analytics only in browser environment
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Analytics initialization failed:", error);
  }
}

// Initialize Firestore
try {
  db = getFirestore(app);
} catch (error) {
  console.error("Firestore initialization failed:", error);
}

// Initialize Auth
try {
  auth = getAuth(app);
} catch (error) {
  console.error("Auth initialization failed:", error);
}

export { app, analytics, db, auth };
export default app;
