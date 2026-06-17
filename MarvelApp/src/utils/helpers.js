/**
 * helpers.js
 * Funciones utilitarias puras (sin side effects, sin estado).
 * Fáciles de testear de forma aislada.
 */

/**
 * normalize
 * Entrada: string (s)
 * Salida: string normalizado (minúsculas, sin acentos)
 *
 * Se usa para comparar texto en búsquedas de forma flexible.
 */
export const normalize = (s) =>
  s
    ? s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    : '';

/**
 * flattenFromAllData
 * Entrada: allData — estructura { [marca]: [ { section, items[] } ] }
 * Salida: array plano con todos los items, cada uno con { marca, section }
 *
 * Permite buscar en todos los productos sin importar la jerarquía.
 */
export const flattenFromAllData = (allData) => {
  if (!allData) return [];

  const out = [];

  for (const marca in allData) {
    allData[marca]?.forEach((section) => {
      section.items?.forEach((item) => {
        out.push({
          ...item,
          marca,
          section: section.section,
        });
      });
    });
  }

  return out;
};

/**
 * parsePrecioPesos
 * Entrada: string con formato "$1.234,56"
 * Salida: número flotante
 *
 * Limpia el formato argentino de precio para poder ordenar.
 */
const parsePrecioPesos = (precio = '') =>
  Number(
    precio
      .replace('$', '')
      .replace(/\./g, '')   // quita separador de miles
      .replace(',', '.')    // convierte coma decimal a punto
      .trim()
  );

/**
 * ordenarPorPrecioPesos
 * Entrada: array de items
 * Salida: nuevo array ordenado de menor a mayor precio
 *
 * No muta el array original (usa spread).
 */
export const ordenarPorPrecioPesos = (lista) =>
  [...lista].sort(
    (a, b) =>
      parsePrecioPesos(a['PRECIO FINAL EN PESOS']) -
      parsePrecioPesos(b['PRECIO FINAL EN PESOS'])
  );

/**
 * filterItems
 * Entrada:
 *   - items: array plano de productos
 *   - query: string de búsqueda
 * Salida: array filtrado (máximo MAX_RESULTS resultados)
 *
 * Compara cada término del query contra CODIGO, MAQUINAS y marca.
 */
const MAX_RESULTS = 30;

export const filterItems = (items, query) => {
  if (!query.trim()) return [];

  const terms = normalize(query).split(' ').filter(Boolean);

  const matched = items.filter((item) => {
    const haystack = [
      normalize(item.CODIGO),
      normalize(item.MAQUINAS),
      normalize(item.marca),
    ].join(' ');

    return terms.every((t) => haystack.includes(t));
  });

  return ordenarPorPrecioPesos(matched).slice(0, MAX_RESULTS);
};