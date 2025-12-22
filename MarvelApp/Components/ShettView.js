import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  FlatList,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ItemCard from './ItemCard';
export const images = {
  DaiquiriFrutilla: require('../assets/DaiquiriFrutilla.png'),
  DaiquiriDurazno: require('../assets/DaiquiriDurazno.png'),
  // DaiquiriAnana: require('./DaiquiriAnana.png'),
  // PasionRoja: require('./PasionRoja.png'),
  // Gancia: require('./Gancia.png'),
  // Fernet: require('./Fernet.png'),
  // PinaColada: require('./PinaColada.png'),
  PanteraRosa: require('../assets/PanteraRosa.png'),
  // Caipirinha: require('./Caipirinha.png'),
  // MentaFuerte: require('./MentaFuerte.png'),
  // TequilaSunrise: require('./TequilaSunrise.png'),
  PitufoAzul: require('../assets/PitufoAzul.png'),
  // CubaLibre: require('./CubaLibre.png'),
  // Destornillador: require('./Destornillador.png'),
  LagunaAzul: require('../assets/LagunaAzul.png'),
  // SinAlcoholFrutilla: require('./SinAlcoholFrutilla.png'),
  // SinAlcoholDurazno: require('./SinAlcoholDurazno.png'),
  // SinAlcoholAnana: require('./SinAlcoholAnana.png'),
  // default: require('./default.png'),
};

/* ================= CONFIG ================= */

const CARD_WIDTH = 260;
const CARD_HEIGHT = 360;
const CARD_MARGIN = 10;

/* ================ NORMALIZE ================ */
const normalize = (s) =>
  s
    ? s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    : '';

/* ================= COMPONENT ================= */

const SheetView = () => {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [numColumns, setNumColumns] = useState(1);
  const [cart, setCart] = useState([]);
  const [lista] = useState([
    { id: 1, name: 'Daiquiri frutilla', imageKey: images.DaiquiriFrutilla },
    { id: 2, name: 'Daiquiri durazno', imageKey: images.DaiquiriDurazno },
    // { id: 3, name: 'Daiquiri anana', imageKey: 'daiquiri_anana' },
    // { id: 4, name: 'Pasion Roja', imageKey: 'pasion_roja' },
    // { id: 5, name: 'Gancia', imageKey: 'gancia' },
    // { id: 6, name: 'Fernet', imageKey: 'fernet' },
    // { id: 7, name: 'Pina Colada', imageKey: 'pina_colada' },
    { id: 8, name: 'Pantera Rosa', imageKey: images.PanteraRosa },
    // { id: 9, name: 'Caipirinha', imageKey: 'caipirinha' },
    // { id: 10, name: 'Menta Fuerte', imageKey: 'menta_fuerte' },
    // { id: 11, name: 'Tequila Sunrise', imageKey: 'tequila_sunrise' },
    { id: 12, name: 'Pitufo Azul', imageKey: images.PitufoAzul },
    // { id: 13, name: 'Cuba Libre', imageKey: 'cuba_libre' },
    // { id: 14, name: 'Destornillador', imageKey: 'destornillador' },
    { id: 15, name: 'Laguna Azul', imageKey: images.LagunaAzul },
    // { id: 16, name: 'Sin alcohol Frutilla', imageKey: 'sin_alcohol_frutilla' },
    // { id: 17, name: 'Sin alcohol durazno', imageKey: 'sin_alcohol_durazno' },
    // { id: 18, name: 'Sin alcohol anana', imageKey: 'sin_alcohol_anana' },
  ]);

  /* ====== calcular columnas dinámicas ====== */
  const calculateColumns = () => {
    const screenWidth = Dimensions.get('window').width;
    const columns = Math.floor(
      screenWidth / (CARD_WIDTH + CARD_MARGIN * 2)
    );
    return Math.max(columns, 1);
  };

  useEffect(() => {
    const updateLayout = () => {
      setNumColumns(calculateColumns());
    };

    updateLayout();

    const sub = Dimensions.addEventListener('change', updateLayout);
    return () => sub?.remove();
  }, []);

  const filteredList =
    lista?.filter(
      (item) =>
        item?.name &&
        normalize(item.name).includes(normalize(query))
    ) ?? [];

  return (
    <View style={styles.container}>


      {/* LISTA */}
      <FlatList
        key={numColumns} // 🔑 fuerza re-render al cambiar columnas
        data={filteredList}
        numColumns={numColumns}
        keyExtractor={(item, index) =>
          item?.id?.toString() ?? index.toString()
        }
        renderItem={({ item }) => (
          <ItemCard
            {...item}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            onAddToCart={() => setCart([...cart, item])}
          // onPress={() =>
          //   navigation.navigate('ItemDetail', { item })
          // }
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />

      {/* MINI CART */}
      {cart.length > 0 && (
        <View style={styles.cartContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cartScroll}
          >
            {cart.map((item, index) => (
              <View key={`${item.id}-${index}`} style={styles.cartItem}>
                <Image
                  source={item.imageKey}
                  style={styles.cartImage}
                  resizeMode="contain"
                />
                <Text style={styles.cartText} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

    </View>
  );
};

export default SheetView;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },

  list: {
    alignItems: 'center',
    paddingBottom: 100, // >= cart height
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    margin: 10,
  },

  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },

  clearButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff0000',
  },

  refreshButton: {
    backgroundColor: '#ff8000',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    margin: 10,
  },

  refreshText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  cartContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,                 // 👈 CLAVE
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    justifyContent: 'center',

    zIndex: 1000,        // 👈 iOS
    elevation: 20,       // 👈 Android
  },

  cartScroll: {
    paddingHorizontal: 10,
  },

  cartItem: {
    width: 80,
    alignItems: 'center',
    marginRight: 10,
  },

  cartImage: {
    width: 44,
    height: 44,
    marginBottom: 4,
  },

  cartText: {
    fontSize: 12,
    textAlign: 'center',
  },

});
