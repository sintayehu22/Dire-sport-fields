import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const configKeys = Object.keys(firebaseConfig);
const isConfigured = configKeys.every((key) => {
  const value = firebaseConfig[key];
  return typeof value === "string" && value.trim().length > 0;
});

const app = isConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

const ADMIN_APP_NAME = "dire-sport-fields-admin";
const adminApp = isConfigured
  ? getApps().some((candidate) => candidate.name === ADMIN_APP_NAME)
    ? getApp(ADMIN_APP_NAME)
    : initializeApp(firebaseConfig, ADMIN_APP_NAME)
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const functions = app
  ? getFunctions(
      app,
      process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION || "us-central1",
    )
  : null;

export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const adminDb = adminApp ? getFirestore(adminApp) : null;
export const adminFunctions = adminApp
  ? getFunctions(
      adminApp,
      process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION || "us-central1",
    )
  : null;

export function getFirebaseServices() {
  if (!db) {
    throw new Error(
      "Firestore database is not configured. Add your Firebase values to .env.local and restart the development server.",
    );
  }

  return { db };
}