// AI-assisted: see docs/AI_LOG.md #7
// Único archivo con los valores de tarifas y comisión (pesos colombianos enteros).
// Valores didácticos del PDF, no son tarifas reales.
export const PRICING = {
  baseFare: 3500, // tarifa base
  perKm: 1200, // valor por km
  perMinute: 250, // valor por minuto
  minFare: 6000, // tarifa mínima
  roundTo: 100, // la tarifa se redondea al múltiplo de 100 más cercano
  commissionRate: 0.2, // 20 % de la tarifa (las propinas van completas al conductor)
  categoryMultipliers: { economy: 1.0, xl: 1.4, premium: 1.8 },
  requestTimeoutSeconds: 15, // tiempo para aceptar o rechazar una solicitud
  requestMaxAgeMs: 2 * 60 * 1000, // solicitudes más viejas que esto se ignoran
};
