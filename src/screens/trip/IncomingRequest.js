// AI-assisted: see docs/AI_LOG.md #7
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, InfoRow } from '../../components/ui';
import { PRICING } from '../../config/pricing';
import { acceptTrip, rejectTrip } from '../../services/tripService';
import { calculateFare } from '../../utils/calculateFare';
import { formatCOP, formatKm, formatMinutes } from '../../utils/format';
import { categoryLabel, paymentMethodLabel } from '../../constants/trip';
import { colors, formStyles } from '../../styles/formStyles';

// Pantalla 2: solicitud entrante con temporizador. Si llega a cero se rechaza sola.
export default function IncomingRequest({ trip }) {
  const insets = useSafeAreaInsets();
  const [secondsLeft, setSecondsLeft] = useState(PRICING.requestTimeoutSeconds);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const handledRef = useRef(false); // evita aceptar/rechazar dos veces

  // Misma función de tarifa que se usa al cerrar el viaje
  const estimate = useMemo(
    () =>
      calculateFare({
        distanceKm: trip.distanceKm,
        durationMin: trip.durationMin,
        category: trip.category,
        tip: 0,
      }),
    [trip.distanceKm, trip.durationMin, trip.category]
  );

  // Temporizador de 15 s con función de limpieza
  useEffect(() => {
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const handleReject = useCallback(async () => {
    if (handledRef.current) return;
    handledRef.current = true;
    setBusy(true);
    try {
      await rejectTrip(trip.id);
    } catch (err) {
      console.log('Error al rechazar la solicitud:', err);
      handledRef.current = false;
      setBusy(false);
      setError('No se pudo rechazar la solicitud.');
    }
    // Al cambiar el estado a "rejected", TripFlowScreen cierra esta pantalla
  }, [trip.id]);

  const handleAccept = useCallback(async () => {
    if (handledRef.current) return;
    handledRef.current = true;
    setBusy(true);
    setError('');
    try {
      await acceptTrip(trip.id);
    } catch (err) {
      console.log('Error al aceptar la solicitud:', err);
      handledRef.current = false;
      setBusy(false);
      setError('No se pudo aceptar la solicitud. Inténtalo de nuevo.');
    }
  }, [trip.id]);

  // Tiempo agotado -> se rechaza automáticamente
  useEffect(() => {
    if (secondsLeft === 0) handleReject();
  }, [secondsLeft, handleReject]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Nueva solicitud</Text>

        <View style={styles.timerWrap}>
          <View style={[styles.timer, secondsLeft <= 5 && styles.timerUrgent]}>
            <Text style={styles.timerNumber}>{secondsLeft}</Text>
            <Text style={styles.timerLabel}>seg</Text>
          </View>
        </View>

        <Card>
          <Text style={styles.pointLabel}>Recogida</Text>
          <Text style={styles.pointText}>{trip.origin?.address || '—'}</Text>
          <View style={styles.separator} />
          <Text style={styles.pointLabel}>Destino</Text>
          <Text style={styles.pointText}>{trip.destination?.address || '—'}</Text>
        </Card>

        <Card style={styles.details}>
          <InfoRow label="Distancia" value={formatKm(trip.distanceKm)} />
          <InfoRow label="Duración" value={formatMinutes(trip.durationMin)} />
          <InfoRow label="Categoría" value={categoryLabel(trip.category)} />
          <InfoRow label="Método de pago" value={paymentMethodLabel(trip.paymentMethod)} />
          <InfoRow label="Tarifa estimada" value={formatCOP(estimate.fare)} />
          <InfoRow label="Tu ganancia neta estimada" value={formatCOP(estimate.driverEarnings)} bold />
        </Card>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.rejectButton, busy && styles.disabled]} onPress={handleReject} disabled={busy}>
          <Text style={styles.rejectText}>Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[formStyles.button, styles.acceptButton, busy && styles.disabled]}
          onPress={handleAccept}
          disabled={busy}
        >
          {busy ? <ActivityIndicator color={colors.white} /> : <Text style={formStyles.buttonText}>Aceptar</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  timerWrap: { alignItems: 'center', marginVertical: 18 },
  timer: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerUrgent: { borderColor: colors.error },
  timerNumber: { fontSize: 32, fontWeight: '800', color: colors.text, lineHeight: 36 },
  timerLabel: { fontSize: 12, color: colors.muted },
  pointLabel: { fontSize: 12, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  pointText: { fontSize: 16, color: colors.text, marginTop: 2 },
  separator: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  details: { marginTop: 14 },
  error: { color: colors.error, fontSize: 13, marginTop: 12, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 8 },
  rejectButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 20,
    backgroundColor: colors.white,
  },
  rejectText: { color: colors.error, fontWeight: '700', fontSize: 16 },
  acceptButton: { flex: 2 },
  disabled: { opacity: 0.6 },
});
