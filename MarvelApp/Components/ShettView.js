import React, { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import { loadAllData } from './utils'; // extraí esa lógica si querés
const SheetView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const loadDataFromStorage = async () => {
    setLoading(true);
    const jsonStr = await AsyncStorage.getItem('@data');

    if (jsonStr) {
      setData(JSON.parse(jsonStr));
      
    } else {
      const freshData = await loadAllData();
      setData(freshData);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDataFromStorage();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    const freshData = await loadAllData();

    setData(freshData);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No hay datos para mostrar</Text>
        <Button title="Cargar datos" onPress={refreshData} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 10, color: '#black ', textAlign: 'center' }}>Precio de Maquinas</Text>
      <ScrollView style={{ marginTop: 10 }}>
        {Object.entries(data.resumenPorMarca).map(([marcaName, resumen]) => (
          <TouchableOpacity
            key={marcaName}
            style={{
              padding: 16,
              backgroundColor: '#eeeeeeb9',
              marginBottom: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#000',
              borderStyle: 'solid',
            }}
            onPress={() =>
              navigation.navigate('MarcaDetalle', {
                marcaName,
                marcaData: data.allData[marcaName],
              })
            }
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{marcaName}</Text>
            <Text>Máquinas: {resumen.maquinas}</Text>
            <Text>Ofertas: {resumen.ofertas}</Text>

            {/* Mensaje especial si hay ofertas */}
            {resumen.ofertas > 0 && (
              <Text style={{ color: 'red', fontWeight: 'bold', marginTop: 5 }}>
                🔥 ¡Esta marca tiene ofertas disponibles!
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>


      <TouchableOpacity
        onPress={refreshData}
        style={{
          backgroundColor: '#ff8000',

          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 10
        }}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
          Actualizar datos
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SheetView;
