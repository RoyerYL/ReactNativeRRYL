import React, { useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

const ArticuloList = ({ navigation }) => {
  const [articulos, setArticulos] = useState([]);

  const fetchArticulos = async () => {
    try {
      const response = await axios.get('https://backendrryl.onrender.com/tienda/articulo');
      console.log(response.data);
      setArticulos(response.data.items);
    } catch (error) {
      console.error('Error al obtener los artículos:', error.response.data);
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
      <Text>Stock: {item.stock}</Text>
      <Text>Stock Mínimo: {item.stockMin}</Text>
      <Text>Costo en Pesos: {item.costoPeso}</Text>
      <Text>Costo en Dólares: {item.costoDolar}</Text>
      <Text>IVA: {item.iva}</Text>
      <Text>Ganancia: {item.ganancia}</Text>
      <Text>Precio de Venta: {item.precioVenta}</Text>
      <Text>Ganancia 2: {item.ganancia_2}</Text>
      <Text>Precio de Venta 2: {item.precioVenta_2}</Text>
      <Text>Descripción: {item.descripcion}</Text>
      <Text>Imagen: {item.img}</Text>
      <Text>Activo: {item.activo ? 'Sí' : 'No'}</Text>
      <Text>Cantidad Vendidos: {item.cantVendidos}</Text>
      <Text>Categoría ID: {item.CategoriaId}</Text>
      <Text>Proveedor ID: {item.ProvedorId}</Text>
      <Text>Precio en Dólares: {item.precioEnDolar ? 'Sí' : 'No'}</Text>
    </View>
  );

  return (
    <FlatList
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
