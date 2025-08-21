import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated, TouchableOpacity, Linking } from 'react-native';
import { obtenerEspecificaciones } from './aiClient';

// Componente hijo para cada item
const ItemCard = ({ item, textColor , backgroundColor}) => {
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
const buscar = async () => {
  const data = await obtenerEspecificaciones(item['MAQUINAS'], item['CODIGO']);
  setInfo(data);
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
                onPress={buscar}
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
            </Text>
            
            {/* Botón para mostrar/ocultar precios */}
            <TouchableOpacity
                onPress={() => setShowPrices(!showPrices)}
                style={{
                    backgroundColor: backgroundColor,
                    padding: 8,
                    margin: 8,
                    borderRadius: 6,
                }}
            >
                <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                    {showPrices ? 'Ocultar precios ▲' : 'Ver precios ▼'}
                </Text>
            </TouchableOpacity>

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
