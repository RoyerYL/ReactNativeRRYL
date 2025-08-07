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
    const jsonStr = await AsyncStorage.getItem('@sheetData');
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
      <View style={{ flex: 1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={{ flex: 1, justifyContent:'center', alignItems:'center' }}>
        <Text>No hay datos para mostrar</Text>
        <Button title="Cargar datos" onPress={refreshData} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Button title="Actualizar datos" onPress={refreshData} />
      <ScrollView style={{ marginTop: 10 }}>
        {Object.entries(data).map(([marcaName, marcaData]) => (
          <TouchableOpacity
            key={marcaName}
            style={{ padding: 16, backgroundColor: '#eee', marginBottom: 10, borderRadius: 8 }}
            onPress={() => navigation.navigate('MarcaDetalle', { marcaName, marcaData })}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{marcaName}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default SheetView;
