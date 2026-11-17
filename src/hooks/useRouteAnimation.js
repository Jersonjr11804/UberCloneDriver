// AI-assisted: see docs/AI_LOG.md #9
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildPath, pointAt } from '../utils/routeMath';

const TICK_MS = 250;
const IDLE = { position: null, index: 0, progress: 0, arrived: false };

// Mueve un punto (el carro) a lo largo de una ruta ya dibujada sobre las calles.
// El tramo dura entre minSeconds y maxSeconds, según la distancia y la velocidad simulada.
export default function useRouteAnimation({ points, speedKmh = 120, minSeconds = 12, maxSeconds = 45 }) {
  const path = useMemo(() => buildPath(points), [points]);
  const [state, setState] = useState(IDLE);
  const skipRef = useRef(false);

  useEffect(() => {
    skipRef.current = false;
    if (!path) {
      setState(IDLE);
      return undefined;
    }

    const seconds = Math.min(maxSeconds, Math.max(minSeconds, path.total / (speedKmh / 3.6)));
    const metersPerSecond = path.total / seconds;
    const startedAt = Date.now();
    setState({ position: path.points[0], index: 0, progress: 0, arrived: false });

    const id = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const traveled = skipRef.current ? path.total : Math.min(path.total, elapsed * metersPerSecond);
      const { position, index } = pointAt(path, traveled);
      const arrived = traveled >= path.total;
      setState({ position, index, progress: path.total ? traveled / path.total : 1, arrived });
      if (arrived) clearInterval(id);
    }, TICK_MS);

    return () => clearInterval(id); // limpieza
  }, [path, speedKmh, minSeconds, maxSeconds]);

  // Lo que falta por recorrer (para ir borrando la línea detrás del carro)
  const remainingPoints = useMemo(() => {
    if (!path || !state.position) return [];
    return [state.position, ...path.points.slice(state.index + 1)];
  }, [path, state.position, state.index]);

  const skip = useCallback(() => {
    skipRef.current = true;
  }, []);

  return { ...state, remainingPoints, skip };
}
