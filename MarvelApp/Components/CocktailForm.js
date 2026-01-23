import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';

import SimpleDatabase from './simpleDatabase';

export default function CocktailForm({ navigation, route }) {

  // si viene cocktail => edición
  const cocktailId = route?.params?.cocktailId || null;

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    categoria: '',
    descripcion: '',
    precio1: '',
    precio2: '',
    tiempo_preparacion: ''
  });

  /* ===================== LOAD EDIT ===================== */

  useEffect(() => {
    if (cocktailId) {
      loadCocktail();
    }
  }, [cocktailId]);

  const loadCocktail = async () => {
    setLoading(true);
    const data = await SimpleDatabase.getCocktailById(cocktailId);
    if (data) {
      setForm({
        nombre: data.nombre || '',
        categoria: data.categoria || '',
        descripcion: data.descripcion || '',
        precio1: String(data.precio1 || ''),
        precio2: String(data.precio2 || ''),
        tiempo_preparacion: String(data.tiempo_preparacion || '')
      });
    }
    setLoading(false);
  };

  /* ===================== SAVE ===================== */

  const save = async () => {
    if (!form.nombre || !form.precio1) {
      Alert.alert('Error', 'Nombre y precio son obligatorios');
      return;
    }

    const payload = {
      nombre: form.nombre,
      categoria: form.categoria,
      descripcion: form.descripcion,
      precio1: Number(form.precio1),
      precio2: form.precio2 ? Number(form.precio2) : null,
      tiempo_preparacion: form.tiempo_preparacion
        ? Number(form.tiempo_preparacion)
        : null
    };

    setLoading(true);

    if (cocktailId) {
      await SimpleDatabase.updateCocktail(cocktailId, payload);
      Alert.alert('Listo', 'Cocktail actualizado');
    } else {
      await SimpleDatabase.addCocktail(payload);
      Alert.alert('Listo', 'Cocktail creado');
    }

    setLoading(false);
     navigation.navigate('Marcas');
  };

  /* ===================== UI ===================== */

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {cocktailId ? 'Editar Cocktail' : 'Nuevo Cocktail'}
      </Text>

      <Input
        label="Nombre"
        value={form.nombre}
        onChange={v => setForm({ ...form, nombre: v })}
      />

      <Input
        label="Categoría"
        value={form.categoria}
        onChange={v => setForm({ ...form, categoria: v })}
      />

      <Input
        label="Descripción"
        value={form.descripcion}
        onChange={v => setForm({ ...form, descripcion: v })}
        multiline
      />

      <Input
        label="Precio"
        value={form.precio1}
        keyboardType="numeric"
        onChange={v => setForm({ ...form, precio1: v })}
      />

      <Input
        label="Precio alternativo"
        value={form.precio2}
        keyboardType="numeric"
        onChange={v => setForm({ ...form, precio2: v })}
      />

      <Input
        label="Tiempo preparación (min)"
        value={form.tiempo_preparacion}
        keyboardType="numeric"
        onChange={v => setForm({ ...form, tiempo_preparacion: v })}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={save}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Guardando...' : 'Guardar'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ===================== INPUT ===================== */

function Input({ label, value, onChange, multiline = false, ...props }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        {...props}
      />
    </View>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: {
    padding: 20
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20
  },
  inputGroup: {
    marginBottom: 15
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    color: '#555'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#fff'
  },
  multiline: {
    height: 80,
    textAlignVertical: 'top'
  },
  button: {
    marginTop: 20,
    backgroundColor: '#111',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});
