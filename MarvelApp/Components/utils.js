
import AsyncStorage from '@react-native-async-storage/async-storage';

const SHEET_ID = '1zAdqkuP0MWF7MKpHqB4IoWidSTuQz0_ORX8-TVMcDOk';
const API_KEY = 'AIzaSyAStpB3GNAAGlmAM7nBVvFp5wcsKlyEtCE';

const fetchSheetNames = async () => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  return json.sheets.map(sheet => sheet.properties.title);
};

const fetchSheetData = async (sheetName) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(sheetName)}!A1:I200?key=${API_KEY}`;
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
      currentSection = { section: row[0], items: [], ofertas: 0 };
      result.push(currentSection);
    } else if (currentSection && row.length > 1) {
      const item = {};
      headers.forEach((header, idx) => {
        item[header] = row[idx] ?? '';
      });
      // 🔍 Busca "OFERTA" en cualquier celda de la fila
      const tieneOferta = row.some(celda =>
        typeof celda === 'string' && celda.trim().toUpperCase() === 'OFERTA'
      );

      item['OFERTA'] = tieneOferta ? 1 : 0;

      if (tieneOferta) {
        currentSection.ofertas += 1; // Incrementa el contador
      }
      currentSection.items.push(item);
    }
  }

  return result;
};

// 🆕 Genera resumen por marca
const getBrandSummary = (allData) => {
  const resumen = {};
  for (const marca in allData) {
    let totalMaquinas = 0;
    let totalOfertas = 0;
    allData[marca].forEach(section => {
      totalMaquinas += section.items.length;
      totalOfertas += section.ofertas || 0;
    });
    resumen[marca] = { maquinas: totalMaquinas, ofertas: totalOfertas };
  }
  return resumen;
};

const loadAllData = async () => {
  const sheetNames = await fetchSheetNames();

  const allData = {};
  for (const sheetName of sheetNames) {
    const values = await fetchSheetData(sheetName);
    allData[sheetName] = parseSheet(values);
  }

  const resumenPorMarca = getBrandSummary(allData);


  await AsyncStorage.setItem('@sheetData', JSON.stringify({ allData, resumenPorMarca }));

  return { allData, resumenPorMarca };
};

export { loadAllData, parseSheet, fetchSheetNames, fetchSheetData };