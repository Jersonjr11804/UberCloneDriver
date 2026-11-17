// AI-assisted: see docs/AI_LOG.md #1
export const APP_NAME = 'UberClone';

export const GENDERS = [
  { label: 'Masculino', value: 'male' },
  { label: 'Femenino', value: 'female' },
  { label: 'Otro', value: 'other' },
  { label: 'Prefiero no decirlo', value: 'none' },
];

export const LANGUAGES = [
  { label: 'Español', value: 'es' },
  { label: 'English', value: 'en' },
];

// Mismas categorías que elige el pasajero
export const CATEGORIES = [
  { label: 'Económico', value: 'economy' },
  { label: 'XL', value: 'xl' },
  { label: 'Premium', value: 'premium' },
];

export const VEHICLE_COLORS = [
  { label: 'Blanco', value: 'white' },
  { label: 'Negro', value: 'black' },
  { label: 'Gris', value: 'gray' },
  { label: 'Plata', value: 'silver' },
  { label: 'Rojo', value: 'red' },
  { label: 'Azul', value: 'blue' },
  { label: 'Verde', value: 'green' },
  { label: 'Amarillo', value: 'yellow' },
  { label: 'Otro', value: 'other' },
];

export const MIN_DRIVER_AGE = 18;
export const MIN_XL_CAPACITY = 6;
export const MAX_CAPACITY = 10; // supuesto razonable, no está en el documento
export const MIN_VEHICLE_YEAR = 1990; // supuesto razonable, no está en el documento

// ---- Pestaña 3 y envío del registro ----
export const COMMISSION_RATE = 0.2; // mover/leer desde src/config/pricing.js cuando exista
export const TECH_REVIEW_MIN_AGE = 5; // supuesto: revisión técnico-mecánica exigida desde los 5 años del vehículo (verificar)

export const ACCOUNT_STATUS = {
  PENDING: 'pending', // Pendiente de aprobación
  APPROVED: 'approved', // Aprobado
  REJECTED: 'rejected', // Rechazado
};

// Región inicial del mapa mientras se obtiene la ubicación real (Medellín)
export const DEFAULT_REGION = {
  latitude: 6.2442,
  longitude: -75.5812,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};
export const LOCATION_INTERVAL_MS = 5000; // cada cuánto se envía la ubicación a la BD
