// AI-assisted: see docs/AI_LOG.md #6
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FormField from '../../components/FormField';
import { signIn, signUp, authErrorMessage } from '../../services/authService';
import {
  hasErrors,
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateRequired,
} from '../../utils/validators';
import { APP_NAME } from '../../constants/options';
import { colors, formStyles } from '../../styles/formStyles';

// Pantalla principal: el conductor elige entre iniciar sesión o crear su cuenta.
// Los errores se muestran debajo de cada campo (no en un Alert).
export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const isRegister = mode === 'register';

  const errors = useMemo(
    () => ({
      email: validateEmail(email),
      password: isRegister
        ? validatePassword(password)
        : validateRequired(password, 'La contraseña es obligatoria'),
      confirm: isRegister ? validateConfirmPassword(password, confirm) : '',
    }),
    [email, password, confirm, isRegister]
  );

  const touch = useCallback((field) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }, []);

  const changeMode = useCallback((next) => {
    setMode(next);
    setTouched({});
    setFormError('');
    setPassword('');
    setConfirm('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setTouched({ email: true, password: true, confirm: true });
    setFormError('');
    if (hasErrors(errors)) return;

    setSubmitting(true);
    try {
      // Al iniciar sesión o crear la cuenta, la navegación cambia sola
      // (la sesión se escucha en DriverSessionContext).
      if (isRegister) await signUp(email, password);
      else await signIn(email, password);
    } catch (error) {
      console.log('Error de autenticación:', error?.code || error);
      setFormError(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }, [submitting, errors, isRegister, email, password]);

  const shown = (field) => (touched[field] ? errors[field] : '');

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.hero, { paddingTop: insets.top + 36 }]}>
          <View style={styles.logo}>
            <Ionicons name="car-sport" size={38} color={colors.primary} />
          </View>
          <Text style={styles.brand}>{APP_NAME}</Text>
          <Text style={styles.tagline}>Maneja cuando quieras y gana con cada viaje</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.segment}>
            <TouchableOpacity
              style={[styles.segmentItem, !isRegister && styles.segmentActive]}
              onPress={() => changeMode('login')}
            >
              <Text style={[styles.segmentText, !isRegister && styles.segmentTextActive]}>
                Iniciar sesión
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentItem, isRegister && styles.segmentActive]}
              onPress={() => changeMode('register')}
            >
              <Text style={[styles.segmentText, isRegister && styles.segmentTextActive]}>
                Registrarme
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.heading}>{isRegister ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</Text>
          <Text style={styles.subheading}>
            {isRegister
              ? 'Después completarás tus datos de conductor y vehículo'
              : 'Inicia sesión para continuar'}
          </Text>

          <FormField
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            onBlur={() => touch('email')}
            error={shown('email')}
            placeholder="nombre@dominio.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormField
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            onBlur={() => touch('password')}
            error={shown('password')}
            placeholder={isRegister ? 'Mínimo 8 caracteres, letras y números' : 'Tu contraseña'}
            autoCapitalize="none"
            secureTextEntry
          />
          {isRegister && (
            <FormField
              label="Confirmar contraseña"
              value={confirm}
              onChangeText={setConfirm}
              onBlur={() => touch('confirm')}
              error={shown('confirm')}
              placeholder="Repite tu contraseña"
              autoCapitalize="none"
              secureTextEntry
            />
          )}

          {formError ? (
            <View style={styles.formError}>
              <Text style={styles.formErrorText}>{formError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[formStyles.button, styles.submit, submitting && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={formStyles.buttonText}>
                {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchRow}
            onPress={() => changeMode(isRegister ? 'login' : 'register')}
          >
            <Text style={styles.switchText}>
              {isRegister ? '¿Ya tienes cuenta? ' : '¿Aún no tienes cuenta? '}
              <Text style={styles.switchLink}>{isRegister ? 'Inicia sesión' : 'Regístrate'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  hero: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 64,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  brand: { fontSize: 30, fontWeight: '800', color: colors.white },
  tagline: { fontSize: 14, color: colors.primarySoft, marginTop: 6, textAlign: 'center' },
  card: {
    marginTop: -36,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  segmentItem: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { fontWeight: '700', color: colors.muted },
  segmentTextActive: { color: colors.white },
  heading: { fontSize: 22, fontWeight: '800', color: colors.text },
  subheading: { fontSize: 14, color: colors.muted, marginTop: 2, marginBottom: 20 },
  formError: {
    backgroundColor: colors.errorSoft,
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
  },
  formErrorText: { color: colors.error, fontSize: 13, fontWeight: '600' },
  submit: { marginTop: 12 },
  submitDisabled: { opacity: 0.6 },
  switchRow: { alignItems: 'center', marginTop: 18 },
  switchText: { color: colors.muted, fontSize: 14 },
  switchLink: { color: colors.primary, fontWeight: '800' },
});
