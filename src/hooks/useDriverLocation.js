// AI-assisted: see docs/AI_LOG.md #3
import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { LOCATION_INTERVAL_MS } from '../constants/options';

// - Siempre pide permiso y obtiene la ubicación actual (para mostrar el mapa).
// - Mientras `tracking` sea true, escucha la ubicación y llama a `onUpdate`
//   como máximo cada `intervalMs`. Al pasar a false o salir de la pantalla,
//   el seguimiento se detiene (función de limpieza de useEffect).
export default function useDriverLocation({
  tracking,
  onUpdate,
  intervalMs = LOCATION_INTERVAL_MS,
}) {
  const [location, setLocation] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(null); // null = aún no se sabe
  const [locationError, setLocationError] = useState('');
  const onUpdateRef = useRef(onUpdate);
  const lastSentRef = useRef(0);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // 1) Permiso + ubicación inicial
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        setPermissionGranted(status === 'granted');
        if (status !== 'granted') return;

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) setLocation(current.coords);
      } catch (error) {
        if (!cancelled) setLocationError('No se pudo obtener tu ubicación');
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Seguimiento mientras el conductor está Disponible
  useEffect(() => {
    if (!tracking || !permissionGranted) return undefined;

    let cancelled = false;
    let subscription = null;

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: intervalMs, distanceInterval: 0 },
      (position) => {
        setLocation(position.coords);
        const now = Date.now();
        if (onUpdateRef.current && now - lastSentRef.current >= intervalMs) {
          lastSentRef.current = now;
          onUpdateRef.current(position.coords);
        }
      }
    )
      .then((sub) => {
        if (cancelled) sub.remove();
        else subscription = sub;
      })
      .catch(() => setLocationError('No se pudo iniciar el seguimiento'));

    return () => {
      cancelled = true;
      if (subscription) subscription.remove();
    };
  }, [tracking, permissionGranted, intervalMs]);

  return { location, permissionGranted, locationError };
}
