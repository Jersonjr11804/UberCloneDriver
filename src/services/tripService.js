// AI-assisted: see docs/AI_LOG.md #7
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { PRICING } from '../config/pricing';
import { calculateFare } from '../utils/calculateFare';
import { OPEN_TRIP_STATUSES, PAYMENT_STATUS, TRIP_STATUS } from '../constants/trip';

const tripsCollection = () => collection(db, 'trips');
const tripDoc = (tripId) => doc(db, 'trips', tripId);
const withId = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

// ---------- Tiempo real ----------

// Viajes "abiertos" del conductor (solicitados, en curso o terminados sin cobrar)
export function subscribeToOpenTrips(driverId, onData, onError) {
  const q = query(
    tripsCollection(),
    where('driverId', '==', driverId),
    where('status', 'in', OPEN_TRIP_STATUSES)
  );
  return onSnapshot(q, (snapshot) => onData(snapshot.docs.map(withId)), onError);
}

// Un viaje concreto, para ver cada cambio de estado (incluido paid / cancelled)
export function subscribeToTrip(tripId, onData, onError) {
  return onSnapshot(
    tripDoc(tripId),
    (snapshot) => onData(snapshot.exists() ? withId(snapshot) : null),
    onError
  );
}

export async function fetchTrip(tripId) {
  const snapshot = await getDoc(tripDoc(tripId));
  return snapshot.exists() ? withId(snapshot) : null;
}

// ---------- Cambios de estado ----------

// accepted: el conductor aceptó
export const acceptTrip = (tripId) =>
  updateDoc(tripDoc(tripId), { status: TRIP_STATUS.ACCEPTED, acceptedAt: Timestamp.now() });

// rejected: el conductor rechazó o se venció el tiempo
// (aquí se podría pasar la solicitud al siguiente conductor)
export const rejectTrip = (tripId) =>
  updateDoc(tripDoc(tripId), { status: TRIP_STATUS.REJECTED, rejectedAt: Timestamp.now() });

// driver_arriving: el conductor va hacia el punto de recogida
export const startDriverArriving = (tripId) =>
  updateDoc(tripDoc(tripId), { status: TRIP_STATUS.DRIVER_ARRIVING, arrivingAt: Timestamp.now() });

// in_progress: el pasajero está a bordo. Se guarda la ruta para dibujarla en el historial.
export const boardPassenger = (tripId, routePolyline) =>
  updateDoc(tripDoc(tripId), {
    status: TRIP_STATUS.IN_PROGRESS,
    startedAt: Timestamp.now(),
    routePolyline: routePolyline || null,
  });

// cancelled: solo se puede antes de in_progress
export const cancelTrip = (tripId) =>
  updateDoc(tripDoc(tripId), {
    status: TRIP_STATUS.CANCELLED,
    cancelledBy: 'driver',
    cancelledAt: Timestamp.now(),
  });

// completed: se calculan tarifa, comisión y ganancia con la MISMA función de la estimación
// y se guarda la tasa de comisión aplicada (commissionRate) para no alterar el historial.
export async function finishTrip(trip) {
  const rate = PRICING.commissionRate;
  const result = calculateFare({
    distanceKm: trip.distanceKm,
    durationMin: trip.durationMin,
    category: trip.category,
    tip: trip.tip || 0,
    commissionRate: rate,
  });
  await updateDoc(tripDoc(trip.id), {
    status: TRIP_STATUS.COMPLETED,
    completedAt: Timestamp.now(),
    fare: result.fare,
    commission: result.commission,
    driverEarnings: result.driverEarnings,
    tip: trip.tip || 0,
    commissionRate: rate,
    paymentStatus: PAYMENT_STATUS.PENDING,
  });
  return result;
}

// paid (efectivo): el conductor marca el cobro como recibido.
// La comisión se descuenta del saldo del conductor (ver useEarnings).
export const markCashReceived = (tripId) =>
  updateDoc(tripDoc(tripId), {
    status: TRIP_STATUS.PAID,
    paymentStatus: PAYMENT_STATUS.APPROVED,
    paymentId: 'cash',
    paidAt: Timestamp.now(),
  });

// ---------- Historial y ganancias ----------

// Trae viajes terminados (los que tienen completedAt), del más reciente al más antiguo.
// Necesita UN índice compuesto en Firestore: driverId (asc) + completedAt (desc).
// La primera vez, Firestore muestra en la consola un enlace para crearlo con un clic.
export async function fetchCompletedTrips(
  driverId,
  { from = null, to = null, after = null, pageSize = 20 } = {}
) {
  const constraints = [where('driverId', '==', driverId)];
  if (from) constraints.push(where('completedAt', '>=', Timestamp.fromDate(from)));
  if (to) constraints.push(where('completedAt', '<=', Timestamp.fromDate(to)));
  constraints.push(orderBy('completedAt', 'desc'));
  if (after) constraints.push(startAfter(after));
  constraints.push(limit(pageSize));

  const snapshot = await getDocs(query(tripsCollection(), ...constraints));
  return {
    items: snapshot.docs.map(withId),
    lastDoc: snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : null,
    hasMore: snapshot.docs.length === pageSize,
  };
}

// ---------- Solo pruebas ----------

// Crea una solicitud de prueba (no hay app de pasajero todavía).
export async function createTestTrip(driverId, data) {
  const estimate = calculateFare({
    distanceKm: data.distanceKm,
    durationMin: data.durationMin,
    category: data.category,
  });
  const ref = await addDoc(tripsCollection(), {
    driverId,
    passengerId: 'test-passenger',
    passengerName: 'Pasajero de prueba',
    origin: data.origin,
    destination: data.destination,
    distanceKm: data.distanceKm,
    durationMin: data.durationMin,
    category: data.category,
    paymentMethod: data.paymentMethod,
    estimatedFare: estimate.fare,
    tip: 0,
    status: TRIP_STATUS.REQUESTED,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}
