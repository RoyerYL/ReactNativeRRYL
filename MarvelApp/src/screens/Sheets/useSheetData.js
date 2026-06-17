/**
 * useSheetData.js
 * Custom hook que encapsula toda la lógica de estado de SheetView:
 * - carga inicial de datos
 * - refresco manual
 * - búsqueda filtrada
 *
 * El componente SheetView solo se preocupa por el render.
 */

import { useEffect, useMemo, useState } from 'react';
import { loadData, refreshData as refreshService } from '../../services/sheetsService';
import { flattenFromAllData, filterItems } from '../../utils/helpers';

/**
 * getItems
 * Entrada: data
 * Salida: array plano de todos los items
 *
 * Usa allItems si ya existe en data (datos nuevos),
 * o reconstruye desde allData como fallback (datos legacy).
 */
const getItems = (data) => {
  if (!data) return [];
  if (Array.isArray(data.allItems) && data.allItems.length) {
    return data.allItems;
  }
  return flattenFromAllData(data.allData);
};

const useSheetData = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery]     = useState('');

  // Carga inicial al montar
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: loaded } = await loadData();
      setData(loaded);
      setLoading(false);
    };
    init();
  }, []);

  // Lista plana de items memoizada
  const items = useMemo(() => getItems(data), [data]);

  // Resultados de búsqueda memoizados
  const filtered = useMemo(() => filterItems(items, query), [items, query]);

  // Refresco manual forzado
  const refresh = async () => {
    setLoading(true);
    const fresh = await refreshService();
    setData(fresh);
    setLoading(false);
  };

  return {
    data,
    loading,
    query,
    setQuery,
    filtered,
    refresh,
  };
};

export default useSheetData;