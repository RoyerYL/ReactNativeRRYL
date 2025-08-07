import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { NavigationContainer } from '@react-navigation/native';

const Tab = createMaterialTopTabNavigator();

// Componente que muestra las secciones para una marca
const MarcaScreen = ({ route }) => {
  const { marcaData, marcaName } = route.params;
  const [selectedSection, setSelectedSection] = useState(null);

  // Cuando no hay sección seleccionada mostramos todas
  const sectionsToShow = selectedSection
    ? marcaData.filter(sec => sec.section === selectedSection)
    : marcaData;

  // Opciones para el picker (secciones)
  const sectionOptions = marcaData.map(sec => sec.section);

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>{marcaName}</Text>

      <Picker
        selectedValue={selectedSection}
        onValueChange={(itemValue) => setSelectedSection(itemValue)}
        style={{ height: 50, marginBottom: 20 }}
      >
        <Picker.Item label="Todas las secciones" value={null} />
        {sectionOptions.map((sec, i) => (
          <Picker.Item key={i} label={sec} value={sec} />
        ))}
      </Picker>

      <ScrollView>
        {sectionsToShow.map((sec, i) => (
          <View key={i} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>{sec.section}</Text>
            {sec.items.map((item, j) => (
              <View
                key={j}
                style={{
                  backgroundColor: '#eee',
                  padding: 8,
                  marginBottom: 5,
                  borderRadius: 5,
                }}
              >
                <Text><Text style={{ fontWeight: 'bold' }}>Código:</Text> {item['CODIGO']}</Text>
                <Text><Text style={{ fontWeight: 'bold' }}>Máquina:</Text> {item['MAQUINAS']}</Text>
                <Text><Text style={{ fontWeight: 'bold' }}>Precio gremio:</Text> {item['PRECIO DOLAR AL GREMIO']}</Text>
                <Text><Text style={{ fontWeight: 'bold' }}>Precio público:</Text> {item['PRECIO FINAL EN DOLARES AL PUBLICO']}</Text>
                <Text><Text style={{ fontWeight: 'bold' }}>Precio en pesos:</Text> {item['PRECIO FINAL EN PESOS']}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// Componente principal que recibe el JSON completo y arma las pestañas
const MarcaTabs = ({ data }) => {
  // data: { JACK: [...], BETSEW: [...], ... }

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName={Object.keys(data)[0]}
        screenOptions={{ lazy: true, swipeEnabled: true }}
      >
        {Object.entries(data).map(([marcaName, marcaData]) => (
          <Tab.Screen
            key={marcaName}
            name={marcaName}
            component={MarcaScreen}
            initialParams={{ marcaName, marcaData }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default MarcaTabs;
