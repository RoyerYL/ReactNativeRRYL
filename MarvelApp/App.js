import 'react-native-gesture-handler';
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ExampleComponents from './Components/ExampleComponents';
import SheetView from './Components/ShettView';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer  style={{ flex: 1 }}>
      <Stack.Navigator initialRouteName="Example">
        {/* Llamamos “Example” a la pantalla que muestra ExampleComponents */}
        <Stack.Screen
          name="Example"
          component={SheetView}
          options={{ title: 'Ejemplos de Componentes' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
