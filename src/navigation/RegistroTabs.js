// AI-assisted: see docs/AI_LOG.md #1
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useDriverSession } from '../context/DriverSessionContext';
import { RegistrationProvider } from '../context/RegistrationContext';
import PersonalDataScreen from '../screens/registro/PersonalDataScreen';
import VehicleScreen from '../screens/registro/VehicleScreen';
import DocumentsScreen from '../screens/registro/DocumentsScreen';
import { colors } from '../styles/formStyles';

const Tab = createBottomTabNavigator();

const icons = {
  Personales: 'person-outline',
  Vehiculo: 'car-outline',
  Documentos: 'document-text-outline',
};

export default function RegistroTabs() {
  const { signOut } = useDriverSession();

  return (
    <RegistrationProvider>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerTitle: 'Registro de conductor',
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity onPress={signOut} style={{ paddingHorizontal: 16 }}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Salir</Text>
            </TouchableOpacity>
          ),
          headerTitleStyle: { fontWeight: '800', color: colors.text },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
          tabBarLabelStyle: { fontWeight: '600' },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={icons[route.name]} size={size} color={color} />
          ),
        })}
      >
        <Tab.Screen
          name="Personales"
          component={PersonalDataScreen}
          options={{ tabBarLabel: 'Datos personales' }}
        />
        <Tab.Screen
          name="Vehiculo"
          component={VehicleScreen}
          options={{ tabBarLabel: 'Vehículo' }}
        />
        <Tab.Screen
          name="Documentos"
          component={DocumentsScreen}
          options={{ tabBarLabel: 'Documentos' }}
        />
      </Tab.Navigator>
    </RegistrationProvider>
  );
}
