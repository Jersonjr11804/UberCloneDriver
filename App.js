// AI-assisted: see docs/AI_LOG.md #6
import 'react-native-gesture-handler';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DriverSessionProvider, useDriverSession } from './src/context/DriverSessionContext';
import AuthScreen from './src/screens/auth/AuthScreen';
import ProfileErrorScreen from './src/screens/auth/ProfileErrorScreen';
import RegistroTabs from './src/navigation/RegistroTabs';
import MainNavigator from './src/navigation/MainNavigator';
import { colors } from './src/styles/formStyles';
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['[Reanimated] Dependencies should only be used on the web']);

const Stack = createNativeStackNavigator();

function Splash() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}>
      <ActivityIndicator size="large" color={colors.white} />
    </View>
  );
}

// Flujo según el estado de la sesión:
//   sin sesión                  -> Auth (iniciar sesión / registrarse)
//   con sesión, sin registro    -> Registro de conductor (pestañas)
//   con sesión y registro       -> Main (Drawer + flujo del viaje)
function AppNavigator() {
  const { user, profileStatus, loading } = useDriverSession();

  if (loading) return <Splash />;

  let screen;
  if (!user) {
    screen = <Stack.Screen name="Auth" component={AuthScreen} />;
  } else if (profileStatus === 'error') {
    screen = <Stack.Screen name="ProfileError" component={ProfileErrorScreen} />;
  } else if (profileStatus === 'exists') {
    screen = <Stack.Screen name="Main" component={MainNavigator} />;
  } else {
    screen = <Stack.Screen name="Registro" component={RegistroTabs} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>{screen}</Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DriverSessionProvider>
          <AppNavigator />
        </DriverSessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
