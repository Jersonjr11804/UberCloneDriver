// AI-assisted: see docs/AI_LOG.md #9
import { useEffect, useRef } from 'react';
import { SIMULATION } from '../config/simulation';
import { createSimulatedRequest } from '../services/simulationService';

// Mientras el conductor está Disponible y sin viaje, llegan solicitudes solas.
// Cuando el viaje termina (o se rechaza), llega la siguiente después de una pausa.
export default function useAutoRequests({ driverId, enabled, busy }) {
  const wasEnabledRef = useRef(false);
  const inFlightRef = useRef(false);

  // Al desconectarse, la próxima vez vuelve a esperar el retardo inicial
  useEffect(() => {
    if (!enabled) wasEnabledRef.current = false;
  }, [enabled]);

  useEffect(() => {
    if (!enabled || busy || !driverId) return undefined;

    const delay = wasEnabledRef.current
      ? SIMULATION.nextRequestDelayMs
      : SIMULATION.firstRequestDelayMs;
    wasEnabledRef.current = true;

    const timer = setTimeout(async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        await createSimulatedRequest(driverId);
      } catch (error) {
        console.log('No se pudo crear la solicitud automática:', error?.message || error);
      } finally {
        inFlightRef.current = false;
      }
    }, delay);

    return () => clearTimeout(timer); // limpieza
  }, [driverId, enabled, busy]);
}
