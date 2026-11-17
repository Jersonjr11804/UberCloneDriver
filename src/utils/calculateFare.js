// AI-assisted: see docs/AI_LOG.md #7
import { PRICING } from '../config/pricing';

// Función pura. Se usa tanto en la estimación (solicitud entrante) como en el cierre del viaje.
//   Tarifa   = max(Mínima, (Base + km·Vkm + min·Vmin) · Multiplicador), redondeada a 100 COP
//   Comisión = Tarifa · tasa            Ganancia neta = Tarifa − Comisión + Propina
// `commissionRate` es opcional: cada viaje guarda la tasa aplicada (commissionRate).
export function calculateFare({
  distanceKm,
  durationMin,
  category,
  tip = 0,
  commissionRate = PRICING.commissionRate,
}) {
  const multiplier = PRICING.categoryMultipliers[category] ?? 1;
  const raw =
    (PRICING.baseFare + distanceKm * PRICING.perKm + durationMin * PRICING.perMinute) * multiplier;

  const fare = Math.round(Math.max(PRICING.minFare, raw) / PRICING.roundTo) * PRICING.roundTo;
  const commission = Math.round(fare * commissionRate);
  const cleanTip = Math.max(0, Math.round(tip || 0));
  const driverEarnings = fare - commission + cleanTip;

  return { fare, commission, driverEarnings };
}
