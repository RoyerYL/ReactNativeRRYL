/**
 * colors.js
 * Constantes de colores centralizadas para toda la app.
 * Importar desde acá siempre que se necesite un color.
 */

// Colores por marca — se usa en MarcaScreen y ItemCard
export const BRAND_COLORS = {
  SIRUBA:  { background: '#f04925', text: '#FFFFFF' },
  JACK:    { background: '#1da5de', text: '#FFFFFF' },
  SUNSURE: { background: '#eb2126', text: '#000000' },
  TYPICAL: { background: '#1a1a1a', text: '#FFFFFF' },
  DAPET:   { background: '#2d2e7f', text: '#FFFFFF' },
  JUKI:    { background: '#117bc0', text: '#FFFFFF' },
  BETSEW:  { background: '#1da5de', text: '#FFFFFF' },
  GOLDEX:  { background: '#D6AB42', text: '#000000' },
  ROSEW:   { background: '#1da5de', text: '#FFFFFF' },
  DEFAULT: { background: '#1da5de', text: '#FFFFFF' },
};

/**
 * getBrandColors
 * Entrada: marcaName (string)
 * Salida: { background, text }
 *
 * Helper para obtener los colores de una marca con fallback al DEFAULT.
 */
export const getBrandColors = (marcaName) =>
  BRAND_COLORS[marcaName] ?? BRAND_COLORS.DEFAULT;

// Colores generales de la app
export const COLORS = {
  primary:    '#003b77',
  accent:     '#ff8000',
  danger:     '#ff0000',
  white:      '#FFFFFF',
  black:      '#000000',
  lightGray:  '#eeeeee',
  borderGray: '#cccccc',
  cardBg:     '#eeeeeeb9',
};