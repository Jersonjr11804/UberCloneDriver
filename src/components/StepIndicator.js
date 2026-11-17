// AI-assisted: see docs/AI_LOG.md #3
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/formStyles';

export default function StepIndicator({ current, total = 3 }) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        Paso {current} de {total}
      </Text>
      <View style={styles.bars}>
        {Array.from({ length: total }).map((_, index) => (
          <View key={index} style={[styles.bar, index < current && styles.barActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  bars: { flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  barActive: { backgroundColor: colors.primary },
});
