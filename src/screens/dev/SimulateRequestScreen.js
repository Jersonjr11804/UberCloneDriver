// AI-assisted: see docs/AI_LOG.md #7, #9
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import SelectField from '../../components/SelectField';
import { useDriverSession } from '../../context/DriverSessionContext';
import { useTrip } from '../../context/TripContext';
import { createSimulatedRequest } from '../../services/simulationService';
import { CATEGORIES } from '../../constants/options';
import { PAYMENT_METHODS } from '../../constants/trip';
import { colors, formStyles } from '../../styles/formStyles';

// Como todavía no existe la app del pasajero, las solicitudes se simulan.
// Normalmente llegan solas al ponerte Disponible; desde aquí puedes crear una a mano.
export default function SimulateRequestScreen() {
  const { driverId } = useDriverSession();
  const { autoRequests, setAutoRequests } = useTrip();
  const [category, setCategory] = useState('economy');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleCreate = useCallback(async () => {
    if (!category || !paymentMethod) {
      setMessage({ type: 'error', text: 'Elige la categoría y el método de pago.' });
      return;
    }
    setBusy(true);
    setMessage({ type: '', text: '' });
    try {
      await createSimulatedRequest(driverId, { category, paymentMethod });
      setMessage({
        type: 'ok',
        text: 'Solicitud creada. Si estás Disponible, llegará en unos segundos (tienes 15 s para aceptarla).',
      });
    } catch (err) {
      console.log('Error al crear la solicitud de prueba:', err);
      setMessage({
        type: 'error',
        text:
          err?.code === 'permission-denied'
            ? 'Firestore rechazó la escritura. Revisa las reglas de la colección trips.'
            : `No se pudo crear la solicitud: ${err?.message || 'error desconocido'}`,
      });
    } finally {
      setBusy(false);
    }
  }, [driverId, category, paymentMethod]);

  return (
    <ScrollView style={formStyles.screen} contentContainerStyle={formStyles.container}>
      <Text style={formStyles.title}>Solicitudes de prueba</Text>
      <Text style={formStyles.subtitle}>
        Sin app de pasajero, las solicitudes se simulan para probar el flujo completo.
      </Text>

      <View style={styles.autoRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.autoTitle}>Solicitudes automáticas</Text>
          <Text style={styles.autoText}>
            Llegan solas mientras estés Disponible y sin viaje en curso.
          </Text>
        </View>
        <Switch
          value={autoRequests}
          onValueChange={setAutoRequests}
          trackColor={{ false: colors.border, true: colors.success }}
        />
      </View>

      <Text style={styles.section}>Crear una solicitud ahora</Text>
      <SelectField label="Categoría" value={category} options={CATEGORIES} onChange={setCategory} />
      <SelectField label="Método de pago" value={paymentMethod} options={PAYMENT_METHODS} onChange={setPaymentMethod} />

      {message.text ? <Text style={message.type === 'ok' ? styles.ok : styles.error}>{message.text}</Text> : null}

      <TouchableOpacity style={[formStyles.button, busy && { opacity: 0.6 }]} onPress={handleCreate} disabled={busy}>
        {busy ? <ActivityIndicator color={colors.white} /> : <Text style={formStyles.buttonText}>Crear solicitud</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  autoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
  },
  autoTitle: { fontWeight: '800', color: colors.text, fontSize: 15 },
  autoText: { color: colors.muted, fontSize: 12, marginTop: 2 },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 12 },
  ok: { color: colors.success, fontWeight: '600', marginBottom: 4 },
  error: { color: colors.error, fontSize: 13, marginBottom: 4 },
});
