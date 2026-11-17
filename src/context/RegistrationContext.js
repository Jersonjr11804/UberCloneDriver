// AI-assisted: see docs/AI_LOG.md #1
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  validatePersonal,
  validateVehicle,
  validateDocuments,
  isTechReviewRequired,
  hasErrors,
} from '../utils/validators';
import { registerDriver } from '../services/driverService';
import { useDriverSession } from './DriverSessionContext';

const initialData = {
  // Pestaña 1
  profilePhoto: null,
  fullName: '',
  documentId: '',
  phone: '',
  birthDate: null,
  gender: '',
  email: '',
  language: 'es',
  // Pestaña 2
  category: '',
  plate: '',
  brand: '',
  model: '',
  year: '',
  color: '',
  capacity: '',
  vehiclePhoto: null,
  // Pestaña 3
  licenseNumber: '',
  licensePhoto: null,
  licenseExpiry: null,
  soatPhoto: null,
  soatExpiry: null,
  techPhoto: null,
  techExpiry: null,
  mercadoPagoEmail: '',
  acceptedTerms: false,
};

// status: 'idle' | 'sending' | 'done' | 'error'
const initialSubmit = { status: 'idle', message: '' };

const RegistrationContext = createContext(null);

// Muestra la causa real del fallo (Firestore, Cloudinary, red...) en vez de un mensaje genérico
const describeSubmitError = (error) => {
  const code = error?.code || '';
  if (code === 'permission-denied') {
    return 'Firestore rechazó el guardado (permiso denegado). Revisa y publica las reglas de Firestore.';
  }
  if (code === 'unavailable') {
    return 'No hay conexión con Firestore. Revisa tu internet.';
  }
  const detail = error?.message ? `: ${error.message}` : '';
  return `No se pudo enviar el registro${detail}`;
};

export function RegistrationProvider({ children }) {
  const { user, markProfileCreated } = useDriverSession();
  // El correo de la cuenta se sugiere en el registro (el conductor puede cambiarlo)
  const [data, setData] = useState(() => ({ ...initialData, email: user?.email || '' }));
  const [touched, setTouched] = useState({});
  const [submitState, setSubmitState] = useState(initialSubmit);

  const updateField = useCallback((field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const touchField = useCallback((field) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }, []);

  const touchFields = useCallback((fields) => {
    setTouched((prev) => {
      const next = { ...prev };
      fields.forEach((f) => {
        next[f] = true;
      });
      return next;
    });
  }, []);

  const techRequired = useMemo(() => isTechReviewRequired(data.year), [data.year]);

  const personalErrors = useMemo(() => validatePersonal(data), [data]);
  const vehicleErrors = useMemo(() => validateVehicle(data), [data]);
  const documentsErrors = useMemo(
    () => validateDocuments(data, techRequired),
    [data, techRequired]
  );

  const isPersonalValid = useMemo(() => !hasErrors(personalErrors), [personalErrors]);
  const isVehicleValid = useMemo(() => !hasErrors(vehicleErrors), [vehicleErrors]);
  const isDocumentsValid = useMemo(() => !hasErrors(documentsErrors), [documentsErrors]);

  // El botón "Enviar registro" solo se habilita si las tres pestañas son válidas
  const isFormValid = isPersonalValid && isVehicleValid && isDocumentsValid;

  // Solo se muestran los errores de campos que el usuario ya tocó
  const visibleErrors = useMemo(() => {
    const all = { ...personalErrors, ...vehicleErrors, ...documentsErrors };
    const visible = {};
    Object.keys(all).forEach((key) => {
      visible[key] = touched[key] ? all[key] : '';
    });
    return visible;
  }, [personalErrors, vehicleErrors, documentsErrors, touched]);

  const submitRegistration = useCallback(async () => {
    if (!isFormValid || submitState.status === 'sending' || submitState.status === 'done') {
      return;
    }
    setSubmitState({ status: 'sending', message: '' });
    try {
      await registerDriver(data, techRequired);
      setSubmitState({ status: 'done', message: '' });
    } catch (error) {
      console.log('Error al registrar el conductor:', error);
      setSubmitState({ status: 'error', message: describeSubmitError(error) });
    }
  }, [isFormValid, submitState.status, data, techRequired]);

  // Pasa al Home (se llama desde el botón "Ir al inicio" de la pantalla de confirmación)
  const finishRegistration = useCallback(() => markProfileCreated(), [markProfileCreated]);

  const value = useMemo(
    () => ({
      data,
      visibleErrors,
      techRequired,
      isPersonalValid,
      isVehicleValid,
      isDocumentsValid,
      isFormValid,
      submitState,
      updateField,
      touchField,
      touchFields,
      submitRegistration,
      finishRegistration,
    }),
    [
      data,
      visibleErrors,
      techRequired,
      isPersonalValid,
      isVehicleValid,
      isDocumentsValid,
      isFormValid,
      submitState,
      updateField,
      touchField,
      touchFields,
      submitRegistration,
      finishRegistration,
    ]
  );

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration debe usarse dentro de RegistrationProvider');
  }
  return context;
}
