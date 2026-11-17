// AI-assisted: see docs/AI_LOG.md #7, #9
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDriverSession } from './DriverSessionContext';
import useTripRequests from '../hooks/useTripRequests';
import useAutoRequests from '../hooks/useAutoRequests';
import { subscribeToTrip } from '../services/tripService';
import { SIMULATION } from '../config/simulation';

// Viaje activo del conductor (useContext).
// - useTripRequests avisa de solicitudes y viajes abiertos.
// - Al aparecer uno, se queda fijo (currentId) y se escucha ese documento en tiempo real,
//   así se ve cada cambio de estado hasta paid / cancelled.
// - dismissTrip() lo cierra de la pantalla del conductor (no lo borra de la base de datos).
// - useAutoRequests simula pasajeros mientras el conductor está Disponible.
const TripContext = createContext(null);

export function TripProvider({ children }) {
  const { driverId } = useDriverSession();
  const { openTrips, isAvailable } = useTripRequests(driverId);
  const [currentId, setCurrentId] = useState(null);
  const [dismissedIds, setDismissedIds] = useState([]);
  const [trip, setTrip] = useState(null);
  const [autoRequests, setAutoRequests] = useState(SIMULATION.autoRequests);

  // Elegir el siguiente viaje abierto que no se haya cerrado
  useEffect(() => {
    if (currentId) return;
    const next = openTrips.find((item) => !dismissedIds.includes(item.id));
    if (next) setCurrentId(next.id);
  }, [openTrips, currentId, dismissedIds]);

  // Escuchar el viaje actual
  useEffect(() => {
    if (!currentId) {
      setTrip(null);
      return undefined;
    }
    const unsubscribe = subscribeToTrip(
      currentId,
      (data) => {
        if (data) {
          setTrip(data);
        } else {
          setCurrentId(null);
        }
      },
      (error) => console.log('Error al escuchar el viaje:', error)
    );
    return unsubscribe; // limpieza
  }, [currentId]);

  // Solicitudes automáticas (solo mientras está Disponible y sin viaje)
  useAutoRequests({
    driverId,
    enabled: autoRequests && isAvailable,
    busy: Boolean(currentId) || Boolean(trip),
  });

  const dismissTrip = useCallback(() => {
    setDismissedIds((prev) => (currentId ? [...prev, currentId] : prev));
    setCurrentId(null);
    setTrip(null);
  }, [currentId]);

  const value = useMemo(
    () => ({ trip, dismissTrip, autoRequests, setAutoRequests }),
    [trip, dismissTrip, autoRequests]
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) throw new Error('useTrip debe usarse dentro de TripProvider');
  return context;
}
