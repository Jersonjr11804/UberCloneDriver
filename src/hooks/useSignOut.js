// AI-assisted: see docs/AI_LOG.md #7
import { useCallback } from 'react';
import { useDriverSession } from '../context/DriverSessionContext';
import { setDriverAvailability } from '../services/driverService';

// Cerrar sesión: primero queda No disponible en la base de datos
export default function useSignOut() {
  const { driverId, signOut } = useDriverSession();
  return useCallback(async () => {
    try {
      if (driverId) await setDriverAvailability(driverId, false);
    } catch (error) {
      console.log('Error al desconectar al conductor:', error);
    }
    await signOut();
  }, [driverId, signOut]);
}
