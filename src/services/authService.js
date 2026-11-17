// AI-assisted: see docs/AI_LOG.md #6
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const signUp = (email, password) =>
  createUserWithEmailAndPassword(auth, email.trim(), password);

export const signIn = (email, password) =>
  signInWithEmailAndPassword(auth, email.trim(), password);

export const signOutUser = () => firebaseSignOut(auth);

// ¿Este usuario ya completó el registro de conductor? (drivers/{uid})
export async function driverProfileExists(uid) {
  const snapshot = await getDoc(doc(db, 'drivers', uid));
  return snapshot.exists();
}

// Traduce los códigos de error de Firebase a mensajes para el usuario
export function authErrorMessage(error) {
  switch (error?.code) {
    case 'auth/invalid-email':
      return 'El correo no es válido';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Correo o contraseña incorrectos';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con ese correo';
    case 'auth/weak-password':
      return 'La contraseña es muy débil';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento e inténtalo de nuevo';
    case 'auth/user-disabled':
      return 'Esta cuenta fue deshabilitada';
    case 'auth/network-request-failed':
      return 'Sin conexión. Revisa tu internet e inténtalo de nuevo';
    default:
      return 'Ocurrió un error. Inténtalo de nuevo';
  }
}
