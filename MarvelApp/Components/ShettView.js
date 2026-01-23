// En SheetView.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  FlatList,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ItemCard from './ItemCard';

// Importa la base de datos SQLite
import SimpleDatabase from './simpleDatabase';
import SimpleOperations from './simpleOperations';

export const images = {
  "Daiquiri Frutilla": require('../assets/DaiquiriFrutilla.png'),
  "Daiquiri Durazno": require('../assets/DaiquiriDurazno.png'),
  "Pasion Roja": require('../assets/PasionRoja.jpeg'),
  "Gancia": require('../assets/Gancia.jpeg'),
  "Fernet": require('../assets/Fernet.jpeg'),
  "Pina Colada": require('../assets/PiñaColada.jpeg'),
  "Pantera Rosa": require('../assets/PanteraRosa.png'),
  "Caipirinha": require('../assets/Caipirinha.jpeg'),
  "Menta Fuerte": require('../assets/MentaFuerte.jpeg'),
  "Mojito": require('../assets/Mojito.jpeg'),
  "Tequila Sunrise": require('../assets/TequilaSunrise.jpeg'),
  "Pitufo Azul": require('../assets/PitufoAzul.png'),
  "Cuba Libre": require('../assets/CubaLibre.jpeg'),
  "Destornillador": require('../assets/Destornillador.jpeg'),
  "Laguna Azul": require('../assets/LagunaAzul.png'),
};

/* ================= CONFIG ================= */
const CARD_WIDTH = 260;
const CARD_HEIGHT = 360;
const CARD_MARGIN = 10;

/* ================ NORMALIZE ================ */
const normalize = (s) =>
  s
    ? s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    : '';

/* ================= COMPONENT ================= */

const SheetView = () => {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [numColumns, setNumColumns] = useState(1);
  const [cart, setCart] = useState([]);
  const [cartCantidades, setCartCantidades] = useState({});
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promocionesActivas, setPromocionesActivas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [cocktailSeleccionado, setCocktailSeleccionado] = useState(null);
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [usandoPrecio2, setUsandoPrecio2] = useState({});
  const [precioSeleccionado, setPrecioSeleccionado] = useState({});
  const [cantidades, setCantidades] = useState({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [cambio, setCambio] = useState(0);
  const [observaciones, setObservaciones] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  useFocusEffect(
    React.useCallback(() => {
      refreshAll();
    }, [])
  );
  const refreshAll = async () => {
  try {
    console.log('🔄 Refrescando datos desde SQLite...');
    setRefreshing(true);

    await cargarDatos();
    await cargarPromocionesActivas();
    await verificarCaja();

  } catch (e) {
    console.error('Error refrescando datos:', e);
  } finally {
    setRefreshing(false);
  }
};

  /* ====== INICIALIZAR BASE DE DATOS ====== */
  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
    };
    init();

    const updateLayout = () => {
      setNumColumns(calculateColumns());
    };

    updateLayout();
    const sub = Dimensions.addEventListener('change', updateLayout);
    return () => sub?.remove();
  }, []);


  /* ====== FUNCIONES DE CHECKOUT ====== */
  const abrirCheckout = () => {
    if (Object.values(cantidades).reduce((a, b) => a + b, 0) === 0) {
      Alert.alert('🛒 Carrito Vacío', 'Agregue cócteles al carrito primero');
      return;
    }

    // Comentado temporalmente para facilitar pruebas
    if (!cajaAbierta) {
      Alert.alert('⚠️ Caja Cerrada', 'Debe abrir la caja antes de vender', [
        {
          text: 'Abrir Caja',
          onPress: () => manejarCaja()
        },
        {
          text: 'Cancelar',
          style: 'cancel'
        }
      ]);
      return;
    }

    // Calcular el total antes de abrir el checkout
    const totalCalculado = calcularTotal();
    setShowCheckout(true);
    setEfectivoRecibido(totalCalculado.toString());
    calcularCambio(totalCalculado, totalCalculado.toString());
  };

  const cerrarCheckout = () => {
    setShowCheckout(false);
    setMetodoPago('efectivo');
    setEfectivoRecibido('');
    setCambio(0);
    setObservaciones('');
  };

  const calcularTotal = () => {
    return cart.reduce((sum, item) => {
      const key = `${item.id}-${item.price}`;
      return sum + item.price * (cantidades[key] || 0);
    }, 0);
  };

  const calcularCambio = (total, recibido) => {
    if (recibido && !isNaN(parseFloat(recibido)) && parseFloat(recibido) >= total) {
      const cambioCalculado = parseFloat(recibido) - total;
      setCambio(cambioCalculado);
    } else {
      setCambio(0);
    }
  };

  const handleEfectivoChange = (text) => {
    setEfectivoRecibido(text);
    const total = calcularTotal();
    calcularCambio(total, text);
  };

  const finalizarVenta = async () => {
    try {
      const total = calcularTotal();

      // Validaciones
      if (metodoPago === 'efectivo') {
        if (!efectivoRecibido || isNaN(parseFloat(efectivoRecibido))) {
          Alert.alert('❌ Error', 'Ingrese el monto recibido');
          return;
        }

        const recibido = parseFloat(efectivoRecibido);
        if (recibido < total) {
          Alert.alert('❌ Error', `Faltan $${(total - recibido).toLocaleString()}`);
          return;
        }
      }

      // Preparar detalles de la venta
      const detallesVenta = cart.map(item => {
        const key = `${item.id}-${item.price}`;
        const cantidad = cantidades[key] || 0;
        return {
          cocktailId: item.db_id || item.id,
          nombre: item.name,
          cantidad: cantidad,
          precio_unitario: item.price,
          subtotal: item.price * cantidad
        };
      }).filter(item => item.cantidad > 0);

      // Crear objeto de venta
      const venta = {
        total_normal: total,
        total_con_descuento: total,
        descuento_total: 0,
        metodo_pago: metodoPago,
        cliente: observaciones.trim() || '',
        detalles: detallesVenta,
        promociones_aplicadas: []
      };

      // Registrar venta en la base de datos
      const ventaId = await SimpleOperations.registrarVentaCocktail(venta);

      // Generar ticket
      const ticketNum = `TKT-${new Date().getTime().toString().slice(-6)}`;

      // Mostrar resumen
      Alert.alert(
        '✅ Venta Completada',
        `Ticket: ${ticketNum}\nTotal: $${total.toLocaleString()}\nMétodo: ${metodoPago}`,
        [
          {
            text: 'Ver Ticket',
            onPress: () => imprimirTicket(ticketNum, venta)
          },
          {
            text: 'Continuar',
            onPress: () => {
              // Limpiar carrito
              setCart([]);
              setCantidades({});
              setPrecioSeleccionado({});
              cerrarCheckout();

              // Recargar datos si es necesario
              cargarDatos();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error finalizando venta:', error);
      Alert.alert('❌ Error', 'No se pudo completar la venta');
    }
  };

  const imprimirTicket = (ticketNum, venta) => {
    // Aquí iría la lógica de impresión
    // Por ahora solo mostramos un resumen
    const ticketText = `
╔══════════════════════╗
║     BAR DE CÓCTELES  ║
╠══════════════════════╣
║ Ticket: ${ticketNum.padEnd(10)} ║
║ Fecha: ${new Date().toLocaleDateString()} ║
║ Hora: ${new Date().toLocaleTimeString()} ║
╠══════════════════════╣
${venta.detalles.map(item =>
      `${item.nombre.substring(0, 15).padEnd(15)} ${item.cantidad.toString().padStart(2)} x $${item.precio_unitario.toLocaleString()}`
    ).join('\n')}
╠══════════════════════╣
║ TOTAL: $${venta.total_normal.toLocaleString().padStart(10)} ║
║ Método: ${venta.metodo_pago.padEnd(10)} ║
╚══════════════════════╝
`;

    Alert.alert('📄 Ticket Generado', ticketText);
  };

  const initializeDatabase = async () => {
    try {
      setLoading(true);
      console.log('Inicializando base de datos...');

      // Inicializar la base de datos SQLite
      await SimpleOperations.init();

      // Cargar datos
      await cargarDatos();
      await verificarCaja();
      await cargarPromocionesActivas();

      console.log('Base de datos inicializada exitosamente');
    } catch (error) {
      console.error('Error inicializando base de datos:', error);
      // Mostrar datos de ejemplo aunque falle la base de datos
      setLista(getListaEjemplo());
      setPromocionesActivas(getPromocionesEjemplo());
      Alert.alert('Aviso', 'Usando datos de ejemplo');
    } finally {
      setLoading(false);
    }
  };

  const cargarDatos = async () => {
    try {
      const cocktails = await SimpleOperations.obtenerCocktails();

      const listaConImagenes = cocktails.map(cocktail => {
        const imageKey = Object.keys(images).find(key =>
          normalize(key).includes(normalize(cocktail.nombre)) ||
          normalize(cocktail.nombre).includes(normalize(key))
        );

        return {
          id: cocktail.id,
          name: cocktail.nombre,
          precio1: cocktail.precio1 || 3500,
          precio2: cocktail.precio2 || null,
          tiene_precio2: !!cocktail.precio2,
          categoria: cocktail.categoria,
          imageKey: imageKey ? images[imageKey] : images.DaiquiriFrutilla,
          db_id: cocktail.id,
          descripcion: cocktail.descripcion
        };
      });

      setLista(listaConImagenes);

    } catch (error) {
      console.error('Error cargando cócteles:', error);
      setLista(getListaEjemplo());
    }
  };

  const getListaEjemplo = () => {
    return [
      {
        id: 1,
        name: 'Daiquiri Frutilla',
        precio1: 3500,
        precio2: 3000,
        categoria: 'daiquiri',
        imageKey: images.DaiquiriFrutilla,
        db_id: 1,
        descripcion: 'Daiquiri de frutilla fresca'
      },
      {
        id: 2,
        name: 'Daiquiri Durazno',
        precio1: 3500,
        precio2: 3000,
        categoria: 'daiquiri',
        imageKey: images.DaiquiriDurazno,
        db_id: 2,
        descripcion: 'Daiquiri de durazno natural'
      }
    ];
  };

  const getPromocionesEjemplo = () => {
    return [
      {
        id: 1,
        cocktailId: 12,
        nombre: '🔥 2 por $3000 - Cuba Libre',
        tipo: '2por_precio',
        precio_promocional: 3000,
        cantidad_requerida: 2
      }
    ];
  };

  const cargarPromocionesActivas = async () => {
    try {
      const promos = await SimpleOperations.obtenerPromocionesActivas();
      setPromocionesActivas(promos);
    } catch (error) {
      console.error('Error cargando promociones:', error);
      setPromocionesActivas(getPromocionesEjemplo());
    }
  };

  const verificarCaja = async () => {
    try {
      const estadoCaja = await SimpleOperations.obtenerCajaAbierta();
      setCajaAbierta(estadoCaja ? estadoCaja.abierta : false);
    } catch (error) {
      console.error('Error verificando caja:', error);
      setCajaAbierta(false);
    }
  };

  const quitarDelCarrito = (item) => {
    const key = `${item.id}-${item.price}`;
    const cantidadActual = cantidades[key] || 0;

    if (cantidadActual > 1) {
      // Restar cantidad
      setCantidades(prev => ({
        ...prev,
        [key]: cantidadActual - 1,
      }));
    } else {
      // Eliminar completamente
      setCantidades(prev => {
        const nuevo = { ...prev };
        delete nuevo[key];
        return nuevo;
      });

      setCart(prev =>
        prev.filter(i => !(i.id === item.id && i.price === item.price))
      );
    }
  };

  /* ====== calcular columnas dinámicas ====== */
  const calculateColumns = () => {
    const screenWidth = Dimensions.get('window').width;
    const columns = Math.floor(screenWidth / (CARD_WIDTH + CARD_MARGIN * 2));
    return Math.max(columns, 1);
  };

  /* ====== FUNCIONES DEL CARRITO ====== */
  const agregarAlCarrito = (item, precioFinal) => {
    setCart((prev) => {
      const existe = prev.find((i) => i.id === item.id && i.price === precioFinal);
      if (existe) return prev;
      return [...prev, {
        id: item.id,
        name: item.name,
        imageKey: item.imageKey,
        price: precioFinal,
        db_id: item.db_id
      }];
    });

    setCantidades((prev) => ({
      ...prev,
      [`${item.id}-${precioFinal}`]:
        (prev[`${item.id}-${precioFinal}`] || 0) + 1,
    }));
  };

  const calcularTotalNormal = () => {
    let total = 0;
    cart.forEach(item => {
      const cantidad = cartCantidades[item.id] || 0;
      total += item.price * cantidad;
    });
    return total;
  };

  /* ====== FUNCIONES DE PROMOCIONES ====== */
  const mostrarOpcionesPromocion = (cocktail) => {
    setCocktailSeleccionado(cocktail);
    setModalVisible(true);
  };

  const crearPromocion2por3000 = async () => {
    if (!cocktailSeleccionado) return;

    try {
      const fechaFin = new Date();
      fechaFin.setDate(fechaFin.getDate() + 7);

      await SimpleOperations.crearPromocion2porPrecio(
        cocktailSeleccionado.db_id || cocktailSeleccionado.id,
        3000,
        {
          nombre: `🔥 2 por $3000 - ${cocktailSeleccionado.name}`,
          fecha_inicio: new Date().toISOString(),
          fecha_fin: fechaFin.toISOString()
        }
      );

      Alert.alert('✅ Éxito', 'Promoción 2 por $3000 creada');
      await cargarPromocionesActivas();
      setModalVisible(false);
    } catch (error) {
      Alert.alert('❌ Error', 'No se pudo crear la promoción');
      console.error(error);
    }
  };

  const crearPromocion2x1 = async () => {
    if (!cocktailSeleccionado) return;

    try {
      const fechaFin = new Date();
      fechaFin.setDate(fechaFin.getDate() + 7);

      await SimpleOperations.crearPromocion2x1(
        cocktailSeleccionado.db_id || cocktailSeleccionado.id,
        {
          nombre: `🎯 2x1 - ${cocktailSeleccionado.name}`,
          fecha_inicio: new Date().toISOString(),
          fecha_fin: fechaFin.toISOString()
        }
      );

      Alert.alert('✅ Éxito', 'Promoción 2x1 creada');
      await cargarPromocionesActivas();
      setModalVisible(false);
    } catch (error) {
      Alert.alert('❌ Error', 'No se pudo crear la promoción');
      console.error(error);
    }
  };

  const crearDescuentoPorcentaje = () => {
    if (!cocktailSeleccionado) return;

    Alert.prompt(
      '🎫 Descuento Porcentual',
      `Ingrese el % de descuento para ${cocktailSeleccionado.name}:`,
      async (porcentaje) => {
        if (porcentaje && !isNaN(parseFloat(porcentaje))) {
          try {
            const fechaFin = new Date();
            fechaFin.setDate(fechaFin.getDate() + 7);

            await SimpleOperations.crearPromocionDescuentoPorcentaje(
              cocktailSeleccionado.db_id || cocktailSeleccionado.id,
              parseFloat(porcentaje),
              {
                nombre: `💫 ${porcentaje}% OFF - ${cocktailSeleccionado.name}`,
                fecha_inicio: new Date().toISOString(),
                fecha_fin: fechaFin.toISOString()
              }
            );

            Alert.alert('✅ Éxito', `${porcentaje}% de descuento creado`);
            await cargarPromocionesActivas();
            setModalVisible(false);
          } catch (error) {
            Alert.alert('❌ Error', 'No se pudo crear el descuento');
            console.error(error);
          }
        }
      },
      'plain-text',
      '20',
      'numeric'
    );
  };

  /* ====== FINALIZAR VENTA ====== */
  const seleccionarPrecio = (id, usarPrecio2) => {
    setPrecioSeleccionado(prev => ({
      ...prev,
      [id]: usarPrecio2,
    }));
  };

  /* ====== ABRIR/VER CAJA ====== */
  const manejarCaja = () => {
    if (cajaAbierta) {
      navigation.navigate('CajaVentas');
    } else {
      Alert.prompt(
        '💰 Abrir Caja',
        'Ingrese el monto inicial de caja:',
        async (monto) => {
          if (monto && !isNaN(parseFloat(monto))) {
            try {
              await SimpleOperations.abrirCajaDia(parseFloat(monto));
              setCajaAbierta(true);
              Alert.alert('✅ Éxito', `Caja abierta con $${parseFloat(monto).toLocaleString()}`);
            } catch (error) {
              console.error('Error abriendo caja:', error);
              Alert.alert('❌ Error', 'No se pudo abrir la caja');
            }
          }
        },
        'plain-text',
        '',
        'numeric'
      );
    }
  };

  /* ====== RENDERIZADO ====== */
  const filteredList = lista?.filter(
    (item) => item?.name && normalize(item.name).includes(normalize(query))
  ) ?? [];

  const renderItem = ({ item }) => {
    const usaPrecio2 = precioSeleccionado[item.id] || false;
    const precioFinal = usaPrecio2 && item.precio2 ? item.precio2 : item.precio1 || 3500;

    return (
      <View style={styles.itemContainer}>
        <ItemCard
          {...item}
          usandoPrecio2={precioSeleccionado[item.id] ?? false}
          onSelectPrecio={(usarPrecio2) =>
            seleccionarPrecio(item.id, usarPrecio2)
          }
          onAddToCart={(precioFinal) =>
            agregarAlCarrito(item, precioFinal)
          }
        />
      </View>
    );
  };

  const total = cart.reduce((sum, item) => {
    const key = `${item.id}-${item.price}`;
    return sum + item.price * (cantidades[key] || 0);
  }, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando bar de cócteles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER CON BÚSQUEDA Y CAJA */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cóctel..."
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.preciosButton}
          onPress={() => navigation.navigate('Precios')}
        >
          <Text style={styles.preciosButtonText}>💰 Precios</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cajaBtn, cajaAbierta ? styles.cajaAbierta : styles.cajaCerrada]}
          onPress={() => navigation.navigate('CajaVentas')}
        >
          <Text style={styles.cajaBtnText}>
            {cajaAbierta ? '💰 Caja Abierta' : '🔒 Abrir Caja'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* BANNER DE PROMOCIONES ACTIVAS */}
      {promocionesActivas.length > 0 && (
        <View style={styles.promocionesBanner}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {promocionesActivas.map(promo => (
              <TouchableOpacity
                key={promo.id}
                style={styles.promoTag}
                onPress={() => Alert.alert(
                  promo.nombre,
                  `Tipo: ${promo.tipo}\nVálido hasta: ${promo.fecha_fin ? new Date(promo.fecha_fin).toLocaleDateString() : 'Sin fecha límite'}`
                )}
              >
                <Text style={styles.promoTagText} numberOfLines={1}>
                  {promo.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* LISTA DE CÓCTELES */}
      <FlatList
        key={numColumns}
        data={filteredList}
        numColumns={numColumns}
        keyExtractor={(item, index) => item?.id?.toString() ?? index.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No se encontraron cócteles</Text>
          </View>
        }
      />

      {/* CARRITO */}
      {cart.length > 0 && (
        <View style={styles.cart}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {cart.map((item) => {
              const key = `${item.id}-${item.price}`;
              const cantidad = cantidades[key] || 0;
              if (cantidad === 0) return null;

              return (
                <View key={key} style={styles.cartItem}>
                  <Image source={item.imageKey} style={styles.cartImage} />
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.cartItemPrice}>
                      ${item.price.toLocaleString()} x {cantidad}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => quitarDelCarrito(item)}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          <Text style={styles.total}>
            TOTAL: ${total.toLocaleString("es-AR")}
          </Text>

          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={abrirCheckout}
          >
            <Text style={styles.checkoutText}>FINALIZAR VENTA</Text>
            <Text style={styles.checkoutSubtext}>
              {Object.values(cantidades).reduce((a, b) => a + b, 0)} items
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL DE CHECKOUT */}
      <Modal
        visible={showCheckout}
        animationType="slide"
        transparent={true}
        onRequestClose={cerrarCheckout}
      >
        <View style={styles.checkoutOverlay}>
          <View style={styles.checkoutContainer}>
            {/* Header */}
            <View style={styles.checkoutHeader}>
              <Text style={styles.checkoutTitle}>💳 Finalizar Venta</Text>
              <TouchableOpacity onPress={cerrarCheckout}>
                <Text style={styles.closeCheckout}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.checkoutContent}>
              {/* Resumen del pedido */}
              <View style={styles.checkoutSection}>
                <Text style={styles.sectionTitle}>Resumen del Pedido</Text>
                {cart.map(item => {
                  const key = `${item.id}-${item.price}`;
                  const cantidad = cantidades[key] || 0;
                  if (cantidad === 0) return null;

                  return (
                    <View key={key} style={styles.checkoutItem}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemDetails}>
                          ${item.price.toLocaleString()} x {cantidad}
                        </Text>
                      </View>
                      <Text style={styles.itemSubtotal}>
                        ${(item.price * cantidad).toLocaleString()}
                      </Text>
                    </View>
                  );
                })}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>TOTAL:</Text>
                  <Text style={styles.totalAmount}>
                    ${calcularTotal().toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Método de pago */}
              <View style={styles.checkoutSection}>
                <Text style={styles.sectionTitle}>Método de Pago</Text>
                <View style={styles.paymentMethods}>
                  {['efectivo', 'tarjeta', 'transferencia'].map((metodo) => (
                    <TouchableOpacity
                      key={metodo}
                      style={[
                        styles.paymentMethod,
                        metodoPago === metodo && styles.paymentMethodSelected
                      ]}
                      onPress={() => setMetodoPago(metodo)}
                    >
                      <Text style={[
                        styles.paymentMethodText,
                        metodoPago === metodo && styles.paymentMethodTextSelected
                      ]}>
                        {metodo === 'efectivo' ? '💵 Efectivo' :
                          metodo === 'tarjeta' ? '💳 Tarjeta' : '📲 Transferencia'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Efectivo (solo si el método es efectivo) */}
              {metodoPago === 'efectivo' && (
                <View style={styles.checkoutSection}>
                  <Text style={styles.sectionTitle}>Efectivo</Text>
                  <TextInput
                    style={styles.efectivoInput}
                    placeholder="Monto recibido"
                    value={efectivoRecibido}
                    onChangeText={handleEfectivoChange}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />

                  {cambio > 0 && (
                    <View style={styles.cambioContainer}>
                      <Text style={styles.cambioLabel}>Cambio:</Text>
                      <Text style={styles.cambioAmount}>
                        ${cambio.toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Observaciones */}
              <View style={styles.checkoutSection}>
                <Text style={styles.sectionTitle}>Observaciones (Opcional)</Text>
                <TextInput
                  style={styles.observacionesInput}
                  placeholder="Ej: Mesa 4, Para llevar, etc."
                  value={observaciones}
                  onChangeText={setObservaciones}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999"
                />
              </View>
            </ScrollView>

            {/* Botones de acción */}
            <View style={styles.checkoutFooter}>
              <TouchableOpacity
                style={styles.cancelCheckoutBtn}
                onPress={cerrarCheckout}
              >
                <Text style={styles.cancelCheckoutText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmCheckoutBtn,
                  metodoPago === 'efectivo' &&
                  (!efectivoRecibido || isNaN(parseFloat(efectivoRecibido)) || parseFloat(efectivoRecibido) < calcularTotal()) &&
                  styles.disabledButton
                ]}
                onPress={finalizarVenta}
                disabled={
                  metodoPago === 'efectivo' &&
                  (!efectivoRecibido || isNaN(parseFloat(efectivoRecibido)) || parseFloat(efectivoRecibido) < calcularTotal())
                }
              >
                <Text style={styles.confirmCheckoutText}>
                  CONFIRMAR VENTA
                </Text>
                <Text style={styles.confirmSubtext}>
                  ${calcularTotal().toLocaleString()}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 5,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff4444',
    marginLeft: 10,
  },
  cajaBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  cajaAbierta: {
    backgroundColor: '#4CAF50',
  },
  cajaCerrada: {
    backgroundColor: '#f44336',
  },
  cajaBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  promocionesBanner: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFB74D',
  },
  promoTag: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  promoTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    maxWidth: 200,
  },
  list: {
    alignItems: 'center',
    paddingBottom: 160,
    paddingTop: 10,
  },
  itemContainer: {
    margin: CARD_MARGIN,
    alignItems: 'center',
  },
  addBtn: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
    alignItems: 'center',
    minWidth: 150,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  preciosButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  preciosButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cart: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 2,
    borderTopColor: '#2196F3',
    padding: 15,
    elevation: 20,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 5,
    marginVertical: 5,
    minWidth: 200,
  },
  cartImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#666',
  },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginVertical: 10,
  },
  checkoutBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkoutSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalCocktailName: {
    color: '#2196F3',
  },
  promoOption: {
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  promoOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  promoOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  promoOptionBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  promoOptionDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  promoOptionAhorro: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  closeModalBtn: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  closeModalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  /* ====== ESTILOS DE CHECKOUT ====== */
  checkoutOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  checkoutContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  checkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  checkoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeCheckout: {
    fontSize: 24,
    color: '#ff4444',
    fontWeight: 'bold',
  },
  checkoutContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '75%',
  },
  checkoutSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  checkoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 13,
    color: '#666',
  },
  itemSubtotal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  paymentMethod: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  paymentMethodSelected: {
    backgroundColor: '#003b77',
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  paymentMethodTextSelected: {
    color: '#fff',
  },
  efectivoInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 2,
    borderColor: '#28a745',
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  cambioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
  },
  cambioLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cambioAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
  },
  observacionesInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  checkoutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  cancelCheckoutBtn: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelCheckoutText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmCheckoutBtn: {
    flex: 2,
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  confirmCheckoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    marginTop: 2,
  },
});

export default SheetView;