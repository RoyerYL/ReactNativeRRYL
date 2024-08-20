import 'react-native-gesture-handler';
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ArticuloForm from './Components/ArticuloForm';
import ArticuloList from './Components/ArticuloList';
import Detail from './Components/Detail/ArticuloDetail'; // Importa el componente Detail

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="ArticuloList">
        <Stack.Screen name="ArticuloList" component={ArticuloList} options={{ title: 'Lista de Artículos' }} />
        <Stack.Screen name="ArticuloForm" component={ArticuloForm} options={{ title: 'Crear Artículo' }} />
        <Stack.Screen name="Detail" component={Detail} options={{ title: 'Detalle del Artículo' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
