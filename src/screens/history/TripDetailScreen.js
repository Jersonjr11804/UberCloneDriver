// AI-assisted: see docs/AI_LOG.md #7
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Badge, Card, InfoRow } from '../../components/ui';
import { decodePolyline } from '../../services/mapsService';
import { fetchTrip } from '../../services/tripService';
import { categoryLabel, paymentMethodLabel, paymentStatusInfo } from '../../constants/trip';
import { formatCOP, formatDateTime, formatKm, formatMinutes } from '../../utils/format';
import { colors } from '../../styles/formStyles';

// Detalle de un viaje del historial: la ruta guardada se dibuja con Polyline
// (no se usa Static Maps para ahorrar cupo de Google).
export default function TripDetailScreen({ route }) {
  const { tripId } = route.params;
  const mapRef = useRef(null);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchTrip(tripId)
      .then((data) => !cancelled && setTrip(data))
      .catch((err) => {
        console.log('Error al cargar el viaje:', err);
        if (!cancelled) setError('No se pudo cargar el viaje.');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const points = useMemo(() => {
    if (!trip) return [];
    const decoded = decodePolyline(trip.routePolyline);
    if (decoded.length) return decoded;
    // Sin ruta guardada: línea recta entre origen y destino
    return [
      { latitude: trip.origin.lat, longitude: trip.origin.lng },
      { latitude: trip.destination.lat, longitude: trip.destination.lng },
    ];
  }, [trip]);

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;
  }
  if (!trip) {
    return <Text style={styles.error}>{error || 'Viaje no encontrado.'}</Text>;
  }

  const payment = paymentStatusInfo(trip);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.mapBox}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          scrollEnabled={false}
          zoomEnabled={false}
          onMapReady={() =>
            mapRef.current?.fitToCoordinates(points, {
              edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
              animated: false,
            })
          }
          initialRegion={{
            latitude: trip.origin.lat,
            longitude: trip.origin.lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Polyline coordinates={points} strokeColor={colors.primary} strokeWidth={5} />
          <Marker coordinate={{ latitude: trip.origin.lat, longitude: trip.origin.lng }} title="Recogida" pinColor={colors.primary} />
          <Marker coordinate={{ latitude: trip.destination.lat, longitude: trip.destination.lng }} title="Destino" pinColor={colors.accent} />
        </MapView>
      </View>

      <Text style={styles.date}>{formatDateTime(trip.completedAt)}</Text>
      <Text style={styles.route}>
        {trip.origin?.address} → {trip.destination?.address}
      </Text>

      <Card>
        <InfoRow label="Categoría" value={categoryLabel(trip.category)} />
        <InfoRow label="Distancia" value={formatKm(trip.distanceKm)} />
        <InfoRow label="Duración" value={formatMinutes(trip.durationMin)} />
        <InfoRow label="Tarifa" value={formatCOP(trip.fare)} />
        <InfoRow
          label={`Comisión (${Math.round((trip.commissionRate || 0) * 100)} %)`}
          value={`-${formatCOP(trip.commission)}`}
        />
        <InfoRow label="Propina" value={formatCOP(trip.tip)} />
        <InfoRow label="Ganancia neta" value={formatCOP(trip.driverEarnings)} bold />
      </Card>

      <Card style={styles.block}>
        <InfoRow label="Método de pago" value={paymentMethodLabel(trip.paymentMethod)} />
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Estado del pago</Text>
          <Badge label={payment.label} tone={payment.tone} />
        </View>
        <InfoRow
          label="Calificación del pasajero"
          value={trip.rating ? `${'★'.repeat(trip.rating)}${'☆'.repeat(5 - trip.rating)}` : 'Sin calificar'}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, paddingBottom: 40 },
  mapBox: { height: 220, borderRadius: 16, overflow: 'hidden', marginBottom: 14 },
  date: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  route: { color: colors.text, fontSize: 17, fontWeight: '700', marginVertical: 8 },
  block: { marginTop: 12 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  statusLabel: { color: colors.muted, fontSize: 14 },
  error: { color: colors.error, textAlign: 'center', marginTop: 40 },
});
