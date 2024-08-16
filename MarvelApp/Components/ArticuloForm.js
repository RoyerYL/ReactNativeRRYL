import React, { useState } from 'react';
import { View, TextInput, Button, Text, ScrollView } from 'react-native';
import axios from 'axios';

const ArticuloForm = ({ navigation }) => {
  const [form, setForm] = useState({
    id: '',
    name: '',
    stock: '',
    stockMin: '',
    costoPeso: '',
    costoDolar: '',
    iva: '',
    ganancia: '',
    precioVenta: '',
    ganancia_2: '',
    precioVenta_2: '',
    descripcion: '',
    img: '',
    categoriaId: '',
    provedorId: '',
    precioEnDolar: ''
  });

  const handleInputChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post('backendrryl.onrender.com/tienda/articulo/articulo', form);
      console.log('Artículo creado:', response.data);
      navigation.navigate('ArticuloList'); // Navegar a la lista después de crear
    } catch (error) {
      console.error('Error al crear el artículo:', error.response.data);
    }
  };

  return (
    <ScrollView>
      <View>
        <TextInput
          placeholder="ID"
          value={form.id}
          onChangeText={value => handleInputChange('id', value)}
        />
        <TextInput
          placeholder="Nombre"
          value={form.name}
          onChangeText={value => handleInputChange('name', value)}
        />
        <TextInput
          placeholder="Stock"
          value={form.stock}
          onChangeText={value => handleInputChange('stock', value)}
        />
        <TextInput
          placeholder="Stock Mínimo"
          value={form.stockMin}
          onChangeText={value => handleInputChange('stockMin', value)}
        />
        <TextInput
          placeholder="Costo en Pesos"
          value={form.costoPeso}
          onChangeText={value => handleInputChange('costoPeso', value)}
        />
        <TextInput
          placeholder="Costo en Dólares"
          value={form.costoDolar}
          onChangeText={value => handleInputChange('costoDolar', value)}
        />
        <TextInput
          placeholder="IVA"
          value={form.iva}
          onChangeText={value => handleInputChange('iva', value)}
        />
        <TextInput
          placeholder="Ganancia"
          value={form.ganancia}
          onChangeText={value => handleInputChange('ganancia', value)}
        />
        <TextInput
          placeholder="Precio de Venta"
          value={form.precioVenta}
          onChangeText={value => handleInputChange('precioVenta', value)}
        />
        <TextInput
          placeholder="Ganancia 2"
          value={form.ganancia_2}
          onChangeText={value => handleInputChange('ganancia_2', value)}
        />
        <TextInput
          placeholder="Precio de Venta 2"
          value={form.precioVenta_2}
          onChangeText={value => handleInputChange('precioVenta_2', value)}
        />
        <TextInput
          placeholder="Descripción"
          value={form.descripcion}
          onChangeText={value => handleInputChange('descripcion', value)}
        />
        <TextInput
          placeholder="Imagen"
          value={form.img}
          onChangeText={value => handleInputChange('img', value)}
        />
        <TextInput
          placeholder="ID de Categoría"
          value={form.categoriaId}
          onChangeText={value => handleInputChange('categoriaId', value)}
        />
        <TextInput
          placeholder="ID de Proveedor"
          value={form.provedorId}
          onChangeText={value => handleInputChange('provedorId', value)}
        />
        <TextInput
          placeholder="Precio en Dólares"
          value={form.precioEnDolar}
          onChangeText={value => handleInputChange('precioEnDolar', value)}
        />
        <Button title="Crear Artículo" onPress={handleSubmit} />
      </View>
    </ScrollView>
  );
};

export default ArticuloForm;
