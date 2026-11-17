// AI-assisted: see docs/AI_LOG.md #9
// Como todavía no existe la app del pasajero, la app simula solicitudes y el recorrido del carro.
// Cuando haya pasajeros reales, pon autoRequests en false (y quita la pantalla "Simular solicitud").
export const SIMULATION = {
  autoRequests: true, // llegan solicitudes solas mientras estás Disponible
  firstRequestDelayMs: 4000, // espera antes de la primera solicitud al ponerte Disponible
  nextRequestDelayMs: 12000, // espera entre una solicitud y la siguiente
  // Distancias aleatorias en grados (≈ 111 km por grado)
  pickupOffsetDeg: [0.004, 0.01], // recogida a ≈ 0,5 – 1,1 km del conductor
  tripOffsetDeg: [0.02, 0.045], // destino a ≈ 2 – 5 km de la recogida
  autoPaymentMethods: ['cash', 'mercadopago'],
  // Carro animado: velocidad simulada y duración mínima/máxima de cada tramo
  carSpeedKmh: 120,
  minLegSeconds: 12,
  maxLegSeconds: 45,
};
