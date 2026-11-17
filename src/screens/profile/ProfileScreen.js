// AI-assisted: see docs/AI_LOG.md #7
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FormField from '../../components/FormField';
import SelectField from '../../components/SelectField';
import { Badge, Card, InfoRow } from '../../components/ui';
import { useDriverSession } from '../../context/DriverSessionContext';
import useDriverProfile from '../../hooks/useDriverProfile';
import useSignOut from '../../hooks/useSignOut';
import { updateDriverProfile } from '../../services/profileService';
import { ACCOUNT_STATUS, LANGUAGES, VEHICLE_COLORS } from '../../constants/options';
import { categoryLabel } from '../../constants/trip';
import { formatDate, toDate } from '../../utils/format';
import { hasErrors, validateFullName, validatePhone, validateRequired } from '../../utils/validators';
import { colors, formStyles } from '../../styles/formStyles';

const LANGUAGE_KEY = 'uberclone:language'; // preferencia guardada en AsyncStorage (no es un dato sensible)

const STATUS_INFO = {
  [ACCOUNT_STATUS.APPROVED]: { label: 'Aprobada', tone: 'success' },
  [ACCOUNT_STATUS.PENDING]: { label: 'Pendiente de aprobación', tone: 'warning' },
  [ACCOUNT_STATUS.REJECTED]: { label: 'Rechazada', tone: 'error' },
};

const docStatus = (expiresAt) => {
  const date = toDate(expiresAt);
  if (!date) return { text: '—', tone: 'info' };
  return date.getTime() > Date.now()
    ? { text: `Vence ${formatDate(date)}`, tone: 'success' }
    : { text: `Vencido ${formatDate(date)}`, tone: 'error' };
};

function DocRow({ label, expiresAt }) {
  const info = docStatus(expiresAt);
  return (
    <View style={styles.docRow}>
      <Text style={styles.docLabel}>{label}</Text>
      <Badge label={info.text} tone={info.tone} />
    </View>
  );
}

// Pantalla 7: perfil y configuración
export default function ProfileScreen() {
  const { driverId } = useDriverSession();
  const { profile, loading } = useDriverProfile(driverId);
  const signOut = useSignOut();

  const [form, setForm] = useState({ fullName: '', phone: '', language: 'es', color: '' });
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const loadedRef = useRef(false);

  // Se llena el formulario una sola vez con los datos guardados
  useEffect(() => {
    if (!profile || loadedRef.current) return;
    loadedRef.current = true;
    setForm({
      fullName: profile.personal?.fullName || '',
      phone: profile.personal?.phone || '',
      language: profile.personal?.language || 'es',
      color: profile.vehicle?.color || '',
    });
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((stored) => stored && setForm((prev) => ({ ...prev, language: stored })))
      .catch(() => {});
  }, [profile]);

  const errors = {
    fullName: validateFullName(form.fullName),
    phone: validatePhone(form.phone),
    language: validateRequired(form.language, 'Selecciona un idioma'),
    color: validateRequired(form.color, 'Selecciona un color'),
  };

  const setField = (field) => (value) => {
    setMessage({ type: '', text: '' });
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const touch = (field) => () => setTouched((prev) => ({ ...prev, [field]: true }));
  const shown = (field) => (touched[field] ? errors[field] : '');

  const handleSave = useCallback(async () => {
    setTouched({ fullName: true, phone: true, language: true, color: true });
    if (hasErrors(errors)) return;
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await updateDriverProfile(driverId, form);
      await AsyncStorage.setItem(LANGUAGE_KEY, form.language);
      setMessage({ type: 'ok', text: 'Cambios guardados' });
    } catch (err) {
      console.log('Error al guardar el perfil:', err);
      setMessage({ type: 'error', text: 'No se pudieron guardar los cambios. Inténtalo de nuevo.' });
    } finally {
      setSaving(false);
    }
  }, [driverId, form, errors]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !profile) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;
  }

  const status = STATUS_INFO[profile.accountStatus] || { label: profile.accountStatus, tone: 'info' };
  const vehicle = profile.vehicle || {};
  const docs = profile.documents || {};

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {profile.personal?.photoUrl ? (
          <Image source={{ uri: profile.personal.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarEmpty]} />
        )}
        <Text style={styles.name}>{profile.personal?.fullName}</Text>
        <Text style={styles.email}>{profile.personal?.email}</Text>
        <Badge label={status.label} tone={status.tone} />
      </View>

      <Text style={styles.section}>Datos editables</Text>
      <FormField
        label="Nombre completo"
        value={form.fullName}
        onChangeText={setField('fullName')}
        onBlur={touch('fullName')}
        error={shown('fullName')}
        maxLength={50}
        autoCapitalize="words"
      />
      <FormField
        label="Número de celular"
        value={form.phone}
        onChangeText={(t) => setField('phone')(t.replace(/\D/g, ''))}
        onBlur={touch('phone')}
        error={shown('phone')}
        keyboardType="number-pad"
        maxLength={10}
      />
      <SelectField label="Idioma" value={form.language} options={LANGUAGES} onChange={setField('language')} error={shown('language')} />
      <SelectField label="Color del vehículo" value={form.color} options={VEHICLE_COLORS} onChange={setField('color')} error={shown('color')} />

      {message.text ? (
        <Text style={message.type === 'ok' ? styles.ok : styles.error}>{message.text}</Text>
      ) : null}

      <TouchableOpacity style={[formStyles.button, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.white} /> : <Text style={formStyles.buttonText}>Guardar cambios</Text>}
      </TouchableOpacity>

      <Text style={styles.section}>Vehículo</Text>
      <Card>
        <InfoRow label="Placa" value={vehicle.plate || '—'} />
        <InfoRow label="Vehículo" value={`${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.year || ''}`.trim() || '—'} />
        <InfoRow label="Categoría" value={categoryLabel(vehicle.category)} />
        <InfoRow label="Capacidad" value={`${vehicle.capacity || '—'} pasajeros`} />
      </Card>

      <Text style={styles.section}>Documentos</Text>
      <Card>
        <DocRow label="Licencia de conducción" expiresAt={docs.license?.expiresAt} />
        <DocRow label="SOAT" expiresAt={docs.soat?.expiresAt} />
        {docs.techReview ? (
          <DocRow label="Revisión técnico-mecánica" expiresAt={docs.techReview.expiresAt} />
        ) : (
          <View style={styles.docRow}>
            <Text style={styles.docLabel}>Revisión técnico-mecánica</Text>
            <Text style={styles.docNone}>No aplica</Text>
          </View>
        )}
      </Card>

      <Text style={styles.note}>
        Comisión de la plataforma aceptada: {Math.round((profile.commissionRateAccepted || 0) * 100)} %. Para
        cambiar documentos o la placa, contacta a soporte.
      </Text>

      <TouchableOpacity style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48 },
  header: { alignItems: 'center', gap: 6, marginBottom: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surface },
  avatarEmpty: { borderWidth: 1, borderColor: colors.border },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 6 },
  email: { color: colors.muted, fontSize: 14 },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 24, marginBottom: 12 },
  docRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, gap: 8 },
  docLabel: { color: colors.text, fontSize: 14, flexShrink: 1 },
  docNone: { color: colors.muted, fontSize: 13 },
  note: { color: colors.muted, fontSize: 12, marginTop: 16, lineHeight: 17 },
  ok: { color: colors.success, fontWeight: '700', marginBottom: 4 },
  error: { color: colors.error, fontSize: 13, marginBottom: 4 },
  signOut: {
    marginTop: 28,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  signOutText: { color: colors.error, fontWeight: '800' },
});
