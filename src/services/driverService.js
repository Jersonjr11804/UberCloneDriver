// AI-assisted: see docs/AI_LOG.md #2
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
// Se asume que src/config/firebase.js exporta `db` (Firestore) y, si usas login, `auth`.
import { db, auth } from '../config/firebase';
import { uploadImage } from './imageService';
import { ACCOUNT_STATUS, COMMISSION_RATE } from '../constants/options';

// Crea el documento drivers/{id} con el registro completo.
// La cuenta siempre nace en estado "pending" (Pendiente de aprobación).
export async function registerDriver(data, techReviewRequired) {
  const uid = auth?.currentUser?.uid;
  const driverRef = uid ? doc(db, 'drivers', uid) : doc(collection(db, 'drivers'));
  const folder = `drivers/${driverRef.id}`;

  // 1) Subir las fotos y obtener sus URLs
  const [profile, vehicle, license, soat, tech] = await Promise.all([
    uploadImage(data.profilePhoto, `${folder}/profile`),
    uploadImage(data.vehiclePhoto, `${folder}/vehicle`),
    uploadImage(data.licensePhoto, `${folder}/license`),
    uploadImage(data.soatPhoto, `${folder}/soat`),
    techReviewRequired ? uploadImage(data.techPhoto, `${folder}/tech`) : Promise.resolve(null),
  ]);

  // 2) Guardar los datos (con las URLs) en Firestore
  await setDoc(driverRef, {
    accountStatus: ACCOUNT_STATUS.PENDING,
    isAvailable: false,
    commissionRateAccepted: COMMISSION_RATE,
    personal: {
      photoUrl: profile,
      fullName: data.fullName.trim(),
      documentId: data.documentId,
      phone: data.phone,
      birthDate: data.birthDate,
      gender: data.gender,
      email: data.email.trim(),
      language: data.language,
    },
    vehicle: {
      category: data.category,
      plate: data.plate.trim().toUpperCase(),
      brand: data.brand.trim(),
      model: data.model.trim(),
      year: Number(data.year),
      color: data.color,
      capacity: Number(data.capacity),
      photoUrl: vehicle,
    },
    documents: {
      license: {
        number: data.licenseNumber.trim(),
        photoUrl: license,
        expiresAt: data.licenseExpiry,
      },
      soat: { photoUrl: soat, expiresAt: data.soatExpiry },
      techReview: techReviewRequired
        ? { photoUrl: tech, expiresAt: data.techExpiry }
        : null,
    },
    payment: { mercadoPagoEmail: data.mercadoPagoEmail.trim() },
    createdAt: serverTimestamp(),
  });

  return driverRef.id;
}

export async function getAccountStatus(driverId) {
  const snapshot = await getDoc(doc(db, 'drivers', driverId));
  return snapshot.exists() ? snapshot.data().accountStatus : null;
}

// Regla de negocio: solo un conductor aprobado puede ponerse Disponible.
// Úsala en la pantalla de Inicio para habilitar/deshabilitar el interruptor.
export const canGoAvailable = (accountStatus) => accountStatus === ACCOUNT_STATUS.APPROVED;

// Escucha en tiempo real el documento del conductor (estado de la cuenta, etc.).
// Devuelve la función para cancelar la suscripción (úsala en la limpieza de useEffect).
export function subscribeToDriver(driverId, onData, onError) {
  return onSnapshot(
    doc(db, 'drivers', driverId),
    (snapshot) => onData(snapshot.exists() ? snapshot.data() : null),
    onError
  );
}

export async function setDriverAvailability(driverId, isAvailable) {
  await updateDoc(doc(db, 'drivers', driverId), { isAvailable });
}

export async function updateDriverLocation(driverId, { latitude, longitude }) {
  await updateDoc(doc(db, 'drivers', driverId), {
    location: { lat: latitude, lng: longitude },
    locationUpdatedAt: serverTimestamp(),
  });
}
