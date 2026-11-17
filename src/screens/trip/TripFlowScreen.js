// AI-assisted: see docs/AI_LOG.md #7
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTrip } from '../../context/TripContext';
import IncomingRequest from './IncomingRequest';
import ActiveTrip from './ActiveTrip';
import TripSummary from './TripSummary';
import { TRIP_STATUS } from '../../constants/trip';
import { colors } from '../../styles/formStyles';

// El campo `status` del viaje controla qué pantalla se muestra:
//   requested                               -> Solicitud entrante
//   accepted / driver_arriving / in_progress -> Viaje en curso
//   completed / paid / cancelled            -> Cobro y resumen
export default function TripFlowScreen({ navigation }) {
  const { trip, dismissTrip } = useTrip();
  const status = trip?.status;

  // Una solicitud rechazada (o vencida) se cierra sola
  useEffect(() => {
    if (status === TRIP_STATUS.REJECTED) dismissTrip();
  }, [status, dismissTrip]);

  // Sin viaje activo se vuelve al Inicio
  useEffect(() => {
    if (!trip && navigation.canGoBack()) navigation.goBack();
  }, [trip, navigation]);

  if (!trip || status === TRIP_STATUS.REJECTED) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  switch (status) {
    case TRIP_STATUS.REQUESTED:
      return <IncomingRequest trip={trip} />;
    case TRIP_STATUS.ACCEPTED:
    case TRIP_STATUS.DRIVER_ARRIVING:
    case TRIP_STATUS.IN_PROGRESS:
      return <ActiveTrip trip={trip} />;
    default:
      return <TripSummary trip={trip} onClose={dismissTrip} />;
  }
}
