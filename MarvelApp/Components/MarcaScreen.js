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
    <View style={{backgroundColor: '#00aeff69', flex: 1, padding: 10 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', margin:"auto" }}>{marcaName}</Text>

      <Picker
        selectedValue={selectedSection}
        onValueChange={setSelectedSection}
        style={{ marginBottom: 20 , color: 'black' ,fontSize: 20}}
      >
        {allSections.map(section => (
          <Picker.Item key={section} label={section} value={section} />
        ))}
      </Picker>

      <ScrollView>
        {filteredData.map((sec, i) => (
          <View key={i} style={{ marginBottom: 15 ,border: "1px solid black" , borderRadius: "10px" }}>
            <Text style={{ fontSize: 30, fontWeight: 'bold', margin:"auto" ,  color: 'white' }}>{sec.section}</Text>
            {sec.items.map((item, j) => (
              <View key={j} style={{ padding: 0, marginBottom: 4, borderRadius: 4 }}>
                
                <Text style={{ fontWeight: 'bold' ,padding: 10, fontSize: 20 , color:"black" }}>Máquina: {item['MAQUINAS']}</Text>
                <Text style={{padding: 10, fontWeight: 'bold' }}>Código: {item['CODIGO']}</Text>
                <Text style={{  padding: 10}}>Precio gremio USD: {item['PRECIO DOLAR AL GREMIO']}</Text>
                <Text style={{ padding: 10 }}>Precio público USD: {item['PRECIO FINAL EN DOLARES AL PUBLICO']}</Text>
                <Text style={{ padding: 10 }}>Cotización Dolar: {item['COTIZACION DEL DOLAR']}</Text>
                <Text style={{ fontWeight: 'bold' ,fontSize: 20 , backgroundColor: '#1eff00a2',margin:0 ,color: 'black' }}>Precio en pesos: {item['PRECIO FINAL EN PESOS']}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default MarcaScreen;
