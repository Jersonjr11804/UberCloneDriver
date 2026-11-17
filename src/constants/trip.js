// AI-assisted: see docs/AI_LOG.md #7
import { CATEGORIES } from './options';

// Estados del viaje (campo `status`); controlan qué pantalla se muestra
export const TRIP_STATUS = {
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  DRIVER_ARRIVING: 'driver_arriving',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
};

// Estados "abiertos": el conductor todavía tiene algo que hacer con el viaje
export const OPEN_TRIP_STATUSES = [
  TRIP_STATUS.REQUESTED,
  TRIP_STATUS.ACCEPTED,
  TRIP_STATUS.DRIVER_ARRIVING,
  TRIP_STATUS.IN_PROGRESS,
  TRIP_STATUS.COMPLETED,
];

export const PAYMENT_METHOD = {
  MERCADO_PAGO: 'mercadopago',
  STRIPE: 'stripe',
  CASH: 'cash',
};

export const PAYMENT_METHODS = [
  { label: 'Mercado Pago', value: PAYMENT_METHOD.MERCADO_PAGO },
  { label: 'Stripe', value: PAYMENT_METHOD.STRIPE },
  { label: 'Efectivo', value: PAYMENT_METHOD.CASH },
];

export const PAYMENT_STATUS = {
  APPROVED: 'approved',
  PENDING: 'pending',
  REJECTED: 'rejected',
};

export const categoryLabel = (value) =>
  CATEGORIES.find((c) => c.value === value)?.label || value || '—';

export const paymentMethodLabel = (value) =>
  PAYMENT_METHODS.find((m) => m.value === value)?.label || value || '—';

// Etiqueta de estado de pago: Aprobado, Pendiente, Rechazado o Efectivo
export const paymentStatusInfo = (trip) => {
  if (trip?.paymentMethod === PAYMENT_METHOD.CASH) return { label: 'Efectivo', tone: 'info' };
  if (trip?.paymentStatus === PAYMENT_STATUS.APPROVED || trip?.status === TRIP_STATUS.PAID) {
    return { label: 'Aprobado', tone: 'success' };
  }
  if (trip?.paymentStatus === PAYMENT_STATUS.REJECTED) return { label: 'Rechazado', tone: 'error' };
  return { label: 'Pendiente', tone: 'warning' };
};
