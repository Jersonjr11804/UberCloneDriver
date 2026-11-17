// AI-assisted: see docs/AI_LOG.md #4
import { useEffect, useState } from 'react';
import { subscribeToDriver } from '../services/driverService';

// Suscripción en tiempo real al estado de la cuenta (pending / approved / rejected).
// loading = true hasta que llega el primer dato de Firestore.
export default function useDriverAccount(driverId) {
  const [state, setState] = useState({ accountStatus: null, loading: Boolean(driverId) });

  useEffect(() => {
    if (!driverId) {
      setState({ accountStatus: null, loading: false });
      return undefined;
    }
    setState((prev) => ({ ...prev, loading: true }));

    const unsubscribe = subscribeToDriver(
      driverId,
      (data) => setState({ accountStatus: data ? data.accountStatus : null, loading: false }),
      (error) => {
        console.log('Error al escuchar la cuenta del conductor:', error);
        setState({ accountStatus: null, loading: false });
      }
    );
    return unsubscribe; // limpieza: cancela la suscripción
  }, [driverId]);

  return state;
}
