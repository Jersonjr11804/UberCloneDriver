// AI-assisted: see docs/AI_LOG.md #9
import { haversineKm } from '../utils/format';

// Rutas por las calles. Orden de intentos:
//   1. Google Routes API (si hay clave en el .env). Reemplaza a las APIs "Legacy"
//      Directions y Distance Matrix, que Google ya no deja activar en proyectos nuevos.
//   2. OSRM (gratis, sin clave, sigue las calles). Servidor de demostración: úsalo solo para pruebas.
//   3. Línea recta (solo si no hay internet).
const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const AVERAGE_SPEED_KMH = 30;
const STRAIGHT_LINE_FACTOR = 1.3;

const routeCache = new Map(); // el mismo tramo no se vuelve a pedir (ahorra cupo)

const cacheKey = (a, b) =>
  `${a.lat.toFixed(4)},${a.lng.toFixed(4)}>${b.lat.toFixed(4)},${b.lng.toFixed(4)}`;

// Decodifica una polilínea codificada (Google u OSRM, precisión 5) a una lista de coordenadas
export function decodePolyline(encoded) {
  if (!encoded) return [];
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

async function fetchJson(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

const buildResult = (encoded, meters, seconds, source) => ({
  points: decodePolyline(encoded),
  encoded,
  distanceKm: Math.round((meters / 1000) * 10) / 10,
  durationMin: Math.max(1, Math.round(seconds / 60)),
  source,
});

async function googleRoute(origin, destination) {
  try {
    const json = await fetchJson('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_KEY,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_UNAWARE', // la opción más barata
        polylineQuality: 'OVERVIEW',
        polylineEncoding: 'ENCODED_POLYLINE',
        languageCode: 'es-CO',
        units: 'METRIC',
      }),
    });
    const route = json.routes?.[0];
    if (!route?.polyline?.encodedPolyline) {
      console.log('Routes API:', json.error?.status || 'sin ruta', json.error?.message || '');
      return null;
    }
    const seconds = parseInt(String(route.duration || '0').replace('s', ''), 10) || 0;
    return buildResult(route.polyline.encodedPolyline, route.distanceMeters || 0, seconds, 'google');
  } catch (error) {
    console.log('Error en Routes API:', error?.message || error);
    return null;
  }
}

async function osrmRoute(origin, destination) {
  try {
    const url =
      'https://router.project-osrm.org/route/v1/driving/' +
      `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
      '?overview=full&geometries=polyline';
    const json = await fetchJson(url);
    const route = json.routes?.[0];
    if (json.code !== 'Ok' || !route?.geometry) {
      console.log('OSRM:', json.code, json.message || '');
      return null;
    }
    return buildResult(route.geometry, route.distance, route.duration, 'osrm');
  } catch (error) {
    console.log('Error en OSRM:', error?.message || error);
    return null;
  }
}

const straightLine = (origin, destination) => {
  const distanceKm = haversineKm(origin, destination) * STRAIGHT_LINE_FACTOR;
  return {
    points: [
      { latitude: origin.lat, longitude: origin.lng },
      { latitude: destination.lat, longitude: destination.lng },
    ],
    encoded: null,
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationMin: Math.max(1, Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60)),
    source: 'estimate',
  };
};

// Ruta por las calles entre dos puntos { lat, lng }
export async function getRoute(origin, destination) {
  const key = cacheKey(origin, destination);
  if (routeCache.has(key)) return routeCache.get(key);

  let result = null;
  if (GOOGLE_KEY) result = await googleRoute(origin, destination);
  if (!result) result = await osrmRoute(origin, destination);
  if (!result) return straightLine(origin, destination); // sin internet: no se guarda en caché

  routeCache.set(key, result);
  return result;
}

// Distancia y duración para estimar la tarifa. Usa la misma consulta de ruta (y su caché),
// así el tramo recogida -> destino no se vuelve a pedir cuando empieza el viaje.
export async function getDistanceMatrix(origin, destination) {
  const { distanceKm, durationMin } = await getRoute(origin, destination);
  return { distanceKm, durationMin };
}
