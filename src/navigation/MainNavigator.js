// AI-assisted: see docs/AI_LOG.md #7
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
  createDrawerNavigator,
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TripProvider, useTrip } from '../context/TripContext';
import { useDriverSession } from '../context/DriverSessionContext';
import useDriverProfile from '../hooks/useDriverProfile';
import useSignOut from '../hooks/useSignOut';
import HomeScreen from '../screens/home/HomeScreen';
import TripFlowScreen from '../screens/trip/TripFlowScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import TripDetailScreen from '../screens/history/TripDetailScreen';
import EarningsScreen from '../screens/earnings/EarningsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SimulateRequestScreen from '../screens/dev/SimulateRequestScreen';
import { APP_NAME } from '../constants/options';
import { colors } from '../styles/formStyles';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// El Inicio (HomeScreen) no se modifica: aquí solo se le agrega el botón que abre el menú.
function HomeWithMenu({ navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <HomeScreen />
      <TouchableOpacity
        style={[styles.menuButton, { top: insets.top + 12 }]}
        onPress={() => navigation.openDrawer()}
      >
        <Ionicons name="menu" size={22} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

function DrawerContent(props) {
  const { driverId } = useDriverSession();
  const { profile } = useDriverProfile(driverId);
  const signOut = useSignOut();
  const insets = useSafeAreaInsets();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
      <View style={[styles.drawerHeader, { paddingTop: insets.top + 20 }]}>
        {profile?.personal?.photoUrl ? (
          <Image source={{ uri: profile.personal.photoUrl }} style={styles.drawerAvatar} />
        ) : (
          <View style={[styles.drawerAvatar, { backgroundColor: colors.primarySoft }]} />
        )}
        <Text style={styles.drawerName} numberOfLines={1}>
          {profile?.personal?.fullName || APP_NAME}
        </Text>
        <Text style={styles.drawerPlate}>{profile?.vehicle?.plate || ''}</Text>
      </View>
      <View style={{ paddingTop: 8 }}>
        <DrawerItemList {...props} />
        <DrawerItem
          label="Cerrar sesión"
          labelStyle={{ color: colors.error, fontWeight: '700' }}
          icon={({ size }) => <Ionicons name="log-out-outline" size={size} color={colors.error} />}
          onPress={signOut}
        />
      </View>
    </DrawerContentScrollView>
  );
}

const icon = (name) => ({ color, size }) => <Ionicons name={name} size={size} color={color} />;

// Drawer: perfil, historial, ganancias y configuración
function DriverDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTitleStyle: { fontWeight: '800', color: colors.text },
        headerTintColor: colors.primary,
        drawerActiveTintColor: colors.primary,
        drawerActiveBackgroundColor: colors.primarySoft,
        drawerInactiveTintColor: colors.text,
      }}
    >
      <Drawer.Screen
        name="Inicio"
        component={HomeWithMenu}
        options={{ headerShown: false, swipeEnabled: false, drawerIcon: icon('map-outline') }}
      />
      <Drawer.Screen
        name="Historial"
        component={HistoryScreen}
        options={{ title: 'Historial de carreras', drawerLabel: 'Historial', drawerIcon: icon('time-outline') }}
      />
      <Drawer.Screen
        name="Ganancias"
        component={EarningsScreen}
        options={{ drawerIcon: icon('cash-outline') }}
      />
      <Drawer.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{ title: 'Perfil y configuración', drawerLabel: 'Perfil y configuración', drawerIcon: icon('person-outline') }}
      />
      <Drawer.Screen
        name="Simular"
        component={SimulateRequestScreen}
        options={{ title: 'Simular solicitud', drawerLabel: 'Simular solicitud (pruebas)', drawerIcon: icon('flask-outline') }}
      />
    </Drawer.Navigator>
  );
}

// Cuando aparece un viaje (solicitud nueva o viaje en curso) se abre la pantalla del viaje
function DrawerScreen() {
  const navigation = useNavigation();
  const { trip } = useTrip();
  const tripId = trip?.id;

  useEffect(() => {
    if (tripId) navigation.navigate('Trip');
  }, [tripId, navigation]);

  return <DriverDrawer />;
}

// Stack para el flujo del viaje + Drawer para el resto (sección 1, punto 8 del PDF)
export default function MainNavigator() {
  return (
    <TripProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Drawer" component={DrawerScreen} />
        <Stack.Screen
          name="Trip"
          component={TripFlowScreen}
          options={{ gestureEnabled: false, animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="TripDetail"
          component={TripDetailScreen}
          options={{
            headerShown: true,
            title: 'Detalle del viaje',
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.text, fontWeight: '800' },
          }}
        />
      </Stack.Navigator>
    </TripProvider>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    position: 'absolute',
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  drawerHeader: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingBottom: 20 },
  drawerAvatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 10 },
  drawerName: { color: colors.white, fontSize: 18, fontWeight: '800' },
  drawerPlate: { color: colors.primarySoft, fontSize: 13, marginTop: 2 },
});
