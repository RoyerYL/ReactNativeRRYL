import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated, TouchableOpacity, Linking,  Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import Share from 'react-native';
//import Share from 'react-native-share';
// 🔗 Convierte link de Drive a link directo
function getDirectDriveImageUrl(driveUrl) {
  if (!driveUrl) return null;
  const match = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return null;
}

// 📥 Descarga y cachea imagen localmente con fallback
async function getCachedImage(driveUrl) {
  if (!driveUrl) return null;

  // Extraemos ID de Drive para usar como nombre de archivo
  const fileId = driveUrl.match(/id=([a-zA-Z0-9_-]+)/)?.[1] || driveUrl;
  const fileUri = `${FileSystem.cacheDirectory}${fileId}.jpg`;

  // Si ya existe el archivo local, lo usamos
  const fileInfo = await FileSystem.getInfoAsync(fileUri);
  
  if (fileInfo.exists) return fileUri;

  // Intentamos descargar la imagen
  try {
    const { uri } = await FileSystem.downloadAsync(driveUrl, fileUri);
    return uri;
  } catch (err) {
    console.warn('❌ Error al descargar imagen:', err);
    // fallback: usamos la URL original de Drive si falla
    return driveUrl;
  }
}

const ItemCard = ({ item, textColor }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [showPrices, setShowPrices] = useState(false);
  const [localImageUri, setLocalImageUri] = useState(null);

  const imageUrl = getDirectDriveImageUrl(item['FOTOS']);

  useEffect(() => {
    if (item['OFERTA'] === 1) {
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    }
  }, []);
  useEffect(() => {
    if (item['OFERTA'] === 1) {
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    }
  }, []);

  // ⬇️ Descargamos y cacheamos la imagen
  useEffect(() => {
    let isMounted = true;
    if (imageUrl) {
      getCachedImage(imageUrl).then((uri) => {
        if (isMounted) setLocalImageUri(uri);
      });
    }
    return () => { isMounted = false; };
  }, [imageUrl]);

  const buscarEnGoogle = () => {
    if (item['CODIGO']) {
      const query = encodeURIComponent(item['CODIGO']);
      Linking.openURL(`https://www.google.com/search?q=${query}`);
    }
  };

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
  // if (!localImageUri) return;

  const shareOptions = {
    title: 'Compartir en WhatsApp',
    message: `📦 Máquina: ${item['MAQUINAS'] || 'N/A'}\n🔖 Código: ${item['CODIGO'] || 'N/A'}`,
    url: localImageUri,
    social: Share.Social.WHATSAPP,
  };

  try {
    await Share.open(shareOptions);
  } catch (err) {
    console.log('Error al compartir:', err);
  }
};
  return (
    <View style={{ marginBottom: 20, borderRadius: 10, borderWidth: 1, borderColor: 'black', backgroundColor: '#fff' }}>
      {/* ✅ Cargamos imagen cacheada o URL original */}
      {localImageUri && (
        <Image
          source={{ uri: localImageUri }}
          style={{ width: '100%', height: 200, borderTopLeftRadius: 10, borderTopRightRadius: 10, resizeMode: 'cover' }}
        />
      )}

      <Text style={{ fontWeight: 'bold', color: textColor, padding: 10, fontSize: 20 }}>
        Máquina: {item['MAQUINAS']}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
        <Text style={{ color: textColor, fontWeight: 'bold' }}>
          Código: {item['CODIGO']}
        </Text>
        <TouchableOpacity onPress={buscarEnGoogle} style={{ marginLeft: 8 }}>
          <Text style={{ fontSize: 16 }}>🔎</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontWeight: 'bold', fontSize: 20, backgroundColor: '#1eff00a2', color: textColor, marginTop: 6, padding: 5, borderRadius: 6 }}>
        Precio en pesos: {item['PRECIO FINAL EN PESOS']}
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 }}>
        <TouchableOpacity onPress={() => setShowPrices(!showPrices)}>
          <Text style={{ color: 'black' }}>
            {showPrices ? 'Ocultar detalles ▲' : 'Ver detalles ▼'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={compartir} style={{ backgroundColor: "#007bff", padding: 8, borderRadius: 6 }}>
          <Text style={{ color: "white", fontWeight: "bold" }}>📤 Compartir</Text>
        </TouchableOpacity>
      </View>


      {showPrices && (
        <View style={{ paddingHorizontal: 10, paddingBottom: 10 }}>
          <Text>{item['PRECIO DOLAR AL GREMIO']
            ? `Precio gremio USD: ${item['PRECIO DOLAR AL GREMIO']}`
            : item['PRECIO EN PESOS AL GREMIO']
              ? `Precio gremio ARS: ${item['PRECIO EN PESOS AL GREMIO']}`
              : 'Precio gremio: N/A'}</Text>

          {item['PRECIO FINAL EN DOLARES AL PUBLICO'] && <Text>Precio público USD: {item['PRECIO FINAL EN DOLARES AL PUBLICO']}</Text>}
          {item['COTIZACION DEL DOLAR'] && <Text>Cotización Dólar: {item['COTIZACION DEL DOLAR']}</Text>}
        </View>
      )}
      {item['OFERTA'] === 1 && (
        <Animated.View style={{ position: 'absolute', top: 5, right: 5, backgroundColor: 'red', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>OFERTA</Text>
        </Animated.View>
      )}

      {item['SIN_STOCK'] === 1 && (
        <Animated.View style={{ position: 'absolute', top: 5, right: 5, backgroundColor: 'black', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>SIN STOCK</Text>
        </Animated.View>
      )}
    </View>
  );
};

export default ItemCard;
