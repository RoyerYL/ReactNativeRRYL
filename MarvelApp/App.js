// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PreciosScreen from './Components/PreciosScreen';
import SheetView from './Components/ShettView';
import CajaVentasScreen from './Components/CajaVentasScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Marcas">
        <Stack.Screen
          name="Marcas"
          component={SheetView}
          options={{
            title: 'Marcas',
            headerStyle: {
              backgroundColor: '#003b77',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 24,
            },
            headerTitleAlign: 'center',
            headerShown: false
          }}
        />

        {/* NUEVA PANTALLA */}
        <Stack.Screen
          name="Precios"
          component={PreciosScreen}
          options={{
            title: 'Administrar Precios',
            headerStyle: {
              backgroundColor: '#003b77',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 20,
            },
            headerTitleAlign: 'center',
            headerBackTitle: 'Atrás',
          }}
        />
         <Stack.Screen 
          name="CajaVentas"
          component={CajaVentasScreen}
          options={{
            title: 'Ventas & Caja',
            headerStyle: { backgroundColor: '#003b77' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
            headerTitleAlign: 'center',
            headerBackTitle: 'Atrás',
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}