// AI-assisted: see docs/AI_LOG.md #7
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../styles/formStyles';

const TONES = {
  success: { bg: '#E6F6EC', fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  error: { bg: colors.errorSoft, fg: colors.error },
  info: { bg: colors.primarySoft, fg: colors.primary },
};

// Etiqueta de color (estado de pago, estado de documentos...)
export function Badge({ label, tone = 'info' }) {
  const palette = TONES[tone] || TONES.info;
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

// Fila "etiqueta ........ valor"
export function InfoRow({ label, value, bold = false }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowValueBold]}>{value}</Text>
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, gap: 12 },
  rowLabel: { color: colors.muted, fontSize: 14, flexShrink: 1 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  rowValueBold: { fontSize: 16, fontWeight: '800', color: colors.primary },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
