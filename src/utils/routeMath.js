// AI-assisted: see docs/AI_LOG.md #9
import { haversineKm } from './format';

const toLatLng = (p) => ({ lat: p.latitude, lng: p.longitude });

// Prepara una ruta (lista de { latitude, longitude }) con sus distancias acumuladas en metros
export function buildPath(points) {
  if (!points || points.length < 2) return null;
  const cumulative = [0];
  for (let i = 1; i < points.length; i += 1) {
    cumulative.push(
      cumulative[i - 1] + haversineKm(toLatLng(points[i - 1]), toLatLng(points[i])) * 1000
    );
  }
  return { points, cumulative, total: cumulative[cumulative.length - 1] };
}

// Punto de la ruta después de recorrer `meters` metros
export function pointAt(path, meters) {
  const { points, cumulative, total } = path;
  if (meters <= 0) return { position: points[0], index: 0 };
  if (meters >= total) return { position: points[points.length - 1], index: points.length - 1 };

  let i = 0;
  while (i < cumulative.length - 2 && cumulative[i + 1] < meters) i += 1;

  const segment = cumulative[i + 1] - cumulative[i];
  const t = segment > 0 ? (meters - cumulative[i]) / segment : 0;
  const a = points[i];
  const b = points[i + 1];
  return {
    position: {
      latitude: a.latitude + (b.latitude - a.latitude) * t,
      longitude: a.longitude + (b.longitude - a.longitude) * t,
    },
    index: i,
  };
}
