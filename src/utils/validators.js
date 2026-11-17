// AI-assisted: see docs/AI_LOG.md #1
import {
  MIN_DRIVER_AGE,
  MIN_XL_CAPACITY,
  MAX_CAPACITY,
  MIN_VEHICLE_YEAR,
  TECH_REVIEW_MIN_AGE,
} from '../constants/options';

export const PERSONAL_FIELDS = [
  'profilePhoto',
  'fullName',
  'documentId',
  'phone',
  'birthDate',
  'gender',
  'email',
  'language',
];

export const VEHICLE_FIELDS = [
  'category',
  'plate',
  'brand',
  'model',
  'year',
  'color',
  'capacity',
  'vehiclePhoto',
];

const NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLATE_REGEX = /^[A-Z]{3}\d{3}$/; // formato colombiano para carro: ABC123

// Cada validador devuelve '' si es válido o el mensaje de error.

export const validateRequired = (value, message) => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return message;
  }
  return '';
};

export const validateFullName = (value) => {
  const text = (value || '').trim();
  if (!text) return 'El nombre completo es obligatorio';
  if (text.length > 50) return 'Máximo 50 caracteres';
  if (!NAME_REGEX.test(text)) return 'Solo se permiten letras y espacios';
  return '';
};

export const validateDocumentId = (value) => {
  const text = (value || '').trim();
  if (!text) return 'El documento de identidad es obligatorio';
  if (!/^\d{6,10}$/.test(text)) return 'Debe tener entre 6 y 10 dígitos numéricos';
  return '';
};

export const validatePhone = (value) => {
  const text = (value || '').trim();
  if (!text) return 'El número de celular es obligatorio';
  if (!/^\d{10}$/.test(text)) return 'Debe tener exactamente 10 dígitos';
  return '';
};

export const calculateAge = (birthDate, today = new Date()) => {
  let age = today.getFullYear() - birthDate.getFullYear();
  const hadBirthday =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());
  if (!hadBirthday) age -= 1;
  return age;
};

export const validateBirthDate = (value) => {
  if (!value) return 'La fecha de nacimiento es obligatoria';
  if (calculateAge(value) < MIN_DRIVER_AGE) {
    return `Debes tener al menos ${MIN_DRIVER_AGE} años`;
  }
  return '';
};

export const validateEmail = (value) => {
  const text = (value || '').trim();
  if (!text) return 'El correo electrónico es obligatorio';
  if (!EMAIL_REGEX.test(text)) return 'Escribe un correo válido (ej: nombre@dominio.com)';
  return '';
};

export const validatePlate = (value) => {
  const text = (value || '').trim().toUpperCase(); // se convierte a mayúsculas antes de validar
  if (!text) return 'La placa es obligatoria';
  if (!PLATE_REGEX.test(text)) return 'Formato inválido. Ejemplo: ABC123';
  return '';
};

export const validateTextMax = (value, label, max) => {
  const text = (value || '').trim();
  if (!text) return `${label} es obligatorio`;
  if (text.length > max) return `Máximo ${max} caracteres`;
  return '';
};

export const validateYear = (value) => {
  const text = (value || '').trim();
  if (!text) return 'El año es obligatorio';
  if (!/^\d{4}$/.test(text)) return 'Debe tener 4 dígitos';
  const year = Number(text);
  const currentYear = new Date().getFullYear();
  if (year > currentYear) return `No puede ser mayor a ${currentYear}`;
  if (year < MIN_VEHICLE_YEAR) return `No puede ser menor a ${MIN_VEHICLE_YEAR}`;
  return '';
};

export const validateCapacity = (value, category) => {
  const text = (value || '').trim();
  if (!text) return 'La capacidad de pasajeros es obligatoria';
  if (!/^\d+$/.test(text)) return 'Debe ser un número';
  const capacity = Number(text);
  if (capacity < 1) return 'Debe ser al menos 1';
  if (capacity > MAX_CAPACITY) return `No puede ser mayor a ${MAX_CAPACITY}`;
  if (category === 'xl' && capacity < MIN_XL_CAPACITY) {
    return `La categoría XL exige mínimo ${MIN_XL_CAPACITY} pasajeros`;
  }
  return '';
};

// Validación por pestaña: devuelve un objeto { campo: mensajeDeError }

export const validatePersonal = (data) => ({
  profilePhoto: validateRequired(data.profilePhoto, 'La foto de perfil es obligatoria'),
  fullName: validateFullName(data.fullName),
  documentId: validateDocumentId(data.documentId),
  phone: validatePhone(data.phone),
  birthDate: validateBirthDate(data.birthDate),
  gender: validateRequired(data.gender, 'Selecciona un género'),
  email: validateEmail(data.email),
  language: validateRequired(data.language, 'Selecciona un idioma'),
});

export const validateVehicle = (data) => ({
  category: validateRequired(data.category, 'Selecciona una categoría'),
  plate: validatePlate(data.plate),
  brand: validateTextMax(data.brand, 'La marca', 30),
  model: validateTextMax(data.model, 'El modelo', 30),
  year: validateYear(data.year),
  color: validateRequired(data.color, 'Selecciona un color'),
  capacity: validateCapacity(data.capacity, data.category),
  vehiclePhoto: validateRequired(
    data.vehiclePhoto,
    'La foto del vehículo es obligatoria (debe verse la placa)'
  ),
});

export const hasErrors = (errors) => Object.values(errors).some(Boolean);

// ---- Pestaña 3: Documentos y pagos ----

export const DOCUMENT_FIELDS = [
  'licenseNumber',
  'licensePhoto',
  'licenseExpiry',
  'soatPhoto',
  'soatExpiry',
  'techPhoto',
  'techExpiry',
  'mercadoPagoEmail',
  'acceptedTerms',
];

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

// La revisión técnico-mecánica solo aplica según la antigüedad del vehículo.
// Si el año aún no es válido se exige por precaución.
export const isTechReviewRequired = (year) => {
  const text = String(year || '');
  if (!/^\d{4}$/.test(text)) return true;
  return new Date().getFullYear() - Number(text) >= TECH_REVIEW_MIN_AGE;
};

export const validateLicenseNumber = (value) => {
  const text = (value || '').trim();
  if (!text) return 'El número de licencia es obligatorio';
  if (!/^[A-Za-z0-9]{5,20}$/.test(text)) return 'Entre 5 y 20 caracteres (letras y números)';
  return '';
};

// Fecha de vencimiento: debe ser posterior a hoy
export const validateFutureDate = (value, label) => {
  if (!value) return `${label} es obligatoria`;
  if (startOfDay(value) <= startOfDay(new Date())) return 'Debe ser posterior a hoy';
  return '';
};

export const validateDocuments = (data, techRequired) => ({
  licenseNumber: validateLicenseNumber(data.licenseNumber),
  licensePhoto: validateRequired(data.licensePhoto, 'La foto de la licencia es obligatoria'),
  licenseExpiry: validateFutureDate(data.licenseExpiry, 'La fecha de vencimiento'),
  soatPhoto: validateRequired(data.soatPhoto, 'La foto del SOAT es obligatoria'),
  soatExpiry: validateFutureDate(data.soatExpiry, 'La fecha de vencimiento'),
  techPhoto: techRequired
    ? validateRequired(data.techPhoto, 'La foto de la revisión técnico-mecánica es obligatoria')
    : '',
  techExpiry: techRequired ? validateFutureDate(data.techExpiry, 'La fecha de vencimiento') : '',
  mercadoPagoEmail: validateEmail(data.mercadoPagoEmail),
  acceptedTerms: data.acceptedTerms ? '' : 'Debes aceptar los términos y la comisión',
});

// ---- Inicio de sesión / creación de cuenta ----

export const validatePassword = (value) => {
  const text = value || '';
  if (!text) return 'La contraseña es obligatoria';
  if (text.length < 8) return 'Mínimo 8 caracteres';
  if (!/[A-Za-z]/.test(text) || !/\d/.test(text)) return 'Debe incluir letras y números';
  return '';
};

export const validateConfirmPassword = (password, confirm) => {
  if (!confirm) return 'Confirma tu contraseña';
  if (confirm !== password) return 'Las contraseñas no coinciden';
  return '';
};
