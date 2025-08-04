import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

const SheetView = () => {
  const [sections, setSections] = useState([]);
  const SHEET_ID = '1WFMURuJ2SI92L-ig7eOwjBCz1ZJ6tvJScX-KULDsXQc';
  const TU_API_KEY = 'AIzaSyAN0iI2H0XeFFWLNpMmE866R2SjMAi7xfI';
  const SHEET_NAME = 'Jack'; // Usá el nombre correcto de tu pestaña

 useEffect(() => {
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/1WFMURuJ2SI92L-ig7eOwjBCz1ZJ6tvJScX-KULDsXQc/values/Hoja1!A1:D100?key=${TU_API_KEY}
`)
      .then(res => res.json())
      .then(data => {
        const rows = data.values;
        const headers = rows[1]; // Asumimos que fila 2 tiene los encabezados
        const result = [];
        let currentSection = null;

        for (let i = 2; i < rows.length; i++) {
          const row = rows[i];
          if (row[0] && row.length === 1) {
            // es una sección (ej: RECTAS, OVERLOCK, etc.)
            currentSection = { section: row[0], items: [] };
            result.push(currentSection);
          } else if (row.length > 1 && currentSection) {
            const item = {};
            headers.forEach((header, idx) => {
              item[header] = row[idx];
            });
            currentSection.items.push(item);
          }
        }

        setSections(result);
      })
      .catch(err => console.error('Error:', err));
  }, []);

  return (
    <ScrollView style={{ padding: 10 }}>
      {sections.map((sec, i) => (
        <View key={i} style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 5 }}>{sec.section}</Text>
          {sec.items.map((item, j) => (
            <View key={j} style={{ backgroundColor: '#eee', padding: 8, marginVertical: 4 }}>
              <Text>Código: {item['CODIGO']}</Text>
              <Text>Máquina: {item['MAQUINAS']}</Text>
              <Text>Precio gremio: {item['PRECIO DOLAR AL GREMIO']}</Text>
              <Text>Precio público: {item['PRECIO FINAL EN DOLARES AL PUBLICO']}</Text>
              <Text>Pesos: {item['PRECIO FINAL EN PESOS']}</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

export default SheetView;
