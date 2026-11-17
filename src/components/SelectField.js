// AI-assisted: see docs/AI_LOG.md #1
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../styles/formStyles';

export default function SelectField({ label, value, options, onChange, error }) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.pickerBox, error ? styles.pickerError : null]}>
        <Picker selectedValue={value} onValueChange={onChange}>
          <Picker.Item label="Selecciona una opción" value="" color={colors.muted} />
          {options.map((opt) => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
          ))}
        </Picker>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  pickerBox: {
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 10,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  pickerError: { borderColor: colors.error, backgroundColor: colors.errorSoft },
  error: { color: colors.error, fontSize: 12, marginTop: 4 },
});
