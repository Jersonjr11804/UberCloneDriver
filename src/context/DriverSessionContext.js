// AI-assisted: see docs/AI_LOG.md #6
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { driverProfileExists, signOutUser } from '../services/authService';

// Sesión del conductor (useContext).
// - user: usuario de Firebase Auth (null si no ha iniciado sesión).
// - profileStatus: 'loading' | 'exists' | 'missing' | 'error'
//     exists  -> ya completó el registro de conductor (va al Home)
//     missing -> tiene cuenta pero aún no completa el registro (va a Registro)
//     error   -> no se pudo consultar (NO se manda a Registro para no sobrescribir datos)
// Firebase Auth guarda la sesión en AsyncStorage, no hace falta guardarla a mano.
const DriverSessionContext = createContext(null);

export function DriverSessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileStatus, setProfileStatus] = useState('loading');
  const requestRef = useRef(0); // evita que una consulta vieja pise a una más reciente

  const loadProfile = useCallback(async (uid) => {
    const requestId = ++requestRef.current;
    setProfileStatus('loading');
    try {
      const exists = await driverProfileExists(uid);
      if (requestId === requestRef.current) setProfileStatus(exists ? 'exists' : 'missing');
    } catch (error) {
      console.log('Error al consultar el perfil del conductor:', error);
      if (requestId === requestRef.current) setProfileStatus('error');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (firebaseUser) {
        loadProfile(firebaseUser.uid);
      } else {
        requestRef.current += 1;
        setProfileStatus('loading');
      }
    });
    return unsubscribe; // limpieza: cancela la suscripción
  }, [loadProfile]);

  const retryProfile = useCallback(() => {
    if (user) loadProfile(user.uid);
  }, [user, loadProfile]);

  // Se llama cuando el conductor termina de ver la pantalla "Registro enviado"
  const markProfileCreated = useCallback(() => {
    requestRef.current += 1;
    setProfileStatus('exists');
  }, []);

  const signOut = useCallback(async () => {
    requestRef.current += 1;
    try {
      await signOutUser();
    } catch (error) {
      console.log('Error al cerrar sesión:', error);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      driverId: user && profileStatus === 'exists' ? user.uid : null,
      profileStatus,
      loading: !authReady || (Boolean(user) && profileStatus === 'loading'),
      retryProfile,
      markProfileCreated,
      signOut,
    }),
    [user, authReady, profileStatus, retryProfile, markProfileCreated, signOut]
  );

  return (
    <DriverSessionContext.Provider value={value}>{children}</DriverSessionContext.Provider>
  );
}

export function useDriverSession() {
  const context = useContext(DriverSessionContext);
  if (!context) {
    throw new Error('useDriverSession debe usarse dentro de DriverSessionProvider');
  }
  return context;
}
