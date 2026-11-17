// AI-assisted: see docs/AI_LOG.md #8
//
// Backend de pagos con Mercado Pago Checkout Pro (solo credenciales de PRUEBA).
// Las llaves secretas viven SOLO aquí (server/.env), nunca en la app.
//
//   POST /payments/create   la app pide el link de pago de un viaje (requiere sesión de Firebase)
//   POST /payments/webhook  Mercado Pago avisa el resultado -> se actualiza el viaje en Firestore
//   POST /payments/sync     la app consulta el resultado (respaldo por si el webhook tarda)
//   GET  /payments/return   página a la que vuelve el pasajero después de pagar
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import express from 'express';
import admin from 'firebase-admin';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { verifyWebhookSignature } from './signature.js';

const {
  PORT = 3000,
  PUBLIC_URL,
  MP_ACCESS_TOKEN,
  MP_WEBHOOK_SECRET,
  FIREBASE_SERVICE_ACCOUNT_PATH,
} = process.env;

const missing = ['PUBLIC_URL', 'MP_ACCESS_TOKEN', 'FIREBASE_SERVICE_ACCOUNT_PATH'].filter(
  (name) => !process.env[name]
);
if (missing.length) {
  console.error(`Faltan variables en server/.env: ${missing.join(', ')}`);
  process.exit(1);
}
if (!PUBLIC_URL.startsWith('https://')) {
  console.error('PUBLIC_URL debe empezar por https:// (Mercado Pago no acepta http en las URLs de retorno).');
  process.exit(1);
}
if (!MP_WEBHOOK_SECRET) {
  console.warn('⚠ MP_WEBHOOK_SECRET vacío: los webhooks NO se validarán. Configúralo antes de entregar.');
}

const baseUrl = PUBLIC_URL.replace(/\/$/, '');

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(readFileSync(FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'))),
});
const db = admin.firestore();
const mp = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

const app = express();
app.use(express.json());

// ---------- Utilidades ----------

// Solo un conductor con sesión de Firebase puede pedir pagos, y solo de SUS viajes
async function requireDriver(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Falta la sesión' });
  try {
    req.uid = (await admin.auth().verifyIdToken(token)).uid;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Sesión inválida' });
  }
}

async function loadOwnTrip(tripId, uid) {
  if (typeof tripId !== 'string' || !tripId) return { status: 400, error: 'Falta tripId' };
  const ref = db.collection('trips').doc(tripId);
  const snapshot = await ref.get();
  if (!snapshot.exists) return { status: 404, error: 'Viaje no encontrado' };
  const trip = snapshot.data();
  if (trip.driverId !== uid) return { status: 403, error: 'Este viaje no es tuyo' };
  return { ref, trip };
}

// El monto sale SIEMPRE del viaje guardado en Firestore, nunca de lo que mande la app
const amountOf = (trip) => Math.round((trip.fare || 0) + (trip.tip || 0));

// Aplica el resultado de un pago de Mercado Pago al viaje (es seguro repetirlo)
async function applyPayment(payment) {
  const tripId = payment.external_reference;
  if (!tripId) return null;
  const ref = db.collection('trips').doc(tripId);

  return db.runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) return null;
    const trip = snapshot.data();
    if (trip.status === 'paid') return { status: 'paid', paymentStatus: 'approved' };

    const base = { paymentId: String(payment.id) };

    if (payment.status === 'approved') {
      const validAmount =
        Number(payment.transaction_amount) === amountOf(trip) && payment.currency_id === 'COP';
      if (!validAmount) {
        console.error('Monto o moneda no coinciden', tripId, payment.transaction_amount, payment.currency_id);
        tx.update(ref, { ...base, paymentStatus: 'rejected', paymentNote: 'amount_mismatch' });
        return { status: trip.status, paymentStatus: 'rejected' };
      }
      tx.update(ref, {
        ...base,
        status: 'paid',
        paymentStatus: 'approved',
        paidAt: admin.firestore.Timestamp.now(),
      });
      return { status: 'paid', paymentStatus: 'approved' };
    }

    const paymentStatus = ['rejected', 'cancelled'].includes(payment.status) ? 'rejected' : 'pending';
    tx.update(ref, { ...base, paymentStatus });
    return { status: trip.status, paymentStatus };
  });
}

// ---------- Rutas ----------

app.get('/health', (req, res) => res.json({ ok: true }));

// 1) Crear la preferencia de pago y devolver el link del checkout
app.post('/payments/create', requireDriver, async (req, res) => {
  try {
    const loaded = await loadOwnTrip(req.body?.tripId, req.uid);
    if (loaded.error) return res.status(loaded.status).json({ error: loaded.error });
    const { trip } = loaded;
    const tripId = req.body.tripId;

    if (trip.status !== 'completed') {
      return res.status(409).json({ error: 'El viaje debe estar finalizado y sin pagar' });
    }
    if (trip.paymentMethod !== 'mercadopago') {
      return res.status(400).json({ error: 'Este viaje no se paga con Mercado Pago' });
    }
    const amount = amountOf(trip);
    if (!(amount > 0)) return res.status(400).json({ error: 'Monto inválido' });

    const preference = await new Preference(mp).create({
      body: {
        items: [
          {
            id: tripId,
            title: 'Viaje UberClone',
            quantity: 1,
            unit_price: amount,
            currency_id: 'COP',
          },
        ],
        external_reference: tripId,
        notification_url: `${baseUrl}/payments/webhook`,
        back_urls: {
          success: `${baseUrl}/payments/return?status=success`,
          pending: `${baseUrl}/payments/return?status=pending`,
          failure: `${baseUrl}/payments/return?status=failure`,
        },
        auto_return: 'approved',
      },
    });

    await loaded.ref.update({ paymentPreferenceId: preference.id });
    return res.json({ checkoutUrl: preference.init_point, preferenceId: preference.id });
  } catch (error) {
    console.error('Error al crear la preferencia:', error);
    return res.status(500).json({ error: 'No se pudo crear el pago' });
  }
});

// 2) Webhook: Mercado Pago avisa que un pago cambió
app.post('/payments/webhook', async (req, res) => {
  const dataId = req.query['data.id'] || req.body?.data?.id;
  const type = req.query.type || req.query.topic || req.body?.type;

  if (MP_WEBHOOK_SECRET) {
    const valid = verifyWebhookSignature({
      xSignature: req.get('x-signature'),
      xRequestId: req.get('x-request-id'),
      dataId: req.query['data.id'],
      secret: MP_WEBHOOK_SECRET,
    });
    if (!valid) return res.sendStatus(401);
  }

  res.sendStatus(200); // se responde rápido; el trabajo sigue abajo
  if (type !== 'payment' || !dataId) return;
  try {
    // Nunca se confía en el cuerpo de la notificación: se consulta el pago directamente a Mercado Pago
    const payment = await new Payment(mp).get({ id: dataId });
    await applyPayment(payment);
  } catch (error) {
    console.error('Error al procesar el webhook:', error);
  }
});

// 3) Respaldo: la app pregunta el resultado al volver del checkout
app.post('/payments/sync', requireDriver, async (req, res) => {
  try {
    const loaded = await loadOwnTrip(req.body?.tripId, req.uid);
    if (loaded.error) return res.status(loaded.status).json({ error: loaded.error });

    const found = await new Payment(mp).search({
      options: { external_reference: req.body.tripId, sort: 'date_created', criteria: 'desc' },
    });
    const payments = found.results || [];
    const chosen = payments.find((p) => p.status === 'approved') || payments[0];
    if (!chosen) return res.json({ paymentStatus: loaded.trip.paymentStatus || 'pending', status: loaded.trip.status });

    const result = await applyPayment(chosen);
    return res.json(result || { paymentStatus: 'pending', status: loaded.trip.status });
  } catch (error) {
    console.error('Error al sincronizar el pago:', error);
    return res.status(500).json({ error: 'No se pudo consultar el pago' });
  }
});

// 4) Página de retorno (el estado real del viaje lo actualiza el webhook / sync)
app.get('/payments/return', (req, res) => {
  const messages = {
    success: ['¡Pago recibido!', 'Ya puedes cerrar esta ventana y volver a la app.'],
    pending: ['Pago pendiente', 'Tu pago está en proceso. Cierra esta ventana y vuelve a la app.'],
    failure: ['El pago no se completó', 'Cierra esta ventana y vuelve a la app para intentarlo de nuevo.'],
  };
  const [title, text] = messages[req.query.status] || messages.pending;
  res.type('html').send(`<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;text-align:center;padding:48px 24px;color:#1A1633}
h1{color:#5B3FD9}</style></head><body><h1>${title}</h1><p>${text}</p></body></html>`);
});

app.listen(PORT, () => console.log(`Servidor de pagos en http://localhost:${PORT}  (público: ${baseUrl})`));
