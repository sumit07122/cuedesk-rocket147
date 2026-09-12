import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import bundledFirebaseConfig from '../../firebase-applet-config.json';

export interface FirebaseAppConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
}

export const getActiveFirebaseConfig = (): { config: FirebaseAppConfig; isCustom: boolean } => {
  try {
    const saved = localStorage.getItem('cuedesk_custom_firebase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.projectId && parsed.apiKey) {
        return { config: parsed, isCustom: true };
      }
    }
  } catch (e) {
    console.warn('Error reading custom firebase config from localStorage:', e);
  }
  return { config: bundledFirebaseConfig as FirebaseAppConfig, isCustom: false };
};

export const saveCustomFirebaseConfig = (config: FirebaseAppConfig) => {
  localStorage.setItem('cuedesk_custom_firebase_config', JSON.stringify(config));
};

export const clearCustomFirebaseConfig = () => {
  localStorage.removeItem('cuedesk_custom_firebase_config');
};

const { config: activeConfig } = getActiveFirebaseConfig();

// Initialize Firebase App
const app = !getApps().length ? initializeApp(activeConfig) : getApp();

// Handle custom database ID if specified in config
const dbId = (activeConfig as any).firestoreDatabaseId;
export const db = dbId && dbId !== '(default)' && dbId !== ''
  ? getFirestore(app, dbId)
  : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
