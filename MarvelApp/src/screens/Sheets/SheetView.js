/**
 * SheetView.js — Pantalla principal
 *
 * Responsabilidad única: render de la UI.
 * Toda la lógica de datos y búsqueda vive en useSheetData.
 */

import React from 'react';
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
import { useNavigation } from '@react-navigation/native';

import useSheetData from './useSheetData';
import { COLORS } from '../../constants/colors';

// ─── Sub-componentes locales ──────────────────────────────────────────────────

/**
 * SearchBar
 * Barra de búsqueda con botón para limpiar el texto.
 */
const SearchBar = ({ query, onChangeText }) => (
  <View style={styles.searchContainer}>
    <TextInput
      style={styles.searchInput}
      placeholder="Buscar por nombre o código..."
      placeholderTextColor="#999"
      value={query}
      onChangeText={onChangeText}
    />
    {query.length > 0 && (
      <TouchableOpacity onPress={() => onChangeText('')}>
        <Text style={styles.clearButton}>✕</Text>
      </TouchableOpacity>
    )}
  </View>
);

/**
 * SearchResultItem
 * Fila de resultado en el dropdown de búsqueda.
 */
const SearchResultItem = ({ item, onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <View style={styles.dropdownItem}>
      <View style={styles.tag}>
        <Text style={styles.tagText}>{item.marca}</Text>
      </View>
      <Text style={styles.itemText}>
        {item.CODIGO} - {item.MAQUINAS}
      </Text>
      <Text style={styles.price}>
        {item['PRECIO FINAL EN PESOS']
          ? `$ ${item['PRECIO FINAL EN PESOS']}`
          : 'Sin precio'}
      </Text>
    </View>
  </TouchableOpacity>
);

/**
 * MarcaCard
 * Tarjeta que representa una marca en el listado principal.
 */
const MarcaCard = ({ marcaName, resumen, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <Text style={styles.cardTitle}>{marcaName}</Text>
    <Text>Máquinas: {resumen.maquinas}</Text>
    <Text>Ofertas: {resumen.ofertas}</Text>
    {resumen.ofertas > 0 && (
      <Text style={styles.ofertaLabel}>
        🔥 ¡Esta marca tiene ofertas disponibles!
      </Text>
    )}
  </TouchableOpacity>
);

// ─── Pantalla principal ───────────────────────────────────────────────────────

const SheetView = () => {
  const navigation = useNavigation();
  const { data, loading, query, setQuery, filtered, refresh } = useSheetData();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text>No hay datos para mostrar</Text>
        <Button title="Cargar datos" onPress={refresh} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Maquinas Mequitex</Text>

      <SearchBar query={query} onChangeText={setQuery} />

      {/* Dropdown de resultados */}
      {filtered.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={filtered}
            keyExtractor={(item, idx) => `${item.marca}-${item.CODIGO}-${idx}`}
            renderItem={({ item }) => (
              <SearchResultItem
                item={item}
                onPress={() => navigation.navigate('MarcaDetalle', { item })}
              />
            )}
          />
        </View>
      )}

      {/* Lista de marcas */}
      <ScrollView style={styles.marcaList}>
        {Object.entries(data.resumenPorMarca).map(([marcaName, resumen]) => (
          <MarcaCard
            key={marcaName}
            marcaName={marcaName}
            resumen={resumen}
            onPress={() =>
              navigation.navigate('MarcaDetalle', {
                marcaName,
                marcaData: data.allData[marcaName],
              })
            }
          />
        ))}
      </ScrollView>

      <TouchableOpacity onPress={refresh} style={styles.refreshButton}>
        <Text style={styles.refreshText}>Actualizar datos</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SheetView;

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    color: COLORS.black,
    textAlign: 'center',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    paddingHorizontal: 10,
    marginTop: 20,
    marginBottom: 10,
  },

  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: COLORS.black,
  },

  clearButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.danger,
    marginLeft: 8,
  },

  dropdown: {
    backgroundColor: COLORS.white,
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

  tag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  tagText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },

  itemText: {
    marginTop: 16,
    fontSize: 14,
  },

  price: {
    marginTop: 4,
    fontWeight: 'bold',
    color: COLORS.black,
  },

  marcaList: {
    marginTop: 10,
  },

  card: {
    padding: 16,
    backgroundColor: COLORS.cardBg,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.black,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  ofertaLabel: {
    color: COLORS.danger,
    fontWeight: 'bold',
    marginTop: 5,
  },

  refreshButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },

  refreshText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});