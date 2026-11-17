// AI-assisted: see docs/AI_LOG.md #7

// Pesos colombianos: 19200 -> "$19.200" (sin Intl, que no está en todos los dispositivos)
export const formatCOP = (value) => {
  const number = Math.round(Number(value) || 0);
  const sign = number < 0 ? '-' : '';
  return `${sign}$${String(Math.abs(number)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
};

// Firestore Timestamp | Date | número -> Date (o null)
export const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const pad = (n) => String(n).padStart(2, '0');

export const formatDate = (value) => {
  const d = toDate(value);
  return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : '—';
};

export const formatDateTime = (value) => {
  const d = toDate(value);
  return d ? `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}` : '—';
};

export const formatKm = (km) => `${(Number(km) || 0).toFixed(1).replace('.', ',')} km`;
export const formatMinutes = (min) => `${Math.round(Number(min) || 0)} min`;

export const startOfDay = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

export const endOfDay = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

// La semana empieza el lunes
export const startOfWeek = (date = new Date()) => {
  const start = startOfDay(date);
  const day = start.getDay(); // 0 = domingo
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return start;
};

export const startOfMonth = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);

// Distancia en línea recta entre dos puntos { lat, lng } (km)
export const haversineKm = (a, b) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};
