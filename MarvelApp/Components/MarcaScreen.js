import React, { useState, useRef, useEffect } from 'react'; // Importa React y hooks para estado, referencias y efectos
import { View, Text, ScrollView, Animated, Pressable, TouchableOpacity } from 'react-native'; // Importa componentes básicos de React Native
import { Picker } from '@react-native-picker/picker'; // Componente selector tipo dropdown
import { useRoute } from '@react-navigation/native'; // Hook para obtener parámetros de navegación
import ItemCard from './ItemCard'; // Componente hijo que renderiza cada item

// Componente principal de la pantalla de marca
const MarcaScreen = () => {

  const brandColors = { // Objeto que define colores por marca
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

  const route = useRoute(); // Obtiene la información de navegación actual
  const { marcaName, marcaData } = route.params; // Extrae nombre de la marca y datos enviados desde otra pantalla

  const [selectedSection, setSelectedSection] = useState('TODAS'); // Estado que guarda la sección seleccionada

  const allSections = ['TODAS', ...new Set(marcaData.map((sec) => sec.section))]; // Genera lista única de secciones incluyendo "TODAS"
  const [ofertasActivas, setOfertasActivas] = useState(false); // Estado que indica si el filtro de ofertas está activo
  const colorAnim = useRef(new Animated.Value(0)).current; // Valor animado para cambiar colores dinámicamente

  // Filtra los datos según sección y si hay ofertas activas
  const filteredData = React.useMemo(() => {
    let data = selectedSection === "TODAS" ? marcaData : marcaData.filter((item) => item.section === selectedSection); // Filtra por sección

    if (ofertasActivas) { // Si ofertas está activado
      data = data
        .map((sec) => ({ // Recorre cada sección
          ...sec,
          items: sec.items.filter((item) => item.OFERTA === 1), // Filtra solo productos en oferta
          ofertas: sec.items.filter((item) => item.OFERTA === 1).length, // Cuenta cantidad de ofertas
        }))
        .filter((sec) => sec.items.length > 0); // Elimina secciones vacías
    }

    return data; // Devuelve los datos filtrados
  }, [marcaData, selectedSection, ofertasActivas]); // Se recalcula cuando cambian estos valores

  useEffect(() => { // Efecto que corre cuando cambia el estado de ofertas
    Animated.timing(colorAnim, {
      toValue: ofertasActivas ? 1 : 0, // Cambia valor animado según estado
      duration: 400, // Duración de la animación
      useNativeDriver: false, // No se puede usar driver nativo para colores
    }).start(); // Inicia la animación
  }, [ofertasActivas]);

  const backgroundColor = colorAnim.interpolate({ // Interpolación para color de fondo animado
    inputRange: [0, 1],
    outputRange: ["#a5a5a5b0", "#ffffffff"], // De gris a blanco
  });

  const textColor = colorAnim.interpolate({ // Interpolación para color de texto
    inputRange: [0, 1],
    outputRange: ["black", "black"], // No cambia en este caso
  });

  return ( // Render principal del componente
    <View
      style={{
        backgroundColor: brandColors[marcaName]?.background || brandColors.DEFAULT.background, // Fondo según marca o default
        flex: 1, // Ocupa toda la pantalla
      }}
    >
      <Text
        style={{
          fontSize: 24,
          color: brandColors[marcaName]?.text || brandColors.DEFAULT.text, // Color de texto según marca
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        {marcaName} {/* Muestra el nombre de la marca */}
      </Text>

      <View style={{ padding: 10, flexDirection: 'row', justifyContent: 'space-between' }}> {/* Contenedor superior */}

        <Picker
          selectedValue={selectedSection} // Valor seleccionado actual
          onValueChange={setSelectedSection} // Cambia la sección
          style={{ marginBottom: 20, backgroundColor: "white", color: 'black', fontSize: 20, width: "35%" }}
        >
          {allSections.map((section) => ( // Recorre todas las secciones
            <Picker.Item key={section} label={section} value={section} /> // Crea opción por sección
          ))}
        </Picker>

        <TouchableOpacity onPress={() => setOfertasActivas(!ofertasActivas)}> {/* Botón para activar/desactivar ofertas */}
          <Animated.View
            style={{
              backgroundColor, // Color animado
              padding: 10,
              borderRadius: 8,
            }}
          >
            <Animated.Text
              style={{
                color: textColor, // Color animado del texto
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              Ofertas: {filteredData.reduce((total, sec) => total + sec.ofertas, 0)} {/* Suma total de ofertas */}
            </Animated.Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <ScrollView> {/* Contenedor scrollable */}
        {filteredData.map((sec, i) => ( // Recorre cada sección filtrada
          <View
            key={i}
            style={{
              marginBottom: 15,
              backgroundColor: "white"
            }}
          >
            <Text
              style={{
                fontSize: 30,
                fontWeight: 'bold',
                textAlign: 'center',
                color: brandColors[marcaName]?.background || brandColors.DEFAULT.background, // Color del título de sección
              }}
            >
              {sec.section} {/* Nombre de la sección */}
            </Text>

            {sec.items.map((item, j) => ( // Recorre items dentro de la sección
              <ItemCard
                key={item['CODIGO']} // Key única del item
                item={item} // Datos del producto
                textColor={"black"} // Color de texto
                marca={marcaName} // Marca actual
                backgroundColor={brandColors[marcaName]?.background || brandColors.DEFAULT.background} // Color de fondo del item
              >
                {item.MAQUINAS} {/* Contenido hijo (prop children) */}
              </ItemCard>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default MarcaScreen; // Exporta el componente para usarlo en otras pantallas