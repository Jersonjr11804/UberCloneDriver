// AI-assisted: see docs/AI_LOG.md #7
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '../../components/ui';
import { useDriverSession } from '../../context/DriverSessionContext';
import useEarnings from '../../hooks/useEarnings';
import { formatCOP } from '../../utils/format';
import { colors } from '../../styles/formStyles';

const PERIODS = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
];

function Metric({ label, value, highlight }) {
  return (
    <View style={[styles.metric, highlight && styles.metricHighlight]}>
      <Text style={[styles.metricLabel, highlight && styles.metricLabelHighlight]}>{label}</Text>
      <Text style={[styles.metricValue, highlight && styles.metricValueHighlight]}>{value}</Text>
    </View>
  );
}

// Pantalla 5: ganancias del día, la semana y el mes (calculadas con useMemo en useEarnings)
export default function EarningsScreen() {
  const { driverId } = useDriverSession();
  const { stats, balance, loading, error, refresh } = useEarnings(driverId);
  const [period, setPeriod] = useState('today');

  // Al volver a la pantalla se recargan los datos
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const current = stats[period];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
    >
      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Tu saldo</Text>
        <Text style={[styles.balanceValue, balance < 0 && styles.balanceNegative]}>{formatCOP(balance)}</Text>
        <Text style={styles.balanceHint}>
          Ganancias de viajes pagados por la pasarela menos las comisiones de los viajes en efectivo.
          Puede quedar en negativo.
        </Text>
      </Card>

      <View style={styles.segment}>
        {PERIODS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.segmentItem, period === item.key && styles.segmentActive]}
            onPress={() => setPeriod(item.key)}
          >
            <Text style={[styles.segmentText, period === item.key && styles.segmentTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && !error ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} /> : null}

      <View style={styles.grid}>
        <Metric label="Ganancia neta" value={formatCOP(current.net)} highlight />
        <Metric label="Viajes" value={String(current.trips)} />
        <Metric label="Total facturado" value={formatCOP(current.billed)} />
        <Metric label="Comisiones" value={formatCOP(current.commissions)} />
        <Metric label="Propinas" value={formatCOP(current.tips)} />
        <Metric label="Promedio por viaje" value={formatCOP(current.average)} />
      </View>

      {!loading && !error && current.trips === 0 ? (
        <Text style={styles.empty}>Aún no tienes viajes en este periodo.</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 20, paddingBottom: 40 },
  balanceCard: { alignItems: 'center' },
  balanceLabel: { color: colors.muted, fontWeight: '600' },
  balanceValue: { fontSize: 34, fontWeight: '800', color: colors.success, marginVertical: 4 },
  balanceNegative: { color: colors.error },
  balanceHint: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 4,
    marginVertical: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentItem: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { fontWeight: '700', color: colors.muted },
  segmentTextActive: { color: colors.white },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricHighlight: { backgroundColor: colors.primary, borderColor: colors.primary },
  metricLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  metricLabelHighlight: { color: colors.primarySoft },
  metricValue: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 4 },
  metricValueHighlight: { color: colors.white },
  error: { color: colors.error, textAlign: 'center', marginBottom: 10 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 20 },
});
