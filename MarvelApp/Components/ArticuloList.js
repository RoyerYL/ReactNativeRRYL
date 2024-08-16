import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import axios from 'axios';

const ArticuloList = ({ navigation }) => {
  const [articulos, setArticulos] = useState([]);

  useEffect(() => {
    const fetchArticulos = async () => {
      try {
        const response = await axios.get('backendrryl.onrender.com/tienda/articulo');
        setArticulos(response.data.items);
      } catch (error) {
        console.error('Error al obtener los artículos:', error.response.data);
      }
    };

    fetchArticulos();
  }, []);

  return (
    <View>
      <FlatList
        data={articulos}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name}</Text>
            <Text>{item.precioVenta}</Text>
          </View>
        )}
      />
      <Button title="Crear Nuevo Artículo" onPress={() => navigation.navigate('ArticuloForm')} />
    </View>
  );
};

export default ArticuloList;
