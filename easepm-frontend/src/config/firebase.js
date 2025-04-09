// Import Firebase functions
import { getAnalytics } from "firebase/analytics";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ✅ Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBjj4mOw5J86HHIMGPBu5qEvK973l_d5QA",
  authDomain: "easepm-e66c6.firebaseapp.com",
  projectId: "easepm-e66c6",
  storageBucket: "easepm-e66c6.firebasestorage.app",
  messagingSenderId: "912493226812",
  appId: "1:912493226812:web:1ef8fec12df683d8f08c39",
  measurementId: "G-VVX3NZZGV8"
};

// ✅ Ensure Firebase is initialized only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const analytics = getAnalytics(app);

// ✅ Get Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

