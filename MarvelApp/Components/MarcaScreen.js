import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRoute } from '@react-navigation/native';

const MarcaScreen = () => {
const brandColors = {
  SIRUBA: { background: '#f04925', text: '#FFFFFF' },   // Siruba – Pumpkin Orange :contentReference[oaicite:0]{index=0}
  JACK:   { background: '#1da5de', text: '#FFFFFF' },   // Jack – Tory Blue :contentReference[oaicite:1]{index=1}
  SUNSURE:{ background: '#eb2126', text: '#000000' },   // Sunsure – Yellow brillante (aproximado)
  TYPICAL:{ background: '#1a1a1aff', text: '#FFFFFF' },   // Gris oscuro
  DAPET:  { background: '#2d2e7fe0', text: '#ffffffff' },   // Verde oscuro
  JUKI:   { background: '#117bc0', text: '#FFFFFF' },   // Juki – azul #007bc3 :contentReference[oaicite:2]{index=2}
  BETSEW: { background: '#1da5de', text: '#FFFFFF' },   // Betsew – azul celeste (ajustado)
  GOLDEX: { background: '#D6AB42', text: '#000000' },   // Goldex – Old Gold #D6AB42 :contentReference[oaicite:3]{index=3}
  DEFAULT: { background: '#1da5de', text: '#FFFFFF' },   // Betsew – azul celeste (ajustado)
};

  const route = useRoute();
  const { marcaName, marcaData } = route.params;

  const [selectedSection, setSelectedSection] = useState('TODAS');

  const filteredData = selectedSection === 'TODAS'
    ? marcaData
    : marcaData.filter(sec => sec.section === selectedSection);

  const allSections = ['TODAS', ...new Set(marcaData.map(sec => sec.section))];

  return (
    <View style={{backgroundColor: brandColors[marcaName].background || brandColors.DEFAULT.background , flex: 1, padding: 10 }}>
      <Text style={{ fontSize: 24,color: brandColors[marcaName].text || brandColors.DEFAULT.text, fontWeight: 'bold', margin:"auto" }}>{marcaName}</Text>

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
            <Text style={{ fontSize: 30, fontWeight: 'bold', margin:"auto" ,  color: brandColors[marcaName].text || brandColors.DEFAULT.text }}>{sec.section}</Text>
            {sec.items.map((item, j) => (
              <View key={j} style={{ padding: 0, marginBottom: 4, borderRadius: 4 }}>
                
                <Text style={{ fontWeight: 'bold',color: brandColors[marcaName].text || brandColors.DEFAULT.text ,padding: 10, fontSize: 20  }}>Máquina: {item['MAQUINAS']}</Text>
                <Text style={{padding: 10, color: brandColors[marcaName].text || brandColors.DEFAULT.text, fontWeight: 'bold' }}>Código: {item['CODIGO']}</Text>
                <Text style={{  padding: 10 , color: brandColors[marcaName].text || brandColors.DEFAULT.text}}>Precio gremio USD: {item['PRECIO DOLAR AL GREMIO']}</Text>
                <Text style={{ padding: 10 ,color: brandColors[marcaName].text || brandColors.DEFAULT.text }}>Precio público USD: {item['PRECIO FINAL EN DOLARES AL PUBLICO']}</Text>
                <Text style={{ padding: 10 ,color: brandColors[marcaName].text || brandColors.DEFAULT.text }}>Cotización Dolar: {item['COTIZACION DEL DOLAR']}</Text>
                <Text style={{ fontWeight: 'bold' ,fontSize: 20 , backgroundColor: '#1eff00a2',margin:0 ,color: brandColors[marcaName].text || brandColors.DEFAULT.text }}>Precio en pesos: {item['PRECIO FINAL EN PESOS']}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default MarcaScreen;
