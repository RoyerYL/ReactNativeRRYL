/**
 * sheetsService.js
 * Servicio de datos: carga desde cache (AsyncStorage) o desde la fuente remota.
 *
 * Separar esta lógica del componente permite:
 * - Testear la carga de datos sin montar componentes.
 * - Reutilizar en otras pantallas si fuera necesario.
 * - Cambiar la fuente de datos (ej: API REST) sin tocar la UI.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadAllData } from '../../Components/utils'; // ajustar ruta si es distinta

const STORAGE_KEY = '@data';

/**
 * getDataFromCache
 * Salida: datos parseados o null si no hay caché válido
 */
const getDataFromCache = async () => {
  try {
    const jsonStr = await AsyncStorage.getItem(STORAGE_KEY);
    if (!jsonStr) return null;
    return JSON.parse(jsonStr);
  } catch {
    // JSON corrupto u otro error de lectura
    return null;
  }
};

/**
 * saveDataToCache
 * Entrada: data (objeto serializable)
 * Guarda los datos en AsyncStorage para uso offline.
 */
const saveDataToCache = async (data) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Fallo silencioso: no es crítico si no se puede guardar
    console.warn('sheetsService: no se pudo guardar en caché');
  }
};

/**
 * fetchData
 * Entrada: ninguna
 * Salida: datos frescos desde la fuente remota
 *
 * También actualiza el caché con los datos nuevos.
 */
const fetchData = async () => {
  const fresh = await loadAllData();
  await saveDataToCache(fresh);
  return fresh;
};

/**
 * loadData
 * Entrada: ninguna
 * Salida: { data, fromCache: boolean }
 *
 * Intenta usar el caché primero. Si no hay caché válido, descarga datos frescos.
 * Es el punto de entrada principal para los componentes.
 */
export const loadData = async () => {
  const cached = await getDataFromCache();

  if (cached) {
    return { data: cached, fromCache: true };
  }

  const fresh = await fetchData();
  return { data: fresh, fromCache: false };
};

/**
 * refreshData
 * Entrada: ninguna
 * Salida: datos frescos (ignora el caché)
 *
 * Se usa cuando el usuario presiona "Actualizar datos".
 */
export const refreshData = async () => {
  return fetchData();
};