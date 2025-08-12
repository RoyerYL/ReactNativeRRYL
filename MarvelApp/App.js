// App.js o donde definas tu navegación principal
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SheetView from './Components/ShettView';
import MarcaScreen from './Components/MarcaScreen';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Marcas">
        <Stack.Screen name="Marcas"
          options={{
            title: 'Marcas',
            headerStyle: {
              backgroundColor: '#003b77', // color de fondo del header
            },
            headerTintColor: '#fff', // color del texto y flecha de atrás
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 24,
            },
            headerTitleAlign: 'center', // centrar el título
          }} component={SheetView} />
        <Stack.Screen name="MarcaDetalle"
          options={{
            title: 'Maquinas',
            headerStyle: {
              backgroundColor: '#003b77', // color de fondo del header
            },
            headerTintColor: '#fff', // color del texto y flecha de atrás
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 24,
            },
            headerTitleAlign: 'center', // centrar el título
          }}
          component={MarcaScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
