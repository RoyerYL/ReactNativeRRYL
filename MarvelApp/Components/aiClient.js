// 🔹 Cache en memoria
const cacheEspecificaciones = {};

// 🔹 Función para obtener especificaciones
export async function obtenerEspecificaciones(maquina, parametros = "") {
  const key = `${maquina}-${parametros}`;

  // 🔹 Si existe en cache, devolverlo directamente
  if (cacheEspecificaciones[key]) {
    console.log("Usando cache:", key);
    return cacheEspecificaciones[key];
  }

  // 🔹 Si no existe, hacemos la llamada a Hugging Face
  const prompt = `
Dame las especificaciones técnicas de la máquina "${maquina}".
Parámetros adicionales: ${parametros}.
Devuelve siempre en este formato:
- Tipo: 
- Consumo:
- Compatibilidad:
- Observaciones:
- Atraque:
- Corte de Hilo:
`;

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/tiiuae/falcon-7b"
,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer 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`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    const data = await response.json();

    const contenido = Array.isArray(data)
      ? data[0].generated_text
      : data.generated_text || "No se pudo generar contenido";

    // 🔹 Guardamos en cache
    cacheEspecificaciones[key] = contenido;

    console.log("Guardado en cache:", key);
    return contenido;
  } catch (error) {
    console.error("Error al obtener especificaciones:", error);
    return "No se pudieron obtener las especificaciones.";
  }
}
