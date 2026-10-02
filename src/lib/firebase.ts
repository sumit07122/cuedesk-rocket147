import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
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

export const getActiveFirebaseConfig = (): { config: FirebaseAppConfig; source: 'env' | 'custom' | 'bundled'; isCustom: boolean } => {
  // Use the deployment's configured Firebase project; browser storage cannot override the live database.
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (envApiKey && envProjectId) {
    return {
      config: {
        apiKey: envApiKey,
        projectId: envProjectId,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
        appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.appspot.com`,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)',
      },
      source: 'env',
      isCustom: false
    };
  }

  // Local development fallback for the project preview.
  return { config: bundledFirebaseConfig as FirebaseAppConfig, source: 'bundled', isCustom: false };
};

export const saveCustomFirebaseConfig = (config: FirebaseAppConfig) => {
  localStorage.setItem('cuedesk_custom_firebase_config', JSON.stringify(config));
};

export const clearCustomFirebaseConfig = () => {
  localStorage.removeItem('cuedesk_custom_firebase_config');
};

const { config: activeConfig, source: configSource } = getActiveFirebaseConfig();
export const currentConfigSource = configSource;

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

/**
 * Health check helper for Cloud Firestore
 */
export const testFirestoreHealth = async (clubId: string): Promise<{ connected: boolean; latencyMs?: number; message?: string }> => {
  const start = performance.now();
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout (4000ms)')), 4000)
    );
    await Promise.race([getDoc(doc(db, 'clubs', clubId, 'config', 'settings')), timeoutPromise]);
    const latency = Math.round(performance.now() - start);
    return { connected: true, latencyMs: latency, message: 'Connected & Operational' };
  } catch (err: any) {
    return { connected: false, message: err?.message || 'Connection offline or failed' };
  }
};
