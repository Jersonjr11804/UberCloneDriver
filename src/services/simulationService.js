// AI-assisted: see docs/AI_LOG.md #9
import * as Location from 'expo-location';
import { SIMULATION } from '../config/simulation';
import { DEFAULT_REGION } from '../constants/options';
import { getDistanceMatrix } from './mapsService';
import { createTestTrip } from './tripService';

const between = ([min, max]) => min + Math.random() * (max - min);
const withSign = (value) => value * (Math.random() < 0.5 ? -1 : 1);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Categoría con más peso para Económico
const randomCategory = () => {
  const r = Math.random();
  if (r < 0.6) return 'economy';
  if (r < 0.85) return 'xl';
  return 'premium';
};

async function getDriverPosition() {
  try {
    const last = await Location.getLastKnownPositionAsync();
    const position = last || (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch (error) {
    console.log('Sin ubicación, se usa la de respaldo:', error?.message || error);
    return { lat: DEFAULT_REGION.latitude, lng: DEFAULT_REGION.longitude };
  }
}

async function describePoint(point) {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude: point.lat, longitude: point.lng });
    const text = [place?.street, place?.name, place?.district || place?.city].filter(Boolean).join(', ');
    if (text) return text;
  } catch (error) {
    // se usa el texto de respaldo
  }
  return `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
}

// Crea una solicitud asignada a este conductor, como si la hubiera enviado un pasajero cercano.
// La recogida queda cerca del conductor y el destino a unos kilómetros.
export async function createSimulatedRequest(driverId, { category, paymentMethod } = {}) {
  const driver = await getDriverPosition();
  const origin = {
    lat: driver.lat + withSign(between(SIMULATION.pickupOffsetDeg)),
    lng: driver.lng + withSign(between(SIMULATION.pickupOffsetDeg)),
  };
  const destination = {
    lat: origin.lat + withSign(between(SIMULATION.tripOffsetDeg)),
    lng: origin.lng + withSign(between(SIMULATION.tripOffsetDeg)),
  };

  // Una sola consulta de ruta al crear la solicitud (queda en caché para el viaje)
  const { distanceKm, durationMin } = await getDistanceMatrix(origin, destination);
  const [originAddress, destinationAddress] = await Promise.all([
    describePoint(origin),
    describePoint(destination),
  ]);

  return createTestTrip(driverId, {
    origin: { ...origin, address: originAddress },
    destination: { ...destination, address: destinationAddress },
    distanceKm,
    durationMin,
    category: category || randomCategory(),
    paymentMethod: paymentMethod || pick(SIMULATION.autoPaymentMethods),
  });
}
