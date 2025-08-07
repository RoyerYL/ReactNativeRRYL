import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Button, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const SHEET_ID = '1zAdqkuP0MWF7MKpHqB4IoWidSTuQz0_ORX8-TVMcDOk';
const API_KEY = 'AIzaSyAStpB3GNAAGlmAM7nBVvFp5wcsKlyEtCE';

const Tab = createMaterialTopTabNavigator();

const fetchSheetNames = async () => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  return json.sheets.map(sheet => sheet.properties.title);
};

const fetchSheetData = async (sheetName) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${API_KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  return json.values; // array de arrays
};

const parseSheet = (values) => {
  if (!values || values.length < 3) return [];

  const headers = values[1];
  const result = [];
  let currentSection = null;

  for (let i = 2; i < values.length; i++) {
    const row = values[i];
    if (row.length === 1 && row[0].trim() !== '') {
      currentSection = { section: row[0], items: [] };
      result.push(currentSection);
    } else if (currentSection && row.length > 1) {
      const item = {};
      headers.forEach((header, idx) => {
        item[header] = row[idx] ?? '';
      });
      currentSection.items.push(item);
    }
  }
  return result;
};

const loadAllData = async () => {
  const sheetNames = await fetchSheetNames();

  const allData = {};
  for (const sheetName of sheetNames) {
    const values = await fetchSheetData(sheetName);
    allData[sheetName] = parseSheet(values);
  }

  await AsyncStorage.setItem('@sheetData', JSON.stringify(allData));
  return allData;
};

const MarcaScreen = ({ route }) => {
  const { marcaName, marcaData } = route.params;
  const [selectedSection, setSelectedSection] = useState(null);

  const sectionsToShow = selectedSection
    ? marcaData.filter(sec => sec.section === selectedSection)
    : marcaData;

  const sectionOptions = marcaData.map(sec => sec.section);

  return (
    <View style={{ flex: 1, padding: 10 , backgroundColor:'#ffffffff'}}>
      <Text style={{color:'black', fontSize: 25, fontWeight: 'bold', marginBottom: 10 }}>{marcaName}</Text>

      <Picker
        selectedValue={selectedSection}
        onValueChange={(itemValue) => setSelectedSection(itemValue)}
        style={{ height: 50, color:'black', fontSize:20, marginBottom: 20 }}
      >
        <Picker.Item label="Todas las secciones" value={null} />
        {sectionOptions.map((sec, i) => (
          <Picker.Item key={i} label={sec} value={sec} />
        ))}
      </Picker>

      <ScrollView>
        {sectionsToShow.map((sec, i) => (
          <View key={i} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 25 , itemAlign:'center', fontWeight: 'bold', margin:"auto" }}>{sec.section}</Text>
            {sec.items.map((item, j) => (
              <View
                key={j}
                style={{
                  backgroundColor: '#eee',
                  padding: 8,
                  marginBottom: 5,
                  borderRadius: 5,
                  border : '1px solid black'
                }}
              >
                <Text style={{ fontWeight: 'bold', fontSize:20 }}>Máquina: {item['MAQUINAS']}</Text>
                <Text><Text style={{ fontWeight: 'bold' }}>Código:</Text> {item['CODIGO']}</Text>
                <Text><Text style={{ fontWeight: 'bold' }}>Precio gremio:</Text> {item['PRECIO DOLAR AL GREMIO']}</Text>
                <Text><Text style={{ fontWeight: 'bold' }}>Precio público:</Text> {item['PRECIO FINAL EN DOLARES AL PUBLICO']}</Text>
                <Text style={{ fontWeight: 'bold' , backgroundColor:'#00fa2183' , color:'black' , fontSize:18}}>Precio en pesos: {item['PRECIO FINAL EN PESOS']}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const SheetView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadDataFromStorage = async () => {
    setLoading(true);
    const jsonStr = await AsyncStorage.getItem('@sheetData');
    if (jsonStr) {
      setData(JSON.parse(jsonStr));
      setLoading(false);
    } else {
      const freshData = await loadAllData();
      setData(freshData);
      setLoading(false);
    }
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
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <Text>No hay datos para mostrar</Text>
        <Button title="Cargar datos" onPress={refreshData} />
      </View>
    );
  }

  return (
      <View style={{ flex: 1 }}>
        <Button title="Actualizar datos" onPress={refreshData} />
        <Tab.Navigator>
          {Object.entries(data).map(([marcaName, marcaData]) => (
            <Tab.Screen
              key={marcaName}
              name={marcaName}
              component={MarcaScreen}
              initialParams={{ marcaName, marcaData }}
            />
          ))}
        </Tab.Navigator>
      </View>
  );
};

export default SheetView;
