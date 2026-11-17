// AI-assisted: see docs/AI_LOG.md #6
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useDriverSession } from '../../context/DriverSessionContext';
import { colors, formStyles } from '../../styles/formStyles';

// Se muestra si no se pudo consultar si el conductor ya está registrado.
// No se manda al formulario de registro para no sobrescribir una cuenta existente.
export default function ProfileErrorScreen() {
  const { retryProfile, signOut } = useDriverSession();

  return (
    <View style={[formStyles.screen, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
      <Text style={formStyles.title}>No pudimos cargar tu cuenta</Text>
      <Text style={[formStyles.subtitle, { textAlign: 'center' }]}>
        Revisa tu conexión a internet e inténtalo de nuevo.
      </Text>
      <TouchableOpacity style={[formStyles.button, { alignSelf: 'stretch' }]} onPress={retryProfile}>
        <Text style={formStyles.buttonText}>Reintentar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={signOut} style={{ marginTop: 18 }}>
        <Text style={{ color: colors.primary, fontWeight: '700' }}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}
