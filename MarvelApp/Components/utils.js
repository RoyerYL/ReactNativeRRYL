
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

export { loadAllData , parseSheet , fetchSheetNames  , fetchSheetData};