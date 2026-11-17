// AI-assisted: see docs/AI_LOG.md #3
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import MapView from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDriverSession } from '../../context/DriverSessionContext';
import useDriverAccount from '../../hooks/useDriverAccount';
import useDriverLocation from '../../hooks/useDriverLocation';
import {
  canGoAvailable,
  setDriverAvailability,
  updateDriverLocation,
} from '../../services/driverService';
import { ACCOUNT_STATUS, DEFAULT_REGION } from '../../constants/options';
import { colors } from '../../styles/formStyles';

const toRegion = (coords) => ({
  latitude: coords.latitude,
  longitude: coords.longitude,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { driverId, signOut } = useDriverSession();
  const { accountStatus, loading: accountLoading } = useDriverAccount(driverId);

  const [isAvailable, setIsAvailable] = useState(false);
  const [actionError, setActionError] = useState('');
  const mapRef = useRef(null);
  const centeredRef = useRef(false);
  const availableRef = useRef(false);

  const isApproved = canGoAvailable(accountStatus);

  const handleLocationUpdate = useCallback(
    (coords) => {
      if (!driverId) return;
      updateDriverLocation(driverId, coords).catch((error) =>
        console.log('Error al enviar la ubicación:', error)
      );
    },
    [driverId]
  );

  const { location, permissionGranted, locationError } = useDriverLocation({
    tracking: isAvailable,
    onUpdate: handleLocationUpdate,
  });

  useEffect(() => {
    availableRef.current = isAvailable;
  }, [isAvailable]);

  // Centrar el mapa la primera vez que llega la ubicación
  useEffect(() => {
    if (location && !centeredRef.current && mapRef.current) {
      centeredRef.current = true;
      mapRef.current.animateToRegion(toRegion(location), 600);
    }
  }, [location]);

  // Si la cuenta deja de estar aprobada, se desconecta al conductor
  useEffect(() => {
    if (!isApproved && isAvailable) {
      setIsAvailable(false);
      if (driverId) setDriverAvailability(driverId, false).catch(() => {});
    }
  }, [isApproved, isAvailable, driverId]);

  // Al salir de la pantalla, queda No disponible en la base de datos
  useEffect(() => {
    return () => {
      if (availableRef.current && driverId) {
        setDriverAvailability(driverId, false).catch(() => {});
      }
    };
  }, [driverId]);

  const handleToggle = useCallback(
    async (value) => {
      if (!isApproved || !driverId) return;
      setActionError('');
      setIsAvailable(value);
      try {
        await setDriverAvailability(driverId, value);
      } catch (error) {
        console.log('Error al cambiar la disponibilidad:', error);
        setIsAvailable(!value);
        setActionError('No se pudo cambiar tu estado. Inténtalo de nuevo.');
      }
    },
    [isApproved, driverId]
  );

  const handleRecenter = useCallback(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(toRegion(location), 500);
    }
  }, [location]);

  // Cerrar sesión: primero queda No disponible en la base de datos
  const handleSignOut = useCallback(async () => {
    availableRef.current = false;
    setIsAvailable(false);
    try {
      if (driverId) await setDriverAvailability(driverId, false);
    } catch (error) {
      console.log('Error al desconectar al conductor:', error);
    }
    await signOut();
  }, [driverId, signOut]);

  // Mensaje según el estado de la cuenta
  let banner = null;
  if (accountLoading) {
    banner = { text: 'Cargando el estado de tu cuenta…' };
  } else if (accountStatus === null) {
    banner = { text: 'No encontramos tu cuenta de conductor. Cierra sesión e inténtalo de nuevo.' };
  } else if (accountStatus === ACCOUNT_STATUS.PENDING) {
    banner = {
      text: 'Tu cuenta está pendiente de aprobación. Podrás conectarte cuando sea aprobada.',
    };
  } else if (accountStatus === ACCOUNT_STATUS.REJECTED) {
    banner = { text: 'Tu registro fue rechazado. Revisa tus datos y documentos.' };
  } else if (!isApproved) {
    banner = { text: `Estado de cuenta no reconocido: "${accountStatus}".` };
  }

  const switchDisabled = !isApproved || permissionGranted !== true;

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      />

      {/* Estado actual arriba, como en la app de conductor de Uber */}
      <View style={[styles.topBar, { top: insets.top + 12 }]}>
        <View style={styles.statusPill}>
          <View
            style={[styles.dot, { backgroundColor: isAvailable ? colors.success : colors.muted }]}
          />
          <Text style={styles.statusPillText}>{isAvailable ? 'Disponible' : 'No disponible'}</Text>
        </View>
        <TouchableOpacity style={styles.signOut} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.recenter} onPress={handleRecenter}>
          <Ionicons name="locate" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />

          {banner && (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>{banner.text}</Text>
            </View>
          )}

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.sheetTitle}>
                {isAvailable ? 'Estás disponible' : 'Estás desconectado'}
              </Text>
              <Text style={styles.sheetSubtitle}>
                {isAvailable
                  ? 'Recibirás solicitudes de viaje cerca de ti'
                  : 'Conéctate para empezar a recibir viajes'}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={handleToggle}
              disabled={switchDisabled}
              trackColor={{ false: colors.border, true: colors.success }}
            />
          </View>

          {permissionGranted === false && (
            <Text style={styles.error}>
              Activa el permiso de ubicación en tu dispositivo para poder conectarte.
            </Text>
          )}
          {locationError ? <Text style={styles.error}>{locationError}</Text> : null}
          {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  signOut: {
    position: 'absolute',
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusPillText: { fontWeight: '700', color: colors.text },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  recenter: {
    alignSelf: 'flex-end',
    marginRight: 16,
    marginBottom: 12,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 14,
  },
  banner: {
    backgroundColor: colors.warningSoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  bannerText: { color: colors.warning, fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  sheetSubtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  error: { color: colors.error, fontSize: 12, marginTop: 10 },
});
