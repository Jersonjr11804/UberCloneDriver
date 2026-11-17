// AI-assisted: see docs/AI_LOG.md #7
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Datos que el conductor puede editar desde Perfil y configuración.
// (El estado de la cuenta y la comisión NO se pueden cambiar desde la app.)
export async function updateDriverProfile(driverId, { fullName, phone, language, color }) {
  await updateDoc(doc(db, 'drivers', driverId), {
    'personal.fullName': fullName.trim(),
    'personal.phone': phone,
    'personal.language': language,
    'vehicle.color': color,
  });
}
