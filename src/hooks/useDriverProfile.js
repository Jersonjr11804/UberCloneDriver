// AI-assisted: see docs/AI_LOG.md #7
import { useEffect, useState } from 'react';
import { subscribeToDriver } from '../services/driverService';

// Documento completo del conductor en tiempo real (perfil, vehículo, documentos).
export default function useDriverProfile(driverId) {
  const [state, setState] = useState({ profile: null, loading: Boolean(driverId) });

  useEffect(() => {
    if (!driverId) {
      setState({ profile: null, loading: false });
      return undefined;
    }
    const unsubscribe = subscribeToDriver(
      driverId,
      (data) => setState({ profile: data, loading: false }),
      (error) => {
        console.log('Error al escuchar el perfil:', error);
        setState({ profile: null, loading: false });
      }
    );
    return unsubscribe; // limpieza
  }, [driverId]);

  return state;
}
