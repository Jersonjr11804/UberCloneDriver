// AI-assisted: see docs/AI_LOG.md #7, #9
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CarMarker from '../../components/CarMarker';
import { Card, InfoRow } from '../../components/ui';
import { SIMULATION } from '../../config/simulation';
import useRouteAnimation from '../../hooks/useRouteAnimation';
import { getRoute } from '../../services/mapsService';
import {
  boardPassenger,
  cancelTrip,
  finishTrip,
  startDriverArriving,
} from '../../services/tripService';
import { TRIP_STATUS, categoryLabel, paymentMethodLabel } from '../../constants/trip';
import { formatKm, formatMinutes } from '../../utils/format';
import { colors, formStyles } from '../../styles/formStyles';

const toLatLng = (point) => ({ latitude: point.lat, longitude: point.lng });

// Punto de partida del carro: la ubicación del conductor (o la recogida si no hay GPS)
async function getDriverStart(fallback) {
  try {
    const last = await Location.getLastKnownPositionAsync();
    const position =
      last || (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch (error) {
    return fallback;
  }
}

// Pantalla 3: viaje en curso.
//   driver_arriving -> el carro recorre la ruta hasta el punto de recogida
//   in_progress     -> después de "Pasajero a bordo", recorre la ruta hasta el destino
// Los botones se habilitan cuando el carro llega al final de cada tramo.
export default function ActiveTrip({ trip }) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const [route, setRoute] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isAccepted = trip.status === TRIP_STATUS.ACCEPTED;
  const inProgress = trip.status === TRIP_STATUS.IN_PROGRESS;
  const target = inProgress ? trip.destination : trip.origin;

  const { position, remainingPoints, progress, arrived, skip } = useRouteAnimation({
    points: route?.points,
    speedKmh: SIMULATION.carSpeedKmh,
    minSeconds: SIMULATION.minLegSeconds,
    maxSeconds: SIMULATION.maxLegSeconds,
  });

  // accepted -> driver_arriving (el conductor se dirige a recoger al pasajero)
  useEffect(() => {
    if (isAccepted) {
      startDriverArriving(trip.id).catch((err) => console.log('Error al iniciar la ruta:', err));
    }
  }, [trip.id, isAccepted]);

  // Ruta de cada tramo por las calles: se pide una sola vez al cambiar de tramo
  useEffect(() => {
    if (isAccepted) return undefined;
    let cancelled = false;
    setRoute(null);

    const loadRoute = async () => {
      const from = inProgress ? trip.origin : await getDriverStart(trip.origin);
      const result = await getRoute(from, target);
      if (cancelled) return;
      setRoute(result);
      if (mapRef.current && result.points.length) {
        mapRef.current.fitToCoordinates(result.points, {
          edgePadding: { top: 120, right: 50, bottom: 380, left: 50 },
          animated: true,
        });
      }
    };

    loadRoute();
    return () => {
      cancelled = true;
    };
  }, [isAccepted, inProgress, target.lat, target.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBoard = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      // Se guarda la ruta recogida -> destino para dibujarla después en el historial
      const toDestination = await getRoute(trip.origin, trip.destination);
      await boardPassenger(trip.id, toDestination.encoded);
    } catch (err) {
      console.log('Error al marcar pasajero a bordo:', err);
      setError('No se pudo actualizar el viaje. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }, [trip]);

  const handleFinish = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      // El cobro lo inicia el conductor desde el resumen (TripSummary)
      await finishTrip(trip);
      // Al pasar a "completed", TripFlowScreen muestra el cobro y resumen
    } catch (err) {
      console.log('Error al finalizar el viaje:', err);
      setError('No se pudo finalizar el viaje. Inténtalo de nuevo.');
      setBusy(false);
    }
  }, [trip]);

  const handleCancel = useCallback(() => {
    Alert.alert('Cancelar viaje', '¿Seguro que quieres cancelar este viaje?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: () => cancelTrip(trip.id).catch((err) => console.log('Error al cancelar:', err)),
      },
    ]);
  }, [trip.id]);

  let phase;
  if (inProgress) phase = arrived ? 'Llegaste al destino' : 'Viaje en curso hacia el destino';
  else phase = arrived ? 'Llegaste al punto de recogida' : 'Voy hacia el pasajero';

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        showsMyLocationButton={false}
        initialRegion={{
          latitude: trip.origin.lat,
          longitude: trip.origin.lng,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        {remainingPoints.length > 1 && (
          <Polyline coordinates={remainingPoints} strokeColor={colors.primary} strokeWidth={6} />
        )}
        <Marker coordinate={toLatLng(trip.origin)} title="Recogida" pinColor={colors.primary} />
        <Marker coordinate={toLatLng(trip.destination)} title="Destino" pinColor={colors.accent} />
        {position && <CarMarker coordinate={position} />}
      </MapView>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.phase}>{phase}</Text>
        <Text style={styles.address} numberOfLines={2}>
          {target.address || '—'}
        </Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${Math.round((arrived ? 1 : progress) * 100)}%` }]} />
        </View>
        {!arrived && route && (
          <TouchableOpacity onPress={skip} style={styles.skip}>
            <Text style={styles.skipText}>Saltar recorrido</Text>
          </TouchableOpacity>
        )}

        <Card style={styles.card}>
          <InfoRow label="Pasajero" value={trip.passengerName || 'Pasajero'} />
          <InfoRow label="Categoría" value={categoryLabel(trip.category)} />
          <InfoRow label="Pago" value={paymentMethodLabel(trip.paymentMethod)} />
          {route && (
            <InfoRow
              label="Este tramo"
              value={`${formatKm(route.distanceKm)} · ${formatMinutes(route.durationMin)}`}
            />
          )}
        </Card>
        {route?.source === 'estimate' && (
          <Text style={styles.note}>Ruta aproximada: no se pudo consultar el servicio de rutas.</Text>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[formStyles.button, styles.mainButton, (busy || !arrived || isAccepted) && styles.disabled]}
          onPress={inProgress ? handleFinish : handleBoard}
          disabled={busy || !arrived || isAccepted}
        >
          {busy ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={formStyles.buttonText}>{inProgress ? 'Finalizar viaje' : 'Pasajero a bordo'}</Text>
          )}
        </TouchableOpacity>

        {!inProgress && (
          <TouchableOpacity style={styles.cancel} onPress={handleCancel} disabled={busy}>
            <Text style={styles.cancelText}>Cancelar viaje</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  phase: { fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  address: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 4, marginBottom: 10 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  skip: { alignSelf: 'flex-end', paddingVertical: 6 },
  skipText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  card: { paddingVertical: 8, marginTop: 6 },
  note: { color: colors.warning, fontSize: 12, marginTop: 8 },
  mainButton: { marginTop: 14 },
  disabled: { opacity: 0.5 },
  cancel: { alignItems: 'center', paddingTop: 14 },
  cancelText: { color: colors.error, fontWeight: '700' },
  error: { color: colors.error, fontSize: 13, marginTop: 10 },
});
