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
        <Stack.Screen name="Marcas" component={SheetView} />
        <Stack.Screen name="MarcaDetalle" component={MarcaScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
