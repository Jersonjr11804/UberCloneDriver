// AI-assisted: see docs/AI_LOG.md #7
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCompletedTrips } from '../services/tripService';
import { PAYMENT_METHOD, TRIP_STATUS } from '../constants/trip';
import { startOfDay, startOfMonth, startOfWeek, toDate } from '../utils/format';

const MAX_TRIPS = 500;

const emptyStats = () => ({
  trips: 0,
  billed: 0,
  commissions: 0,
  tips: 0,
  net: 0,
  average: 0,
});

const addTrip = (stats, trip) => {
  stats.trips += 1;
  stats.billed += trip.fare || 0;
  stats.commissions += trip.commission || 0;
  stats.tips += trip.tip || 0;
  stats.net += trip.driverEarnings || 0;
};

// Carga el historial del conductor y calcula, con useMemo, los totales de hoy, la semana y el mes,
// además del saldo: ganancias de viajes pagados por la pasarela
// menos las comisiones de los viajes en efectivo.
export default function useEarnings(driverId) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!driverId) return;
    setLoading(true);
    setError('');
    try {
      const { items } = await fetchCompletedTrips(driverId, { pageSize: MAX_TRIPS });
      setTrips(items);
    } catch (err) {
      console.log('Error al cargar las ganancias:', err);
      setError(
        err?.code === 'failed-precondition'
          ? 'Falta crear un índice en Firestore. Abre el enlace que aparece en la consola de Expo.'
          : 'No se pudieron cargar las ganancias.'
      );
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const { stats, balance } = useMemo(() => {
    const today = startOfDay().getTime();
    const week = startOfWeek().getTime();
    const month = startOfMonth().getTime();
    const result = { today: emptyStats(), week: emptyStats(), month: emptyStats() };
    let total = 0;

    trips.forEach((trip) => {
      const completedAt = toDate(trip.completedAt)?.getTime();
      if (!completedAt) return;
      // Cuentan los viajes terminados (completed) y pagados (paid)
      if (trip.status !== TRIP_STATUS.COMPLETED && trip.status !== TRIP_STATUS.PAID) return;

      if (completedAt >= today) addTrip(result.today, trip);
      if (completedAt >= week) addTrip(result.week, trip);
      if (completedAt >= month) addTrip(result.month, trip);

      // Saldo: solo viajes ya cobrados
      if (trip.status === TRIP_STATUS.PAID) {
        total +=
          trip.paymentMethod === PAYMENT_METHOD.CASH
            ? -(trip.commission || 0)
            : trip.driverEarnings || 0;
      }
    });

    Object.values(result).forEach((s) => {
      s.average = s.trips ? Math.round(s.net / s.trips) : 0;
    });
    return { stats: result, balance: total };
  }, [trips]);

  return { stats, balance, loading, error, refresh };
}
