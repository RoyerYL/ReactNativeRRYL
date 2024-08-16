import React, { useState } from 'react';
import { View, TextInput, Button, Text, ScrollView } from 'react-native';
import axios from 'axios';

const ArticuloForm = ({ navigation }) => {
  const [form, setForm] = useState({
    name: "",
    id: "",
    stock: "0",
    stockMin: "0",
    costoPeso: "0.00",
    costoDolar: "0.00",
    precioVenta: "0.00",
    ganancia: "0",
    precioVenta_2: "0.00",
    ganancia_2: "0",
    descripcion: "",
    iva: "21",
    img: "",
    activo: true,
    CategoriaId: "0",
    ProvedorId: "1",
    precioEnDolar: false
  });

  const handleInputChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async () => {
    try {
      await axios.post('https://backendrryl.onrender.com/tienda/articulo/articulo', {
        ...form,
        stock: parseInt(form.stock, 10),
        stockMin: parseInt(form.stockMin, 10),
        costoPeso: parseFloat(form.costoPeso).toFixed(2),
        costoDolar: parseFloat(form.costoDolar).toFixed(2),
        precioVenta: parseFloat(form.precioVenta).toFixed(2),
        ganancia: parseInt(form.ganancia, 10),
        precioVenta_2: parseFloat(form.precioVenta_2).toFixed(2),
        ganancia_2: parseInt(form.ganancia_2, 10),
        iva: parseInt(form.iva, 10),
        CategoriaId: parseInt(form.CategoriaId, 10),
        ProvedorId: parseInt(form.ProvedorId, 10)
      }).then(data => {
        console.log('Artículo creado:', data);
        navigation.navigate('ArticuloList');
      }).catch(error => {
        console.error('Error al crear el producto:', error.response.data);
      });
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
          keyboardType="numeric"
          value={form.stock}
          onChangeText={value => handleInputChange('stock', value)}
        />
        <TextInput
          placeholder="Stock Mínimo"
          keyboardType="numeric"
          value={form.stockMin}
          onChangeText={value => handleInputChange('stockMin', value)}
        />
        <TextInput
          placeholder="Costo en Pesos"
          keyboardType="numeric"
          value={form.costoPeso}
          onChangeText={value => handleInputChange('costoPeso', value)}
        />
        <TextInput
          placeholder="Costo en Dólares"
          keyboardType="numeric"
          value={form.costoDolar}
          onChangeText={value => handleInputChange('costoDolar', value)}
        />
        <TextInput
          placeholder="IVA"
          keyboardType="numeric"
          value={form.iva}
          onChangeText={value => handleInputChange('iva', value)}
        />
        <TextInput
          placeholder="Ganancia"
          keyboardType="numeric"
          value={form.ganancia}
          onChangeText={value => handleInputChange('ganancia', value)}
        />
        <TextInput
          placeholder="Precio de Venta"
          keyboardType="numeric"
          value={form.precioVenta}
          onChangeText={value => handleInputChange('precioVenta', value)}
        />
        <TextInput
          placeholder="Ganancia 2"
          keyboardType="numeric"
          value={form.ganancia_2}
          onChangeText={value => handleInputChange('ganancia_2', value)}
        />
        <TextInput
          placeholder="Precio de Venta 2"
          keyboardType="numeric"
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
          keyboardType="numeric"
          value={form.CategoriaId}
          onChangeText={value => handleInputChange('CategoriaId', value)}
        />
        <TextInput
          placeholder="ID de Proveedor"
          keyboardType="numeric"
          value={form.ProvedorId}
          onChangeText={value => handleInputChange('ProvedorId', value)}
        />
        <Button title="Crear Artículo" onPress={handleSubmit} />
      </View>
    </ScrollView>
  );
};

export default ArticuloForm;
