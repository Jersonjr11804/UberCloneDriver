// AI-assisted: see docs/AI_LOG.md #5
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage, * as AsyncStorageModule from '@react-native-async-storage/async-storage';

// Los valores salen del archivo .env (variables EXPO_PUBLIC_*), nunca van escritos aquí.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Aviso temprano si falta alguna variable (ayuda a detectar un .env mal llenado)
const missing = Object.keys(firebaseConfig).filter((key) => !firebaseConfig[key]);
if (missing.length > 0) {
  console.warn('Firebase: faltan variables en el .env ->', missing.join(', '));
}

// getApps() evita inicializar Firebase dos veces (por ejemplo con Fast Refresh)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);

// Firebase Auth con la sesión guardada en AsyncStorage (el usuario sigue logueado al reabrir la app).
// AsyncStorage v3 se crea con createAsyncStorage(); la v2 se usa directamente.
function getPersistence() {
  const storage =
    typeof AsyncStorageModule.createAsyncStorage === 'function'
      ? AsyncStorageModule.createAsyncStorage('app')
      : AsyncStorage;
  return getReactNativePersistence(storage);
}

function createAuth() {
  try {
    return initializeAuth(app, { persistence: getPersistence() });
  } catch (error) {
    // Solo se ignora el caso "ya estaba inicializado" (Fast Refresh); cualquier otro error se muestra
    if (error?.code === 'auth/already-initialized') return getAuth(app);
    throw error;
  }
}

export const auth = createAuth();
