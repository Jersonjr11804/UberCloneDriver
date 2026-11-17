// AI-assisted: see docs/AI_LOG.md #5
// Solo datos públicos: el "upload preset" debe ser de tipo UNSIGNED.
// NUNCA pongas el API secret de Cloudinary en la app.
export const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
  console.warn('Cloudinary: faltan EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME o EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET en el .env');
}
