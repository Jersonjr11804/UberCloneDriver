// AI-assisted: see docs/AI_LOG.md #7
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Card, InfoRow } from '../../components/ui';
import {
  isGatewayConfigured,
  payWithMercadoPago,
  simulateApprovedPayment,
} from '../../services/paymentService';
import { markCashReceived } from '../../services/tripService';
import {
  PAYMENT_METHOD,
  TRIP_STATUS,
  categoryLabel,
  paymentMethodLabel,
  paymentStatusInfo,
} from '../../constants/trip';
import { formatCOP, formatKm, formatMinutes } from '../../utils/format';
import { colors, formStyles } from '../../styles/formStyles';

// Pantalla 4: cobro y resumen del viaje (también muestra viajes cancelados).
export default function TripSummary({ trip, onClose }) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isCancelled = trip.status === TRIP_STATUS.CANCELLED;
  const isPaid = trip.status === TRIP_STATUS.PAID;
  const isCash = trip.paymentMethod === PAYMENT_METHOD.CASH;
  const payment = paymentStatusInfo(trip);

  const handleCash = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      await markCashReceived(trip.id);
    } catch (err) {
      console.log('Error al registrar el cobro en efectivo:', err);
      setError('No se pudo registrar el cobro. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }, [trip.id]);

  // Mercado Pago: abre el checkout y, al cerrarlo, consulta el resultado
  const handlePay = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      await payWithMercadoPago(trip.id);
      // El estado del viaje cambia solo (tiempo real) cuando Mercado Pago confirma el pago
    } catch (err) {
      console.log('Error al cobrar con Mercado Pago:', err);
      setError(err?.message || 'No se pudo iniciar el pago. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }, [trip.id]);

  // SOLO PRUEBAS sin backend (ver paymentService.js)
  const handleSimulate = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      await simulateApprovedPayment(trip.id);
    } catch (err) {
      console.log('Error al simular el pago:', err);
      setError('No se pudo simular el pago.');
    } finally {
      setBusy(false);
    }
  }, [trip.id]);

  if (isCancelled) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.title}>Viaje cancelado</Text>
        <Text style={styles.subtitle}>
          {trip.cancelledBy === 'driver' ? 'Cancelaste este viaje.' : 'El pasajero canceló este viaje.'}
        </Text>
        <TouchableOpacity style={[formStyles.button, styles.fullButton]} onPress={onClose}>
          <Text style={formStyles.buttonText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{isPaid ? 'Viaje cobrado' : 'Viaje finalizado'}</Text>
        <Text style={styles.subtitle}>
          {formatKm(trip.distanceKm)} · {formatMinutes(trip.durationMin)} · {categoryLabel(trip.category)}
        </Text>

        <Card style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Tu ganancia neta</Text>
          <Text style={styles.earningsValue}>{formatCOP(trip.driverEarnings)}</Text>
        </Card>

        <Card style={styles.block}>
          <InfoRow label="Tarifa final" value={formatCOP(trip.fare)} />
          <InfoRow
            label={`Comisión (${Math.round((trip.commissionRate || 0) * 100)} %)`}
            value={`-${formatCOP(trip.commission)}`}
          />
          <InfoRow label="Propina" value={formatCOP(trip.tip)} />
          <InfoRow label="Método de pago" value={paymentMethodLabel(trip.paymentMethod)} />
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Estado del pago</Text>
            <Badge label={payment.label} tone={payment.tone} />
          </View>
        </Card>

        {/* Efectivo: el conductor confirma que recibió el dinero */}
        {isCash && !isPaid && (
          <View style={styles.block}>
            <Text style={styles.note}>
              Cobra {formatCOP((trip.fare || 0) + (trip.tip || 0))} al pasajero. Como la plataforma no
              recibe este dinero, la comisión se descuenta de tu saldo.
            </Text>
            <TouchableOpacity
              style={[formStyles.button, busy && styles.disabled]}
              onPress={handleCash}
              disabled={busy}
            >
              {busy ? <ActivityIndicator color={colors.white} /> : <Text style={formStyles.buttonText}>Cobro en efectivo recibido</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Mercado Pago (Checkout Pro) */}
        {!isCash && !isPaid && isGatewayConfigured && trip.paymentMethod === PAYMENT_METHOD.MERCADO_PAGO && (
          <View style={styles.block}>
            <Text style={styles.note}>
              El pasajero paga con tarjeta en el checkout de Mercado Pago. En modo de prueba usa una
              tarjeta de prueba. Al terminar, cierra la ventana para ver el resultado.
            </Text>
            <TouchableOpacity
              style={[formStyles.button, busy && styles.disabled]}
              onPress={handlePay}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={formStyles.buttonText}>
                  {trip.paymentStatus === 'rejected' ? 'Reintentar pago' : 'Cobrar con Mercado Pago'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Stripe (pendiente) o sin backend configurado: solo pruebas */}
        {!isCash && !isPaid && !(isGatewayConfigured && trip.paymentMethod === PAYMENT_METHOD.MERCADO_PAGO) && (
          <View style={styles.block}>
            <View style={styles.placeholder}>
              <Text style={styles.placeholderTitle}>Pasarela no disponible para este pago</Text>
              <Text style={styles.placeholderText}>
                {trip.paymentMethod === PAYMENT_METHOD.MERCADO_PAGO
                  ? 'Falta configurar EXPO_PUBLIC_PAYMENTS_API_URL en el .env.'
                  : `El pago con ${paymentMethodLabel(trip.paymentMethod)} todavía no está integrado.`}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.testButton, busy && styles.disabled]}
              onPress={handleSimulate}
              disabled={busy}
            >
              <Text style={styles.testButtonText}>Simular pago aprobado (solo pruebas)</Text>
            </TouchableOpacity>
          </View>
        )}

        {trip.rating ? (
          <Card style={styles.block}>
            <InfoRow label="Calificación del pasajero" value={`${'★'.repeat(trip.rating)}${'☆'.repeat(5 - trip.rating)}`} />
          </Card>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <TouchableOpacity style={[formStyles.button, styles.fullButton, styles.bottomButton]} onPress={onClose}>
        <Text style={formStyles.buttonText}>{isPaid ? 'Listo' : 'Cerrar y seguir conectado'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  earningsCard: { alignItems: 'center', backgroundColor: colors.primary, borderColor: colors.primary },
  earningsLabel: { color: colors.primarySoft, fontSize: 13, fontWeight: '600' },
  earningsValue: { color: colors.white, fontSize: 36, fontWeight: '800', marginTop: 2 },
  block: { marginTop: 14 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  statusLabel: { color: colors.muted, fontSize: 14 },
  note: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  placeholder: { backgroundColor: colors.warningSoft, borderRadius: 12, padding: 14 },
  placeholderTitle: { color: colors.warning, fontWeight: '800', fontSize: 14 },
  placeholderText: { color: colors.warning, fontSize: 13, marginTop: 4 },
  testButton: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
  },
  testButtonText: { color: colors.primary, fontWeight: '700' },
  fullButton: { alignSelf: 'stretch' },
  bottomButton: { marginHorizontal: 20, marginTop: 8 },
  disabled: { opacity: 0.6 },
  error: { color: colors.error, fontSize: 13, marginTop: 12, textAlign: 'center' },
});
