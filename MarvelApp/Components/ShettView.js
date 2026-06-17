// Importación de React y hooks necesarios
import React, { useEffect, useMemo, useState } from 'react';

// Importación de componentes de React Native utilizados en la UI
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

// Librería para guardar y leer datos persistentes en el dispositivo
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hook de navegación de React Navigation
import { useNavigation } from '@react-navigation/native';

// Función externa que carga todos los datos desde Google Sheets u otra fuente
import { loadAllData } from './utils';

/**
 * Función normalize
 * Entrada: string (s)
 * Salida: string normalizado
 * 
 * Convierte el texto a minúsculas, elimina acentos y caracteres especiales
 * para facilitar comparaciones en búsquedas.
 */
const normalize = (s) =>
  s
    ? s
      .toLowerCase() // convierte a minúsculas
      .normalize('NFD') // separa letras de acentos
      .replace(/[\u0300-\u036f]/g, '') // elimina los acentos
    : '';

/**
 * Componente principal de la pantalla
 * Muestra:
 * - buscador de productos
 * - resultados filtrados
 * - listado de marcas
 */
const SheetView = () => {

  // Estado que guarda toda la información cargada
  // estructura esperada:
  // {
  //   allData,
  //   resumenPorMarca,
  //   allItems
  // }
  const [data, setData] = useState(null);

  // Estado para mostrar indicador de carga
  const [loading, setLoading] = useState(false);

  // Texto ingresado en el buscador
  const [query, setQuery] = useState('');

  // Resultados filtrados según la búsqueda
  const [filtered, setFiltered] = useState([]);

  // Hook para navegar entre pantallas
  const navigation = useNavigation();

  /**
   * flattenFromAllData
   * Entrada: allData (estructura agrupada por marca)
   * Salida: array plano de todos los items
   * 
   * Convierte la estructura jerárquica:
   * marca -> secciones -> items
   * 
   * en un solo array de items para poder buscar más fácilmente.
   */
  const flattenFromAllData = (allData) => {
    if (!allData) return [];

    const out = [];

    for (const marca in allData) {
      allData[marca]?.forEach((section) => {
        section.items?.forEach((item) => {
          out.push({
            ...item,
            marca, // agrega marca al item
            section: section.section, // agrega sección
          });
        });
      });
    }

    return out;
  };

  /**
   * items (useMemo)
   * Entrada: data
   * Salida: lista de todos los items
   * 
   * Si data ya tiene "allItems" lo usa directamente.
   * Si no existe (datos antiguos), reconstruye el array
   * usando flattenFromAllData.
   */
  const items = useMemo(() => {
    if (!data) return [];

    if (Array.isArray(data.allItems) && data.allItems.length) {
      return data.allItems;
    }

    // fallback para datos antiguos
    return flattenFromAllData(data.allData);
  }, [data]);

  /**
   * loadDataFromStorage
   * Entrada: ninguna
   * Salida: actualiza el estado data
   * 
   * Intenta cargar datos desde AsyncStorage (@data).
   * Si no existen o están corruptos:
   * - vuelve a cargarlos desde loadAllData().
   */
  const loadDataFromStorage = async () => {
    setLoading(true);

    const jsonStr = await AsyncStorage.getItem('@data');

    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);

        setData(parsed);
      } catch {
        // si falla el parseo, vuelve a descargar los datos
        const fresh = await loadAllData();
        setData(fresh);
      }
    } else {
      // si no hay datos guardados
      const fresh = await loadAllData();
      setData(fresh);
    }

    setLoading(false);
  };

  /**
   * useEffect inicial
   * Se ejecuta solo una vez al montar el componente
   * 
   * Carga los datos desde almacenamiento o servidor.
   */
  useEffect(() => {
    loadDataFromStorage();
  }, []);

  /**
   * refreshData
   * Entrada: ninguna
   * Salida: actualiza el estado data
   * 
   * Fuerza la actualización de los datos
   * llamando nuevamente a loadAllData().
   */
  const refreshData = async () => {
    setLoading(true);

    const fresh = await loadAllData();

    setData(fresh);

    setLoading(false);
  };

  /**
   * useEffect de búsqueda
   * Entrada:
   * - query (texto buscado)
   * - items (lista de productos)
   * 
   * Salida:
   * - actualiza el estado filtered
   * 
   * Filtra los productos comparando:
   * - CODIGO
   * - MAQUINAS
   * - marca
   */
  useEffect(() => {
    if (!query.trim()) {
      setFiltered([]);
      return;
    }

    // separa palabras de búsqueda
    const terms = normalize(query).split(' ').filter(Boolean);

    const res = items.filter((item) => {
      const haystack = `${normalize(item.CODIGO)} ${normalize(item.MAQUINAS)} ${normalize(item.marca)}`;

      return terms.every((t) => haystack.includes(t));
    });

    // limita resultados a 15
    const listaOrdenada = ordenarPorPrecioPesos(res);
    setFiltered(listaOrdenada.slice(0, 30));

  }, [query, items]);
  const ordenarPorPrecioPesos = (lista) => {
    const limpiarPrecio = (precio) => {
      return Number(
        precio
          .replace('$', '')      // quita $
          .replace(/\./g, '')    // quita separador de miles
          .replace(',', '.')     // convierte decimal
          .trim()
      );
    };

    return [...lista].sort((a, b) => {
      return limpiarPrecio(a["PRECIO FINAL EN PESOS"]) - limpiarPrecio(b["PRECIO FINAL EN PESOS"]);
    });
  };
  /**
   * Render si está cargando datos
   */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /**
   * Render si no hay datos disponibles
   */
  if (!data) {
    return (
      <View style={styles.center}>
        <Text>No hay datos para mostrar</Text>

        <Button
          title="Cargar datos"
          onPress={refreshData}
        />
      </View>
    );
  }

  /**
   * Render principal de la pantalla
   */
  return (
    <View style={{ flex: 1, padding: 10 }}>
      {/* Título de sección */}
      <Text style={styles.title}>
        Maquinas Mequitex
      </Text>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o código..."
          value={query}
          onChangeText={setQuery}
        />

        {/* Botón para limpiar búsqueda */}
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearButton}>X</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Resultados de búsqueda */}
      {filtered.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={filtered}

            keyExtractor={(item, idx) =>
              `${item.marca}-${item.CODIGO}-${idx}`
            }

            renderItem={({ item }) => (

              // Al presionar navega al detalle
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('MarcaDetalle', { item })
                }
              >
                <View style={styles.dropdownItem}>

                  {/* etiqueta de marca */}
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      {item.marca}
                    </Text>
                  </View>

                  {/* código y nombre */}
                  <Text style={styles.itemText}>
                    {item.CODIGO} - {item.MAQUINAS}
                  </Text>

                  {/* precio */}
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



      {/* Lista de marcas */}
      <ScrollView style={{ marginTop: 10 }}>

        {Object.entries(data.resumenPorMarca).map(
          ([marcaName, resumen]) => (

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

              {/* Nombre de marca */}
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                {marcaName}
              </Text>

              {/* Cantidad de máquinas */}
              <Text>
                Máquinas: {resumen.maquinas}
              </Text>

              {/* Cantidad de ofertas */}
              <Text>
                Ofertas: {resumen.ofertas}
              </Text>

              {/* aviso de ofertas */}
              {resumen.ofertas > 0 && (
                <Text
                  style={{
                    color: 'red',
                    fontWeight: 'bold',
                    marginTop: 5,
                  }}
                >
                  🔥 ¡Esta marca tiene ofertas disponibles!
                </Text>
              )}

            </TouchableOpacity>
          )
        )}

      </ScrollView>

      {/* Botón actualizar datos */}
      <TouchableOpacity
        onPress={refreshData}
        style={styles.refreshButton}
      >
        <Text style={styles.refreshText}>
          Actualizar datos
        </Text>
      </TouchableOpacity>

    </View>
  );
};

export default SheetView;

/**
 * Estilos de la pantalla
 */
const styles = StyleSheet.create({

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

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

  searchInput: {
    color: "black",
    flex: 1,
    height: 40,
    fontSize: 16
  },

  clearButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff0000',
    marginLeft: 8
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
    borderBottomColor: '#eee'
  },

  itemText: {
    marginTop: 16,
    fontSize: 14
  },

  price: {
    marginTop: 4,
    fontWeight: 'bold',
    color: '#000000ff'
  },

  tag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },

  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#000',
    textAlign: 'center'
  },

  card: {
    padding: 16,
    backgroundColor: '#eeeeeeb9',
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000'
  },

  refreshButton: {
    backgroundColor: '#ff8000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10
  },

  refreshText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }

});