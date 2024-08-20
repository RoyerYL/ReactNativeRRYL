import React, { useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

const ArticuloList = ({ navigation }) => {
  const [articulos, setArticulos] = useState([]);
  const [load, setLoad]=useState(true)
  const fetchArticulos = async () => {
    try {
      const response = await axios.get('https://backendrryl.onrender.com/tienda/articulo');
      setArticulos(response.data.items);
    } catch (error) {
      console.error('Error al obtener los artículos:', error.response.data);
    }finally{
      setLoad(false)
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchArticulos();
    }, [])
  );

  const renderItem = ({ item }) => (
    <View style={styles.articuloContainer}>
      <Text style={styles.articuloTitle}>Nombre: {item.name}</Text>
      <Text>ID: {item.id}</Text>
      {/* Otros campos del artículo */}

      {/* Botón para ver los detalles */}
      <Button
        title="Ver Detalles"
        onPress={() => navigation.navigate('Detail', { item })}
      />
    </View>
  );

  return (
    <FlatList
    ListHeaderComponent={
      <View>
        {load?<Text>Cargando...</Text>:<></>}
      </View>
    }
      data={articulos}
      keyExtractor={item => item.id.toString()}
      renderItem={renderItem}
      ListFooterComponent={
        <Button
          style={styles.button}
          title="Crear Nuevo Artículo"
          onPress={() => navigation.navigate('ArticuloForm')}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  articuloContainer: {
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  articuloTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  button: {
    marginVertical: 20,
  },
});

export default ArticuloList;
