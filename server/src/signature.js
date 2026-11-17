// AI-assisted: see docs/AI_LOG.md #8
import crypto from 'node:crypto';

// Valida el header x-signature de los webhooks de Mercado Pago (HMAC-SHA256).
// Plantilla firmada:  id:[data.id];request-id:[x-request-id];ts:[ts];
// - data.id viene en la URL (?data.id=...) y se pasa a minúsculas si es alfanumérico.
// - Si algún valor no viene en la notificación, se omite de la plantilla.
export function verifyWebhookSignature({ xSignature, xRequestId, dataId, secret }) {
  if (!xSignature || !secret) return false;

  const parts = {};
  for (const piece of String(xSignature).split(',')) {
    const index = piece.indexOf('=');
    if (index > 0) parts[piece.slice(0, index).trim()] = piece.slice(index + 1).trim();
  }
  const { ts, v1 } = parts;
  if (!ts || !v1) return false;

  const id = dataId ? (/^[a-z0-9]+$/i.test(String(dataId)) ? String(dataId).toLowerCase() : String(dataId)) : '';
  let manifest = '';
  if (id) manifest += `id:${id};`;
  if (xRequestId) manifest += `request-id:${xRequestId};`;
  manifest += `ts:${ts};`;

  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
