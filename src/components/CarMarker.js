// AI-assisted: see docs/AI_LOG.md #9
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/formStyles';

// El carro del conductor sobre el mapa
export default function CarMarker({ coordinate }) {
  // Se redibuja la vista solo al inicio; después solo se mueve la coordenada (más fluido)
  const [track, setTrack] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setTrack(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={track} zIndex={10}>
      <View style={styles.car}>
        <Ionicons name="car-sport" size={20} color={colors.white} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  car: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
});
