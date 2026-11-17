// AI-assisted: see docs/AI_LOG.md #8
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verifyWebhookSignature } from './signature.js';

const secret = 'secreto-de-prueba';
const sign = (manifest) => crypto.createHmac('sha256', secret).update(manifest).digest('hex');

// Firma válida
let v1 = sign('id:123456;request-id:abc-1;ts:1704908010;');
assert.equal(
  verifyWebhookSignature({ xSignature: `ts=1704908010,v1=${v1}`, xRequestId: 'abc-1', dataId: '123456', secret }),
  true
);

// data.id con mayúsculas alfanuméricas -> se firma en minúsculas
v1 = sign('id:abcdef;request-id:abc-1;ts:1704908010;');
assert.equal(
  verifyWebhookSignature({ xSignature: `ts=1704908010,v1=${v1}`, xRequestId: 'abc-1', dataId: 'ABCDEF', secret }),
  true
);

// Datos alterados -> rechazada
assert.equal(
  verifyWebhookSignature({ xSignature: `ts=1704908010,v1=${v1}`, xRequestId: 'abc-1', dataId: '999', secret }),
  false
);
// Secreto incorrecto -> rechazada
assert.equal(
  verifyWebhookSignature({ xSignature: `ts=1704908010,v1=${v1}`, xRequestId: 'abc-1', dataId: 'abcdef', secret: 'otro' }),
  false
);
// Sin header -> rechazada
assert.equal(verifyWebhookSignature({ xSignature: undefined, xRequestId: 'x', dataId: '1', secret }), false);

console.log('signature.test.js: todo bien ✔');
