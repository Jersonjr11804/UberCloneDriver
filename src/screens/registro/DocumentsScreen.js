// AI-assisted: see docs/AI_LOG.md #2
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FormField from '../../components/FormField';
import DateField from '../../components/DateField';
import ImageField from '../../components/ImageField';
import StepIndicator from '../../components/StepIndicator';
import { useRegistration } from '../../context/RegistrationContext';
import { COMMISSION_RATE } from '../../constants/options';
import { colors, formStyles } from '../../styles/formStyles';

export default function DocumentsScreen() {
  const {
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
    submitRegistration,
    finishRegistration,
  } = useRegistration();

  const commissionPercent = Math.round(COMMISSION_RATE * 100);
  const sending = submitState.status === 'sending';

  // Lista de pestañas que aún tienen datos pendientes o inválidos
  const pendingTabs = useMemo(() => {
    const list = [];
    if (!isPersonalValid) list.push('Datos personales');
    if (!isVehicleValid) list.push('Vehículo');
    if (!isDocumentsValid) list.push('Documentos');
    return list;
  }, [isPersonalValid, isVehicleValid, isDocumentsValid]);

  // Registro enviado: la cuenta queda Pendiente de aprobación
  if (submitState.status === 'done') {
    return (
      <View style={[formStyles.screen, styles.center]}>
        <Text style={formStyles.title}>Registro enviado</Text>
        <Text style={styles.statusLabel}>Estado de la cuenta</Text>
        <Text style={styles.statusPending}>Pendiente de aprobación</Text>
        <Text style={styles.statusInfo}>
          No podrás ponerte Disponible hasta que tu cuenta sea aprobada.
        </Text>
        <TouchableOpacity style={[formStyles.button, styles.homeButton]} onPress={finishRegistration}>
          <Text style={formStyles.buttonText}>Ir al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={formStyles.screen}
      contentContainerStyle={formStyles.container}
      keyboardShouldPersistTaps="handled"
    >
      <StepIndicator current={3} />
      <Text style={formStyles.title}>Documentos y pagos</Text>
      <Text style={formStyles.subtitle}>Todos los campos son obligatorios</Text>

      <Text style={styles.section}>Licencia de conducción</Text>
      <FormField
        label="Número de licencia"
        value={data.licenseNumber}
        onChangeText={(text) => updateField('licenseNumber', text)}
        onBlur={() => touchField('licenseNumber')}
        error={visibleErrors.licenseNumber}
        placeholder="Número de la licencia"
        maxLength={20}
        autoCapitalize="characters"
      />
      <ImageField
        label="Foto de la licencia"
        uri={data.licensePhoto}
        onChange={(uri) => updateField('licensePhoto', uri)}
        onTouch={() => touchField('licensePhoto')}
        error={visibleErrors.licensePhoto}
        aspect={[4, 3]}
      />
      <DateField
        label="Fecha de vencimiento de la licencia"
        value={data.licenseExpiry}
        onChange={(date) => updateField('licenseExpiry', date)}
        onTouch={() => touchField('licenseExpiry')}
        error={visibleErrors.licenseExpiry}
        futureOnly
      />

      <Text style={styles.section}>SOAT</Text>
      <ImageField
        label="Foto del SOAT"
        uri={data.soatPhoto}
        onChange={(uri) => updateField('soatPhoto', uri)}
        onTouch={() => touchField('soatPhoto')}
        error={visibleErrors.soatPhoto}
        aspect={[4, 3]}
      />
      <DateField
        label="Fecha de vencimiento del SOAT"
        value={data.soatExpiry}
        onChange={(date) => updateField('soatExpiry', date)}
        onTouch={() => touchField('soatExpiry')}
        error={visibleErrors.soatExpiry}
        futureOnly
      />

      <Text style={styles.section}>Revisión técnico-mecánica</Text>
      {techRequired ? (
        <>
          <ImageField
            label="Foto de la revisión técnico-mecánica"
            uri={data.techPhoto}
            onChange={(uri) => updateField('techPhoto', uri)}
            onTouch={() => touchField('techPhoto')}
            error={visibleErrors.techPhoto}
            aspect={[4, 3]}
          />
          <DateField
            label="Fecha de vencimiento de la revisión"
            value={data.techExpiry}
            onChange={(date) => updateField('techExpiry', date)}
            onTouch={() => touchField('techExpiry')}
            error={visibleErrors.techExpiry}
            futureOnly
          />
        </>
      ) : (
        <Text style={styles.note}>
          No aplica: según el año de tu vehículo todavía no la necesitas.
        </Text>
      )}

      <Text style={styles.section}>Pagos</Text>
      <FormField
        label="Correo de la cuenta de Mercado Pago"
        value={data.mercadoPagoEmail}
        onChangeText={(text) => updateField('mercadoPagoEmail', text)}
        onBlur={() => touchField('mercadoPagoEmail')}
        error={visibleErrors.mercadoPagoEmail}
        placeholder="correo@dominio.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text style={styles.note}>
        No guardamos números de cuenta ni de tarjeta: los datos sensibles los maneja la pasarela
        de pago.
      </Text>

      <View style={styles.termsRow}>
        <Switch
          trackColor={{ false: colors.border, true: colors.success }}
          value={data.acceptedTerms}
          onValueChange={(value) => {
            updateField('acceptedTerms', value);
            touchField('acceptedTerms');
          }}
        />
        <Text style={styles.termsText}>
          Acepto los términos y condiciones. La plataforma cobra una comisión del{' '}
          {commissionPercent}% sobre la tarifa de cada viaje.
        </Text>
      </View>
      {visibleErrors.acceptedTerms ? (
        <Text style={styles.error}>{visibleErrors.acceptedTerms}</Text>
      ) : null}

      {pendingTabs.length > 0 && (
        <Text style={styles.pending}>
          Para enviar, completa: {pendingTabs.join(', ')}.
        </Text>
      )}
      {submitState.status === 'error' && (
        <Text style={styles.error}>{submitState.message}</Text>
      )}

      <TouchableOpacity
        style={[formStyles.button, (!isFormValid || sending) && styles.buttonDisabled]}
        onPress={submitRegistration}
        disabled={!isFormValid || sending}
      >
        {sending ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={formStyles.buttonText}>Enviar registro</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  section: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 10,
  },
  note: { fontSize: 12, color: colors.muted, marginBottom: 14 },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  termsText: { flex: 1, fontSize: 13, color: colors.text },
  error: { color: colors.error, fontSize: 12, marginTop: 6 },
  pending: { color: colors.muted, fontSize: 13, marginTop: 14 },
  buttonDisabled: { opacity: 0.4 },
  statusLabel: { fontSize: 13, color: colors.muted, marginTop: 12 },
  statusPending: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.warning,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
  },
  homeButton: { alignSelf: 'stretch', marginTop: 28 },
  statusInfo: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 12 },
});
