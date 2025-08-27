import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Animated, Pressable, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRoute } from '@react-navigation/native';
import ItemCard from './ItemCard';

// Componente hijo para cada item


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
    ROSEW: { background: '#1da5de', text: '#FFFFFF' },
  };

  const route = useRoute();
  const { marcaName, marcaData } = route.params;

  const [selectedSection, setSelectedSection] = useState('TODAS');



  const allSections = ['TODAS', ...new Set(marcaData.map((sec) => sec.section))];
  const [ofertasActivas, setOfertasActivas] = useState(false);
  const colorAnim = useRef(new Animated.Value(0)).current;
  // Animación de color según el estado
  const filteredData = React.useMemo(() => {
    // Paso 1: filtro por sección
    let data =
      selectedSection === "TODAS"
        ? marcaData
        : marcaData.filter((item) => item.section === selectedSection);

    // Paso 2: si ofertas activas, filtro los items dentro de cada sección
    if (ofertasActivas) {
      data = data
        .map((sec) => ({
          ...sec,
          items: sec.items.filter((item) => item.OFERTA === 1),
          ofertas: sec.items.filter((item) => item.OFERTA === 1).length,
        }))
        .filter((sec) => sec.items.length > 0);
    }

    return data;
  }, [marcaData, selectedSection, ofertasActivas]);


  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: ofertasActivas ? 1 : 0,
      duration: 400,
      useNativeDriver: false, // 🔹 no se puede animar "color" con nativeDriver
    }).start();
  }, [ofertasActivas]);

  // Interpolamos colores (apagado → encendido)
  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#a5a5a5b0", "#ffffffff"], // blanco apagado → verde encendido
  });

  const textColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["black", "black"], // texto negro apagado → blanco encendido
  });
  return (
    <View
      style={{
        backgroundColor: brandColors[marcaName]?.background || brandColors.DEFAULT.background,
        flex: 1,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          color: brandColors[marcaName]?.text || brandColors.DEFAULT.text,
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        {marcaName}
      </Text>
      <View style={{ padding: 10, flexDirection: 'row', justifyContent: 'space-between' }}>

        <Picker
          selectedValue={selectedSection}
          onValueChange={setSelectedSection}
          style={{ marginBottom: 20,backgroundColor: "white", color: 'black', fontSize: 20, width: "35%" }}
        >
          {allSections.map((section) => (
            <Picker.Item key={section} label={section} value={section} />
          ))}
        </Picker>


        {/* 🔹 Botón animado Ofertas */}
        <TouchableOpacity onPress={() => setOfertasActivas(!ofertasActivas)}>
          <Animated.View
            style={{
              backgroundColor,
              padding: 10,
              borderRadius: 8,
            }}
          >
            <Animated.Text
              style={{
                color: textColor,
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              Ofertas: {filteredData.reduce((total, sec) => total + sec.ofertas, 0)}
            </Animated.Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {filteredData.map((sec, i) => (
          <View
            key={i}
            style={{
              marginBottom: 15,
              backgroundColor:"white"
            }}
          >
            <Text
              style={{
                fontSize: 30,
                fontWeight: 'bold',
                textAlign: 'center',
                color: brandColors[marcaName]?.background || brandColors.DEFAULT.background,
              }}
            >
              {sec.section}
            </Text>
            {sec.items.map((item, j) => (

              <ItemCard
                key={j}
                item={item}
                textColor={"black"}
                backgroundColor={brandColors[marcaName]?.background || brandColors.DEFAULT.background}
              >{item.MAQUINAS}
              </ItemCard>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default MarcaScreen;
