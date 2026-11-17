# Backend de pagos (Mercado Pago Checkout Pro)

Solo credenciales de **prueba**. Las llaves secretas viven aquí (`server/.env`), nunca en la app.

```bash
cd server
npm install
cp .env.example .env      # llena los valores
npm test                  # prueba la validación de la firma del webhook
npm run dev               # arranca en http://localhost:3000
```

En otra terminal, expón el servidor con HTTPS (Mercado Pago necesita una URL pública):

```bash
ngrok http 3000
```

Copia la URL `https://...ngrok...` en `PUBLIC_URL` (server/.env) y en
`EXPO_PUBLIC_PAYMENTS_API_URL` (.env de la app). Si ngrok cambia la URL, actualiza ambos
lugares y la URL del webhook en el panel de Mercado Pago.

Nunca subas a Git: `server/.env` ni `serviceAccountKey.json`.
