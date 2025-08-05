import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

const SheetView = () => {
  const [sections, setSections] = useState([]);
  const SHEET_ID = '1zAdqkuP0MWF7MKpHqB4IoWidSTuQz0_ORX8-TVMcDOk';
  const API_KEY = 'AIzaSyAStpB3GNAAGlmAM7nBVvFp5wcsKlyEtCE';

  useEffect(() => {
    // Primero obtenemos los nombres de las hojas
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`)
      .then(res => res.json())
      .then(async meta => {
        const sheetTitles = meta.sheets.map(sheet => sheet.properties.title);
        const allSections = [];

        for (let title of sheetTitles) {
          const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${title}!A1:H1000?key=${API_KEY}`);
          const data = await res.json();

          if (!data.values || data.values.length < 2) continue;

          const rows = data.values;
          const headers = rows[1];
          const result = { sheet: title, sections: [] };
          let currentSection = null;

          for (let i = 2; i < rows.length; i++) {
            const row = rows[i];

            if (row[0] && row.length === 1) {
              // Nueva sección como RECTAS, OVERLOCK, etc.
              currentSection = { section: row[0], items: [] };
              result.sections.push(currentSection);
            } else if (row.length > 1 && currentSection) {
              const item = headers.reduce((obj, header, idx) => {
                obj[header] = row[idx] || '';
                return obj;
              }, {});
              currentSection.items.push(item);
            }
          }

          allSections.push(result);
        }

        setSections(allSections);
      })
      .catch(err => console.error('Error:', err));
  }, []);

  return (
    <ScrollView style={{ padding: 10 }}>
      {sections.map((sheet, i) => (
        <View key={i} style={{ marginBottom: 30 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>{sheet.sheet}</Text>

          {sheet.sections.map((sec, j) => (
            <View key={j} style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 5 }}>{sec.section}</Text>

              {sec.items.map((item, k) => (
                <View key={k} style={{ backgroundColor: '#eee', padding: 8, marginVertical: 4 }}>
                  <Text>Código: {item['CODIGO']}</Text>
                  {console.log(sections)}
                  
                  <Text>Máquina: {item['MAQUINAS']}</Text>
                  <Text>Precio gremio: {item['PRECIO DOLAR AL GREMIO']}</Text>
                  <Text>Precio público: {item['PRECIO FINAL EN DOLARES AL PUBLICO']}</Text>
                  <Text>Pesos: {item['PRECIO FINAL EN PESOS']}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

export default SheetView;
