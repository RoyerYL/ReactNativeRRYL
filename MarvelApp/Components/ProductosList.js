// src/components/ProductosList.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { getProductos } from './database';

const ProductosList = () => {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    getProductos().then(setProductos).catch(console.error);
  }, []);

  return (
    <FlatList
      data={productos}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={{ padding: 10, borderBottomWidth: 1 }}>
          <Text style={{ fontWeight: 'bold' }}>{item.hoja} - {item.seccion}</Text>
          <Text>{item.codigo} - {item.maquina}</Text>
          <Text>Precio gremio: {item.precio_gremio} | Público: {item.precio_publico_dolar}</Text>
          <Text>En pesos: {item.precio_final_pesos}</Text>
        </View>
      )}
    />
  );
};

export default ProductosList;
