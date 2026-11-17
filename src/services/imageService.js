// AI-assisted: see docs/AI_LOG.md #6
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} from '../config/cloudinary';

// Las versiones nuevas de Expo rechazan las fotos dentro de FormData
// ("Unsupported FormDataPart implementation"), así que NO se usa FormData:
// la foto viaja como texto (data URI en base64) en un formulario urlencoded.
const base64Cache = new Map();

// ImageField guarda aquí el base64 de cada foto al elegirla
export function rememberImage(uri, base64) {
  if (uri && base64) base64Cache.set(uri, base64);
}

// Respaldo: si no hay base64 guardado, se intenta leer el archivo desde su uri
function readAsDataUri(uri) {
  return fetch(uri)
    .then((response) => response.blob())
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
          reader.readAsDataURL(blob);
        })
    );
}

async function getDataUri(uri) {
  const base64 = base64Cache.get(uri);
  if (base64) return `data:image/jpeg;base64,${base64}`;
  try {
    return await readAsDataUri(uri);
  } catch (error) {
    throw new Error('No se pudo leer una de las fotos. Vuelve a elegirla e inténtalo de nuevo.');
  }
}

// Sube una imagen local (uri) a Cloudinary y devuelve la URL pública.
// Esa URL es la que se guarda en Firestore (no la imagen).
export async function uploadImage(uri, folder) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Faltan las variables de Cloudinary en el .env');
  }

  const file = await getDataUri(uri);
  const body =
    `file=${encodeURIComponent(file)}` +
    `&upload_preset=${encodeURIComponent(CLOUDINARY_UPLOAD_PRESET)}` +
    `&folder=${encodeURIComponent(folder)}`;

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    }
  );

  let json = null;
  try {
    json = await response.json();
  } catch (error) {
    // respuesta sin JSON; se maneja abajo
  }

  if (!response.ok) {
    throw new Error(json?.error?.message || 'No se pudo subir la imagen');
  }
  return json.secure_url;
}
