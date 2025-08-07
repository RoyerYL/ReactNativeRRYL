import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRoute } from '@react-navigation/native';

const MarcaScreen = () => {
  const route = useRoute();
  const { marcaName, marcaData } = route.params;

  const [selectedSection, setSelectedSection] = useState('TODAS');

  const filteredData = selectedSection === 'TODAS'
    ? marcaData
    : marcaData.filter(sec => sec.section === selectedSection);

  const allSections = ['TODAS', ...new Set(marcaData.map(sec => sec.section))];

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>{marcaName}</Text>

      <Picker
        selectedValue={selectedSection}
        onValueChange={setSelectedSection}
        style={{ marginBottom: 20 }}
      >
        {allSections.map(section => (
          <Picker.Item key={section} label={section} value={section} />
        ))}
      </Picker>

      <ScrollView>
        {filteredData.map((sec, i) => (
          <View key={i} style={{ marginBottom: 15 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 6 }}>{sec.section}</Text>
            {sec.items.map((item, j) => (
              <View key={j} style={{ backgroundColor: '#eee', padding: 8, marginBottom: 4, borderRadius: 4 }}>
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

export default MarcaScreen;
