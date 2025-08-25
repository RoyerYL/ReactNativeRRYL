import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  FlatList,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import { loadAllData } from './utils';

// 🔹 Normalizar texto (sin tildes, lowercase)
const normalize = (str) =>
  str
    ? str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    : '';

const SheetView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState([]);
  const navigation = useNavigation();

  const loadDataFromStorage = async () => {
    setLoading(true);
    const jsonStr = await AsyncStorage.getItem('@data');

    if (jsonStr) {
      setData(JSON.parse(jsonStr));
    } else {
      const freshData = await loadAllData();
      setData(freshData);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDataFromStorage();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    const freshData = await loadAllData();
    setData(freshData);
    setLoading(false);
  };

  const handleSearch = (text) => {
    setQuery(text);
    if (!text.trim()) {
      setFiltered([]);
      return;
    }

    const terms = normalize(text).split(' ').filter(Boolean);

    const results = data?.allItems?.filter((item) => {
      const haystack = `${normalize(item.CODIGO)} ${normalize(
        item.MAQUINAS
      )} ${normalize(item.marca)}`;
      return terms.every((t) => haystack.includes(t));
    });

    setFiltered(results?.slice(0, 15) || []);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text>No hay datos para mostrar</Text>
        <Button title="Cargar datos" onPress={refreshData} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 10 }}>
      {/* 🔹 Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o código..."
          value={query}
          onChangeText={handleSearch}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setFiltered([]); }}>
            <Text style={styles.clearButton}>X</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 🔹 Dropdown de resultados */}
      {filtered.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={filtered}
            keyExtractor={(item, idx) => item.CODIGO + idx}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('MarcaDetalle', { item })
                }
              >
                <View style={styles.dropdownItem}>
                  {/* Etiqueta marca */}
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{item.marca}</Text>
                  </View>
                  {/* Info */}
                  <Text style={styles.itemText}>
                    {item.CODIGO} - {item.MAQUINAS}
                  </Text>
                  <Text style={styles.price}>
                    {item['PRECIO FINAL EN PESOS']
                      ? `$ ${item['PRECIO FINAL EN PESOS']}`
                      : 'No hay precio'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* 🔹 Resumen por marca */}
      <Text style={styles.title}>Precio de Maquinas</Text>
      <ScrollView style={{ marginTop: 10 }}>
        {Object.entries(data.resumenPorMarca).map(([marcaName, resumen]) => (
          <TouchableOpacity
            key={marcaName}
            style={styles.card}
            onPress={() =>
              navigation.navigate('MarcaDetalle', {
                marcaName,
                marcaData: data.allData[marcaName],
              })
            }
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{marcaName}</Text>
            <Text>Máquinas: {resumen.maquinas}</Text>
            <Text>Ofertas: {resumen.ofertas}</Text>

            {resumen.ofertas > 0 && (
              <Text style={{ color: 'red', fontWeight: 'bold', marginTop: 5 }}>
                🔥 ¡Esta marca tiene ofertas disponibles!
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 🔹 Botón actualizar */}
      <TouchableOpacity onPress={refreshData} style={styles.refreshButton}>
        <Text style={styles.refreshText}>Actualizar datos</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SheetView;

// 🎨 Estilos
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    marginBottom: 10,
    marginTop: 20,
  },
  searchInput: { flex: 1, height: 40, fontSize: 16 },
  clearButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff0000',
    marginLeft: 8,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 250,
    marginBottom: 10,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemText: { marginTop: 16, fontSize: 14 },
  price: {
    marginTop: 4,
    fontWeight: 'bold',
    color: '#064d06', // verde oscuro
  },
  tag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#000',
    textAlign: 'center',
  },
  card: {
    padding: 16,
    backgroundColor: '#eeeeeeb9',
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
  },
  refreshButton: {
    backgroundColor: '#ff8000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  refreshText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
