import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TextInput } from 'react-native';
import { fetchSheetNames, fetchSheetData } from '../utils/sheets'; // usas las funciones que ya tienes
import { loginWithGoogle, updateSheetData } from '../utils/googleAuth'; // nuevas funciones

const AdminSheetEditor = () => {
  const [token, setToken] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [data, setData] = useState([]);
  const [editRow, setEditRow] = useState(null);

  useEffect(() => {
    fetchSheetNames().then(setSheets);
  }, []);

  const handleLogin = async () => {
    const t = await loginWithGoogle();
    setToken(t);
  };

  const openSheet = async (sheetName) => {
    setSelectedSheet(sheetName);
    const values = await fetchSheetData(sheetName);
    setData(values);
  };

  const saveRow = async (rowIndex) => {
    if (!token) return alert("Inicia sesión primero");
    const rowValues = data[rowIndex];
    await updateSheetData(selectedSheet, `A${rowIndex + 1}:I${rowIndex + 1}`, [rowValues], token);
    alert("Fila actualizada en Google Sheets ✅");
  };

  return (
    <View style={{ padding: 16 }}>
      {!token && <Button title="Iniciar sesión con Google" onPress={handleLogin} />}
      {sheets.length > 0 && !selectedSheet && (
        <FlatList
          data={sheets}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Button title={item} onPress={() => openSheet(item)} />
          )}
        />
      )}
      {selectedSheet && (
        <FlatList
          data={data}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={({ item, index }) => (
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {item.map((cell, colIdx) => (
                <TextInput
                  key={colIdx}
                  style={{ borderWidth: 1, padding: 4, flex: 1 }}
                  value={cell}
                  onChangeText={(text) => {
                    const newData = [...data];
                    newData[index][colIdx] = text;
                    setData(newData);
                  }}
                />
              ))}
              <Button title="💾" onPress={() => saveRow(index)} />
            </View>
          )}
        />
      )}
    </View>
  );
};

export default AdminSheetEditor;
