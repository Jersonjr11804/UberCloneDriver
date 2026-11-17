// AI-assisted: see docs/AI_LOG.md #6
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../styles/formStyles';

const formatDate = (date) => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
};

const getTomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
};

// futureOnly: para fechas de vencimiento (solo se pueden elegir fechas posteriores a hoy)
export default function DateField({ label, value, onChange, onTouch, error, futureOnly = false }) {
  const [show, setShow] = useState(false);
  const defaultDate = futureOnly ? getTomorrow() : new Date(2000, 0, 1);

  // Se llama al elegir una fecha (en iOS, cada vez que se mueve el spinner)
  const handleValueChange = (event, selected) => {
    if (Platform.OS === 'android') {
      // En Android el selector es un diálogo: se cierra solo al elegir
      setShow(false);
      onTouch();
    }
    if (selected) onChange(selected);
  };

  // Se llama al cancelar el diálogo (Android)
  const handleDismiss = () => {
    setShow(false);
    onTouch();
  };

  // iOS: botón "Listo"
  const handleClose = () => {
    // Si el usuario no movió el selector, se toma la fecha que se estaba mostrando
    if (!value) onChange(defaultDate);
    setShow(false);
    onTouch();
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, error ? styles.inputError : null]}
        onPress={() => setShow((prev) => !prev)}
      >
        <Text style={value ? styles.valueText : styles.placeholder}>
          {value ? formatDate(value) : 'Seleccionar fecha'}
        </Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value || defaultDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={futureOnly ? getTomorrow() : undefined}
          maximumDate={futureOnly ? undefined : new Date()}
          onValueChange={handleValueChange}
          onDismiss={handleDismiss}
        />
      )}
      {show && Platform.OS === 'ios' && (
        <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
          <Text style={styles.doneText}>Listo</Text>
        </TouchableOpacity>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: colors.surface,
  },
  inputError: { borderColor: colors.error, backgroundColor: colors.errorSoft },
  valueText: { color: colors.text, fontSize: 16 },
  placeholder: { color: colors.muted, fontSize: 16 },
  doneButton: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 12 },
  doneText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  error: { color: colors.error, fontSize: 12, marginTop: 4 },
});
