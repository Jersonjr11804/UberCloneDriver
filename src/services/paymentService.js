// AI-assisted: see docs/AI_LOG.md #8
//
// Pagos con Mercado Pago Checkout Pro (solo credenciales de PRUEBA).
//
// Flujo:
//   1. Al finalizar el viaje, el viaje queda en `completed` con su tarifa (calculateFare).
//   2. El conductor pulsa "Cobrar con Mercado Pago" -> payWithMercadoPago(tripId)
//   3. La app le pide al BACKEND (server/) el link de pago. Solo se envía el tripId:
//      el backend toma el monto de Firestore y usa la llave secreta (que nunca está en la app).
//   4. Se abre el checkout en el navegador y el pasajero paga con una tarjeta de prueba.
//   5. Mercado Pago avisa al backend (webhook) y el backend actualiza el viaje:
//        paymentStatus, paymentId y status: 'paid'.
//   6. TripContext escucha el viaje en tiempo real, así que el resumen se actualiza solo.
//      Al cerrar el navegador la app además consulta el resultado (sync) por si el webhook tarda.
import * as WebBrowser from 'expo-web-browser';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { TRIP_STATUS, PAYMENT_STATUS } from '../constants/trip';

// URL pública del backend (en desarrollo, la de ngrok). Va en el .env de la app, sin llaves secretas.
export const PAYMENTS_API_URL = (process.env.EXPO_PUBLIC_PAYMENTS_API_URL || '').replace(/\/$/, '');
export const isGatewayConfigured = Boolean(PAYMENTS_API_URL);

async function callBackend(path, body) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('No hay sesión activa');

  let response;
  try {
    response = await fetch(`${PAYMENTS_API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true', // evita la página de aviso de ngrok en desarrollo
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new Error(
      'No se pudo conectar con el servidor de pagos. Revisa que el backend y ngrok estén corriendo.'
    );
  }

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    if (json?.error) throw new Error(json.error);
    // Sin mensaje del backend: la respuesta no viene de nuestro servidor
    throw new Error(
      `El servidor de pagos no respondió en esa dirección (${response.status}). Revisa que el backend y ngrok estén corriendo y que EXPO_PUBLIC_PAYMENTS_API_URL sea la URL actual.`
    );
  }
  return json || {};
}

// Pide el link del checkout de un viaje finalizado
export const createCheckout = (tripId) => callBackend('/payments/create', { tripId });

// Consulta el resultado del pago (respaldo del webhook)
export const syncGatewayPayment = (tripId) => callBackend('/payments/sync', { tripId });

// Flujo completo: crea el pago, abre el checkout y, al cerrarlo, consulta el resultado
export async function payWithMercadoPago(tripId) {
  const { checkoutUrl } = await createCheckout(tripId);
  await WebBrowser.openBrowserAsync(checkoutUrl); // se resuelve cuando el usuario cierra el navegador
  return syncGatewayPayment(tripId);
}

// ----- SOLO PARA PRUEBAS SIN BACKEND -----
// Se usa únicamente cuando EXPO_PUBLIC_PAYMENTS_API_URL está vacío.
export async function simulateApprovedPayment(tripId) {
  await updateDoc(doc(db, 'trips', tripId), {
    status: TRIP_STATUS.PAID,
    paymentStatus: PAYMENT_STATUS.APPROVED,
    paymentId: `TEST-${Date.now()}`,
    paidAt: Timestamp.now(),
  });
}