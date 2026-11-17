// AI-assisted: see docs/AI_LOG.md #7
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Badge } from '../../components/ui';
import DateField from '../../components/DateField';
import { useDriverSession } from '../../context/DriverSessionContext';
import { fetchCompletedTrips } from '../../services/tripService';
import { PAYMENT_METHOD, TRIP_STATUS, categoryLabel, paymentStatusInfo } from '../../constants/trip';
import {
  endOfDay,
  formatCOP,
  formatDateTime,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from '../../utils/format';
import { colors } from '../../styles/formStyles';

const PAGE_SIZE = 20;

const PERIODS = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: 'range', label: 'Rango' },
];

const METHODS = [
  { key: 'all', label: 'Todos' },
  { key: PAYMENT_METHOD.MERCADO_PAGO, label: 'Mercado Pago' },
  { key: PAYMENT_METHOD.STRIPE, label: 'Stripe' },
  { key: PAYMENT_METHOD.CASH, label: 'Efectivo' },
];

function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// Pantalla 6: historial de carreras (FlatList, del más reciente al más antiguo, 20 por carga)
export default function HistoryScreen({ navigation }) {
  const { driverId } = useDriverSession();
  const [period, setPeriod] = useState('today');
  const [method, setMethod] = useState('all');
  const [rangeFrom, setRangeFrom] = useState(startOfWeek());
  const [rangeTo, setRangeTo] = useState(new Date());

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const lastDocRef = useRef(null);

  const rangeError = period === 'range' && startOfDay(rangeFrom) > endOfDay(rangeTo)
    ? 'La fecha inicial no puede ser posterior a la final'
    : '';

  // Fechas de la consulta según el filtro
  const { from, to } = useMemo(() => {
    const now = new Date();
    if (period === 'today') return { from: startOfDay(now), to: endOfDay(now) };
    if (period === 'week') return { from: startOfWeek(now), to: endOfDay(now) };
    if (period === 'month') return { from: startOfMonth(now), to: endOfDay(now) };
    return { from: startOfDay(rangeFrom), to: endOfDay(rangeTo) };
  }, [period, rangeFrom, rangeTo]);

  const loadFirstPage = useCallback(async () => {
    if (!driverId || rangeError) {
      setItems([]);
      setLoading(false);
      setHasMore(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const page = await fetchCompletedTrips(driverId, { from, to, pageSize: PAGE_SIZE });
      setItems(page.items);
      lastDocRef.current = page.lastDoc;
      setHasMore(page.hasMore);
    } catch (err) {
      console.log('Error al cargar el historial:', err);
      setItems([]);
      setHasMore(false);
      setError(
        err?.code === 'failed-precondition'
          ? 'Falta crear un índice en Firestore. Abre el enlace que aparece en la consola de Expo.'
          : 'No se pudo cargar el historial.'
      );
    } finally {
      setLoading(false);
    }
  }, [driverId, from, to, rangeError]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore || !lastDocRef.current) return;
    setLoadingMore(true);
    try {
      const page = await fetchCompletedTrips(driverId, {
        from,
        to,
        after: lastDocRef.current,
        pageSize: PAGE_SIZE,
      });
      setItems((prev) => [...prev, ...page.items]);
      lastDocRef.current = page.lastDoc;
      setHasMore(page.hasMore);
    } catch (err) {
      console.log('Error al cargar más viajes:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [driverId, from, to, loading, loadingMore, hasMore]);

  // Se recarga al abrir la pantalla y al cambiar el periodo o las fechas
  useFocusEffect(
    useCallback(() => {
      loadFirstPage();
    }, [loadFirstPage])
  );

  // El filtro por método de pago se aplica sobre los viajes cargados
  const visible = useMemo(
    () =>
      items.filter(
        (trip) =>
          (trip.status === TRIP_STATUS.COMPLETED || trip.status === TRIP_STATUS.PAID) &&
          (method === 'all' || trip.paymentMethod === method)
      ),
    [items, method]
  );

  const renderItem = ({ item }) => {
    const payment = paymentStatusInfo(item);
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('TripDetail', { tripId: item.id })}
      >
        <View style={styles.itemTop}>
          <Text style={styles.itemDate}>{formatDateTime(item.completedAt)}</Text>
          <Badge label={payment.label} tone={payment.tone} />
        </View>
        <Text style={styles.itemRoute} numberOfLines={2}>
          {item.origin?.address || 'Origen'} → {item.destination?.address || 'Destino'}
        </Text>
        <View style={styles.itemBottom}>
          <Text style={styles.itemMeta}>
            {categoryLabel(item.category)} · Tarifa {formatCOP(item.fare)}
          </Text>
          <Text style={styles.itemNet}>{formatCOP(item.driverEarnings)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const header = (
    <View style={styles.filters}>
      <View style={styles.chipRow}>
        {PERIODS.map((p) => (
          <Chip key={p.key} label={p.label} active={period === p.key} onPress={() => setPeriod(p.key)} />
        ))}
      </View>
      {period === 'range' && (
        <View>
          <DateField label="Desde" value={rangeFrom} onChange={setRangeFrom} onTouch={() => {}} error="" />
          <DateField label="Hasta" value={rangeTo} onChange={setRangeTo} onTouch={() => {}} error={rangeError} />
        </View>
      )}
      <View style={styles.chipRow}>
        {METHODS.map((m) => (
          <Chip key={m.key} label={m.label} active={method === m.key} onPress={() => setMethod(m.key)} />
        ))}
      </View>
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={visible}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={header}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <Text style={styles.empty}>No tienes viajes con este filtro.</Text>
        )
      }
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
        ) : hasMore && !loading ? (
          <TouchableOpacity style={styles.moreButton} onPress={loadMore}>
            <Text style={styles.moreText}>Cargar más</Text>
          </TouchableOpacity>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, paddingBottom: 40 },
  filters: { marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: colors.white },
  item: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemDate: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  itemRoute: { color: colors.text, fontSize: 15, fontWeight: '600', marginVertical: 8 },
  itemBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemMeta: { color: colors.muted, fontSize: 13, flexShrink: 1 },
  itemNet: { color: colors.success, fontSize: 17, fontWeight: '800' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 30 },
  error: { color: colors.error, textAlign: 'center', marginTop: 30 },
  moreButton: { alignItems: 'center', padding: 14 },
  moreText: { color: colors.primary, fontWeight: '700' },
});
