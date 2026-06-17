/**
 * AppNavigator.js
 * Define el stack de navegación principal de la app.
 *
 * Centralizar la navegación acá permite:
 * - Agregar pantallas sin tocar App.js.
 * - Reutilizar opciones de header con screenOptions compartidas.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SheetView   from '../screens/Sheets/SheetView';
import MarcaScreen from '../screens/Marcas/MarcaScreen';
import { COLORS }  from '../constants/colors';

const Stack = createNativeStackNavigator();

// Opciones base compartidas por todas las pantallas con header visible
const BASE_HEADER_OPTIONS = {
  headerStyle: {
    backgroundColor: COLORS.primary,
  },
  headerTintColor: COLORS.white,
  headerTitleStyle: {
    fontWeight: 'bold',
    fontSize: 24,
  },
  headerTitleAlign: 'center',
};

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Landing">

      {/* Pantalla principal — sin header (tiene su propio título) */}
      <Stack.Screen
        name="Landing"
        component={SheetView}
        options={{ headerShown: false }}
      />

      {/* Pantalla de detalle de marca */}
      <Stack.Screen
        name="MarcaDetalle"
        component={MarcaScreen}
        options={{
          ...BASE_HEADER_OPTIONS,
          title: 'Máquinas',
        }}
      />

    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;