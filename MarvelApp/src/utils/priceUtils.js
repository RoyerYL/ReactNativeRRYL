export const limpiarPrecio = (precio) => {
  return Number(
    precio
      .replace('$', '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim()
  );
};

export const ordenarPorPrecioPesos = (lista) => {
  return [...lista].sort(
    (a, b) =>
      limpiarPrecio(a["PRECIO FINAL EN PESOS"]) -
      limpiarPrecio(b["PRECIO FINAL EN PESOS"])
  );
};
