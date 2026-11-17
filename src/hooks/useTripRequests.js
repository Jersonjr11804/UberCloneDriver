// AI-assisted: see docs/AI_LOG.md #7
import { useEffect, useMemo, useState } from 'react';
import { subscribeToOpenTrips } from '../services/tripService';
import { subscribeToDriver } from '../services/driverService';
import { PRICING } from '../config/pricing';
import { TRIP_STATUS } from '../constants/trip';
import { toDate } from '../utils/format';

// Los viajes ya iniciados van primero; las solicitudes nuevas al final
const PRIORITY = {
  [TRIP_STATUS.IN_PROGRESS]: 0,
  [TRIP_STATUS.DRIVER_ARRIVING]: 1,
  [TRIP_STATUS.ACCEPTED]: 2,
  [TRIP_STATUS.COMPLETED]: 3,
  [TRIP_STATUS.REQUESTED]: 4,
};

// Suscripción en tiempo real a los viajes del conductor.
// Una solicitud nueva (requested) solo se muestra si el conductor está Disponible
// y si no es demasiado vieja. Se cancelan las suscripciones al desmontar (limpieza).
export default function useTripRequests(driverId) {
  const [trips, setTrips] = useState([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!driverId) {
      setTrips([]);
      return undefined;
    }
    const unsubscribeTrips = subscribeToOpenTrips(
      driverId,
      (data) => {
        setError('');
        setTrips(data);
      },
      (err) => {
        console.log('Error al escuchar los viajes:', err);
        setError('No se pudieron cargar los viajes');
      }
    );
    const unsubscribeDriver = subscribeToDriver(
      driverId,
      (data) => setIsAvailable(Boolean(data?.isAvailable)),
      (err) => console.log('Error al escuchar la disponibilidad:', err)
    );
    return () => {
      unsubscribeTrips();
      unsubscribeDriver();
    };
  }, [driverId]);

  const openTrips = useMemo(() => {
    const now = Date.now();
    return trips
      .filter((trip) => {
        if (trip.status !== TRIP_STATUS.REQUESTED) return true;
        const createdAt = toDate(trip.createdAt);
        const fresh = !createdAt || now - createdAt.getTime() <= PRICING.requestMaxAgeMs;
        return isAvailable && fresh;
      })
      .sort((a, b) => PRIORITY[a.status] - PRIORITY[b.status]);
  }, [trips, isAvailable]);

  return { openTrips, isAvailable, error };
}
