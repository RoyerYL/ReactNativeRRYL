import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Animated } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRoute } from '@react-navigation/native';

const MarcaScreen = () => {
  const brandColors = {
    SIRUBA: { background: '#f04925', text: '#FFFFFF' },
    JACK: { background: '#1da5de', text: '#FFFFFF' },
    SUNSURE: { background: '#eb2126', text: '#000000' },
    TYPICAL: { background: '#1a1a1aff', text: '#FFFFFF' },
    DAPET: { background: '#2d2e7fe0', text: '#ffffffff' },
    JUKI: { background: '#117bc0', text: '#FFFFFF' },
    BETSEW: { background: '#1da5de', text: '#FFFFFF' },
    GOLDEX: { background: '#D6AB42', text: '#000000' },
    DEFAULT: { background: '#1da5de', text: '#FFFFFF' },
    ROSEW: { background: '#1da5de', text: '#FFFFFF' }
  };

  const route = useRoute();
  const { marcaName, marcaData } = route.params;

  const [selectedSection, setSelectedSection] = useState('TODAS');

  const filteredData = selectedSection === 'TODAS'
    ? marcaData
    : marcaData.filter(sec => sec.section === selectedSection);

  const allSections = ['TODAS', ...new Set(marcaData.map(sec => sec.section))];

  return (
    <View style={{ backgroundColor: brandColors[marcaName]?.background || brandColors["DEFAULT"].background, flex: 1, padding: 10 }}>
      <Text style={{ fontSize: 24, color: brandColors[marcaName]?.text || brandColors["DEFAULT"].text, fontWeight: 'bold', margin: "auto" }}>{marcaName}</Text>

      <Picker
        selectedValue={selectedSection}
        onValueChange={setSelectedSection}
        style={{ marginBottom: 20, color: 'black', fontSize: 20 }}
      >
        {allSections.map(section => (
          <Picker.Item key={section} label={section} value={section} />
        ))}
      </Picker>

      <ScrollView>
        {filteredData.map((sec, i) => (
          <View key={i} style={{ marginBottom: 15, borderWidth: 1, borderColor: "black", borderRadius: 10 }}>
            <Text style={{ fontSize: 30, fontWeight: 'bold', textAlign: 'center', color: brandColors[marcaName]?.text || brandColors["DEFAULT"].text }}>{sec.section}</Text>
            {sec.items.map((item, j) => {

              // Animación simple para el sticker
              const scaleAnim = useRef(new Animated.Value(0)).current;
              useEffect(() => {
                if (item['OFERTA'] === 1) {
                  Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 3,
                    useNativeDriver: true
                  }).start();
                }
              }, []);

              return (
                <View key={j} style={{ padding: 0, marginBottom: 10, borderRadius: 4, position: 'relative' }}>

                  <Text style={{ fontWeight: 'bold', color: brandColors[marcaName]?.text || brandColors["DEFAULT"].text, padding: 10, fontSize: 20 }}>Máquina: {item['MAQUINAS']}</Text>
                  <Text style={{ padding: 10, color: brandColors[marcaName]?.text || brandColors["DEFAULT"].text, fontWeight: 'bold' }}>Código: {item['CODIGO']}</Text>
                  <Text style={{ padding: 10, color: brandColors[marcaName]?.text || brandColors["DEFAULT"].text }}>
                    {item['PRECIO DOLAR AL GREMIO']
                      ? `Precio gremio USD: ${item['PRECIO DOLAR AL GREMIO']}`
                      : item['PRECIO EN PESOS AL GREMIO']
                        ? `Precio gremio ARS: ${item['PRECIO EN PESOS AL GREMIO']}`
                        : 'Precio gremio: N/A'}
                  </Text>

                  <Text style={{ padding: 10, color: brandColors[marcaName]?.text || brandColors["DEFAULT"].text }}>Porcetaje de ganancia: {item['%']}</Text>
                  {item['PRECIO FINAL EN DOLARES AL PUBLICO'] && (
                    <Text style={{ padding: 10, color: brandColors[marcaName]?.text || brandColors["DEFAULT"].text }}>
                      Precio público USD: {item['PRECIO FINAL EN DOLARES AL PUBLICO']}
                    </Text>
                  )}

                  {item['COTIZACION DEL DOLAR'] && (
                    <Text style={{ padding: 10, color: brandColors[marcaName]?.text || brandColors["DEFAULT"].text }}>
                      Cotización Dolar: {item['COTIZACION DEL DOLAR']}
                    </Text>
                  )}
                  <Text style={{ fontWeight: 'bold', fontSize: 20, backgroundColor: '#1eff00a2', margin: 0, color: brandColors[marcaName]?.text || brandColors["DEFAULT"].text }}>Precio en pesos: {item['PRECIO FINAL EN PESOS']}</Text>

                  {item['OFERTA'] === 1 && (
                    <Animated.View style={{
                      position: 'absolute',
                      top: 5,
                      right: 5,
                      backgroundColor: 'red',
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 6,
                      transform: [{ scale: scaleAnim }]
                    }}>
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>OFERTA</Text>
                    </Animated.View>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default MarcaScreen;
