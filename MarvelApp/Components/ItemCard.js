import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated, TouchableOpacity, Linking, Share } from 'react-native';

// Componente hijo para cada item
const ItemCard = ({ item, textColor, backgroundColor }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const [showPrices, setShowPrices] = useState(false); // 👈 control del desplegable

    useEffect(() => {
        if (item['OFERTA'] === 1) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
            }).start();
        }
    }, []);

    // 🔍 función para abrir búsqueda en Google
    const buscarEnGoogle = () => {
        if (item['CODIGO']) {
            const query = encodeURIComponent(item['CODIGO']);
            const url = `https://www.google.com/search?q=${query}`;
            Linking.openURL(url);
        }
    };
    const [info, setInfo] = useState("");

    // 🔍 función para buscar especificaciones usando cache y AI

    // 📤 función para compartir el item
    // utils/priceUtils.js

/**
 * Intenta convertir strings con distintos formatos de moneda a Number.
 * Soporta:
 *  - "$1,041,200.00"
 *  - "1.041.200,00"
 *  - "1041200"
 *  - "1,041,200"
 */
 function parseCurrencyStringToNumber(str) {
  if (str == null) return NaN;
  const s = String(str).trim();

  // quitar todo excepto dígitos, punto y coma y signo negativo
  const cleaned = s.replace(/[^\d.,-]/g, '');

  if (!cleaned) return NaN;

  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');

  let normalized = cleaned;

  if (lastDot !== -1 && lastComma !== -1) {
    // hay ambos símbolos -> el que aparezca más a la derecha es el separador decimal
    if (lastDot > lastComma) {
      // punto decimal, eliminar comas (miles)
      normalized = cleaned.replace(/,/g, '');
    } else {
      // coma decimal, eliminar puntos (miles) y reemplazar coma por punto
      normalized = cleaned.replace(/\./g, '').replace(/,/g, '.');
    }
  } else if (lastComma !== -1) {
    // solo coma presente -> decidir si es decimal (2 dígitos al final) o miles
    const partAfter = cleaned.slice(lastComma + 1);
    if (partAfter.length === 2) {
      // coma como decimal
      normalized = cleaned.replace(/\./g, '').replace(/,/g, '.');
    } else {
      // coma como separador de miles -> eliminar comas
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (lastDot !== -1) {
    // solo punto -> decidir si decimal (2 dígitos) o miles
    const partAfter = cleaned.slice(lastDot + 1);
    if (partAfter.length === 2) {
      // punto decimal
      normalized = cleaned;
    } else {
      // punto como separador de miles -> eliminar puntos
      normalized = cleaned.replace(/\./g, '');
    }
  }

  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : NaN;
}

/**
 * Redondea hacia arriba al múltiplo más cercano
 */
 function roundUpToMultiple(value, multiple = 50000) {
  if (!Number.isFinite(value)) return NaN;
  return Math.ceil(value / multiple) * multiple;
}

/**
 * Formatea número como "$1,050,000.00" (coma miles, punto decimal, 2 decimales)
 */
 function formatAsDollarUS(value) {
  if (!Number.isFinite(value)) return null;
  // toFixed + regex para separar miles garantiza consistencia en todos los runtimes JS
  return '$' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Función todo-en-uno
 */
 function redondearYFormatear(precioStr, multiple = 50000) {
  const numero = parseCurrencyStringToNumber(precioStr);
  if (!Number.isFinite(numero)) return null; // o devuelve precioStr si prefieres
  const redondeado = roundUpToMultiple(numero, multiple);
  return formatAsDollarUS(redondeado);
}

    const compartir = async () => {
        try {
            const mensaje =
                `📦 Máquina: ${item['MAQUINAS'] || 'N/A'}
🔖 Código: ${item['CODIGO'] || 'N/A'}
🏷 Marca: ${item['MARCA'] || 'N/A'}
💵 Precio final: ${item['PRECIO FINAL EN PESOS'] ? `${redondearYFormatear(item['PRECIO FINAL EN PESOS'])}` : 'No disponible'}`;

            await Share.share({
                message: mensaje,
            });
        } catch (error) {
            console.error("Error al compartir:", error);
        }
    };
    return (
        <View
            style={{
                padding: 0,
                marginBottom: 20,
                borderRadius: 4,
                position: 'relative',
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: 'black',
                borderRadius: 10,
            }}
        >
            <Text
                style={{
                    fontWeight: 'bold',
                    color: textColor,
                    padding: 10,
                    fontSize: 20,
                }}
            >
                Máquina: {item['MAQUINAS']}
            </Text>
            <Text style={{ padding: 10, color: textColor, fontWeight: 'bold' }}>
                Código: {item['CODIGO']}
                <TouchableOpacity
                    onPress={buscarEnGoogle}
                    style={{
                        padding: 0,
                        margin: 0,
                    }}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                        🔎
                    </Text>
                </TouchableOpacity>
            </Text>

            {
                info && (
                    <Text style={{ padding: 10, color: textColor, fontWeight: 'bold' }}>
                        {info}
                    </Text>
                )
            }

            <Text
                style={{
                    fontWeight: 'bold',
                    fontSize: 20,
                    backgroundColor: '#1eff00a2',
                    color: textColor,
                    marginTop: 6,
                    padding: 5,
                    borderRadius: 6,
                }}
            >
                Precio en pesos: {item['PRECIO FINAL EN PESOS']}
                <TouchableOpacity
                    onPress={() => setShowPrices(!showPrices)}
                    style={{
                        backgroundColor: "white",
                        padding: 8,
                        margin: 8,
                        borderRadius: 6,
                    }}
                >
                    <Text style={{ color: 'black', fontSize: 10, textAlign: 'center' }}>
                        {showPrices ? 'Ocultar detalles ▲' : 'Ver detalles ▼'}
                    </Text>
                </TouchableOpacity>
                {/* Botón compartir */}
                <TouchableOpacity
                    onPress={compartir}
                    style={{
                        backgroundColor: "#007bff",
                        padding: 10,
                        margin: 10,
                        borderRadius: 6,
                        alignItems: "center"
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "bold" }}>📤 Compartir</Text>
                </TouchableOpacity>
            </Text>

            {/* Botón para mostrar/ocultar precios */}


            {/* Lista de precios desplegable */}
            {showPrices && (
                <View style={{ paddingHorizontal: 10, paddingBottom: 10 }}>
                    <Text style={{ padding: 5, color: textColor }}>
                        {item['PRECIO DOLAR AL GREMIO']
                            ? `Precio gremio USD: ${item['PRECIO DOLAR AL GREMIO']}`
                            : item['PRECIO EN PESOS AL GREMIO']
                                ? `Precio gremio ARS: ${item['PRECIO EN PESOS AL GREMIO']}`
                                : 'Precio gremio: N/A'}
                    </Text>

                    <Text style={{ padding: 5, color: textColor }}>
                        Porcentaje de ganancia: {item['%']}
                    </Text>

                    {item['PRECIO FINAL EN DOLARES AL PUBLICO'] && (
                        <Text style={{ padding: 5, color: textColor }}>
                            Precio público USD: {item['PRECIO FINAL EN DOLARES AL PUBLICO']}
                        </Text>
                    )}

                    {item['COTIZACION DEL DOLAR'] && (
                        <Text style={{ padding: 5, color: textColor }}>
                            Cotización Dólar: {item['COTIZACION DEL DOLAR']}
                        </Text>
                    )}
                </View>
            )}

            {/* Etiqueta OFERTA */}
            {item['OFERTA'] === 1 && (
                <Animated.View
                    style={{
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        backgroundColor: 'red',
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                        borderRadius: 6,
                    }}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
                        OFERTA
                    </Text>
                </Animated.View>
            )}

            {/* Etiqueta SIN STOCK */}
            {item['SIN_STOCK'] === 1 && (
                <Animated.View
                    style={{
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        backgroundColor: 'black',
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                        borderRadius: 6,
                    }}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
                        SIN STOCK
                    </Text>
                </Animated.View>
            )}
        </View>
    );
};

export default ItemCard;
