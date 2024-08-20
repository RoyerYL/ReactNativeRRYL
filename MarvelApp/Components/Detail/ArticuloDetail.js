import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Detail = ({ route }) => {
  const { item } = route.params; // Obtener el artículo desde los parámetros

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalle del Artículo</Text>
      <Text style={styles.label}>Nombre: {item.name}</Text>
      <Text>ID: {item.id}</Text>
      <Text>Stock: {item.stock}</Text>
      <Text>Costo en Pesos: {item.costoPeso}</Text>
      {/* Muestra otros detalles del artículo */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 18,
    marginBottom: 8,
  },
});

export default Detail;
