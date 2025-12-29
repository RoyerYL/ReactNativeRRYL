// CajaVentasScreen.js - VERSIÓN CORREGIDA
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SimpleDatabase from './simpleDatabase';
import SimpleOperations from './simpleOperations';

const CajaVentasScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ventas, setVentas] = useState([]);
  const [resumenCaja, setResumenCaja] = useState(null);
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [montoCaja, setMontoCaja] = useState(0);
  const [modalAperturaVisible, setModalAperturaVisible] = useState(false);
  const [modalCierreVisible, setModalCierreVisible] = useState(false);
  const [modalExtraccionVisible, setModalExtraccionVisible] = useState(false);
  const [montoApertura, setMontoApertura] = useState('');
  const [montoCierre, setMontoCierre] = useState('');
  const [montoExtraccion, setMontoExtraccion] = useState('');
  const [motivoExtraccion, setMotivoExtraccion] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('hoy');
  const [detallesVentaVisible, setDetallesVentaVisible] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [filtroFecha]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // 1. Verificar estado de caja
      const estadoCaja = await SimpleDatabase.getEstadoCaja();
      setCajaAbierta(estadoCaja.abierta);
      setMontoCaja(estadoCaja.monto || 0);
      
      // 2. Cargar ventas según filtro
      await cargarVentas();
      
      // 3. Calcular resumen
      await calcularResumen();
      
      // 4. Cargar estadísticas
      await cargarEstadisticas();
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const cargarVentas = async () => {
    try {
      // Método más simple - obtener todas las ventas
      const todasVentas = await SimpleDatabase.getAllVentas();
      
      if (!todasVentas || !Array.isArray(todasVentas)) {
        console.warn('No hay ventas o formato incorrecto');
        setVentas([]);
        return;
      }
      
      // Filtrar por fecha
      const ahora = new Date();
      let ventasFiltradas = [...todasVentas];
      
      // Asegurar que todas las ventas tengan fecha
      ventasFiltradas = ventasFiltradas.filter(v => v && v.fecha);
      
      switch (filtroFecha) {
        case 'hoy':
          const hoy = ahora.toISOString().split('T')[0];
          ventasFiltradas = ventasFiltradas.filter(v => 
            v.fecha.split('T')[0] === hoy
          );
          break;
          
        case 'ayer':
          const ayer = new Date(ahora);
          ayer.setDate(ahora.getDate() - 1);
          const fechaAyer = ayer.toISOString().split('T')[0];
          ventasFiltradas = ventasFiltradas.filter(v => 
            v.fecha.split('T')[0] === fechaAyer
          );
          break;
          
        case 'semana':
          const semanaPasada = new Date(ahora);
          semanaPasada.setDate(ahora.getDate() - 7);
          ventasFiltradas = ventasFiltradas.filter(v => {
            try {
              const fechaVenta = new Date(v.fecha);
              return fechaVenta >= semanaPasada;
            } catch {
              return false;
            }
          });
          break;
          
        case 'mes':
          const mesPasado = new Date(ahora);
          mesPasado.setMonth(ahora.getMonth() - 1);
          ventasFiltradas = ventasFiltradas.filter(v => {
            try {
              const fechaVenta = new Date(v.fecha);
              return fechaVenta >= mesPasado;
            } catch {
              return false;
            }
          });
          break;
          
        case 'todo':
          // Mantener todas las ventas
          break;
          
        default:
          // Por defecto mostrar hoy
          const hoyDefault = ahora.toISOString().split('T')[0];
          ventasFiltradas = ventasFiltradas.filter(v => 
            v.fecha.split('T')[0] === hoyDefault
          );
      }
      
      // Ordenar por fecha (más reciente primero)
      ventasFiltradas.sort((a, b) => {
        try {
          return new Date(b.fecha) - new Date(a.fecha);
        } catch {
          return 0;
        }
      });
      
      setVentas(ventasFiltradas);
      
    } catch (error) {
      console.error('Error cargando ventas:', error);
      setVentas([]);
    }
  };

  const calcularResumen = () => {
    try {
      const ventasFiltradas = ventas;
      
      const resumen = {
        totalVentas: ventasFiltradas.length,
        totalIngresos: ventasFiltradas.reduce((sum, v) => 
          sum + (v.total_con_descuento || v.total_normal || 0), 0),
        totalEfectivo: ventasFiltradas
          .filter(v => v.metodo_pago === 'efectivo')
          .reduce((sum, v) => sum + (v.total_con_descuento || v.total_normal || 0), 0),
        totalTarjeta: ventasFiltradas
          .filter(v => v.metodo_pago === 'tarjeta')
          .reduce((sum, v) => sum + (v.total_con_descuento || v.total_normal || 0), 0),
        totalTransferencia: ventasFiltradas
          .filter(v => v.metodo_pago === 'transferencia')
          .reduce((sum, v) => sum + (v.total_con_descuento || v.total_normal || 0), 0),
        promedioTicket: ventasFiltradas.length > 0 
          ? ventasFiltradas.reduce((sum, v) => sum + (v.total_con_descuento || v.total_normal || 0), 0) / ventasFiltradas.length
          : 0,
        totalCocktails: ventasFiltradas.reduce((sum, v) => {
          if (v.detalles && Array.isArray(v.detalles)) {
            return sum + v.detalles.reduce((sumDet, d) => sumDet + (d.cantidad || 0), 0);
          }
          return sum + 1; // Si no hay detalles, asumir 1 cóctel
        }, 0),
      };
      
      setResumenCaja(resumen);
    } catch (error) {
      console.error('Error calculando resumen:', error);
      setResumenCaja({
        totalVentas: 0,
        totalIngresos: 0,
        totalEfectivo: 0,
        totalTarjeta: 0,
        totalTransferencia: 0,
        promedioTicket: 0,
        totalCocktails: 0
      });
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const stats = await SimpleDatabase.getEstadisticas();
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setEstadisticas({
        total_cocktails: 0,
        ventas_hoy: 0,
        monto_hoy: 0,
        caja_abierta: false,
        promociones_activas: 0
      });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  const handleAbrirCaja = async () => {
    if (!montoApertura || isNaN(parseFloat(montoApertura)) || parseFloat(montoApertura) < 0) {
      Alert.alert('Error', 'Ingrese un monto válido');
      return;
    }

    try {
      const monto = parseFloat(montoApertura);
      await SimpleOperations.abrirCajaDia(monto);
      
      Alert.alert('✅ Caja Abierta', `Caja abierta con $${monto.toLocaleString()}`);
      setModalAperturaVisible(false);
      setMontoApertura('');
      await cargarDatos();
      
    } catch (error) {
      console.error('Error abriendo caja:', error);
      Alert.alert('❌ Error', 'No se pudo abrir la caja');
    }
  };

  const handleCerrarCaja = async () => {
    if (!montoCierre || isNaN(parseFloat(montoCierre)) || parseFloat(montoCierre) < 0) {
      Alert.alert('Error', 'Ingrese un monto válido');
      return;
    }

    Alert.alert(
      '⚠️ Confirmar Cierre de Caja',
      `¿Está seguro de cerrar la caja?\n\nMonto en caja: $${montoCaja.toLocaleString()}\nMonto reportado: $${parseFloat(montoCierre).toLocaleString()}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Caja',
          style: 'destructive',
          onPress: async () => {
            try {
              const monto = parseFloat(montoCierre);
              await SimpleOperations.cerrarCajaDia({
                monto_cierre: monto,
                observaciones: 'Cierre de caja normal'
              });
              
              Alert.alert('✅ Caja Cerrada', `Caja cerrada correctamente`);
              setModalCierreVisible(false);
              setMontoCierre('');
              await cargarDatos();
              
            } catch (error) {
              console.error('Error cerrando caja:', error);
              Alert.alert('❌ Error', 'No se pudo cerrar la caja');
            }
          }
        }
      ]
    );
  };

  const handleExtraccion = async () => {
    if (!montoExtraccion || isNaN(parseFloat(montoExtraccion)) || parseFloat(montoExtraccion) <= 0) {
      Alert.alert('Error', 'Ingrese un monto válido');
      return;
    }

    if (!motivoExtraccion.trim()) {
      Alert.alert('Error', 'Ingrese un motivo para la extracción');
      return;
    }

    if (parseFloat(montoExtraccion) > montoCaja) {
      Alert.alert('Error', 'El monto a extraer supera el dinero disponible en caja');
      return;
    }

    Alert.alert(
      '⚠️ Confirmar Extracción',
      `¿Extraer $${parseFloat(montoExtraccion).toLocaleString()} de la caja?\n\nMotivo: ${motivoExtraccion}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Extraer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Registrar extracción
              await SimpleDatabase.registrarExtraccion({
                monto: parseFloat(montoExtraccion),
                motivo: motivoExtraccion,
                fecha: new Date().toISOString()
              });
              
              // Actualizar monto en caja
              const nuevoMonto = montoCaja - parseFloat(montoExtraccion);
              await SimpleDatabase.actualizarMontoCaja(nuevoMonto);
              
              Alert.alert('✅ Extracción Exitosa', `Se extrajeron $${parseFloat(montoExtraccion).toLocaleString()}`);
              setModalExtraccionVisible(false);
              setMontoExtraccion('');
              setMotivoExtraccion('');
              await cargarDatos();
              
            } catch (error) {
              console.error('Error en extracción:', error);
              Alert.alert('❌ Error', 'No se pudo realizar la extracción');
            }
          }
        }
      ]
    );
  };

  const renderVentaItem = ({ item }) => {
    if (!item) return null;
    
    const ticketNum = item.numero_ticket || item.ticket || `#${item.id}`;
    const fecha = item.fecha ? new Date(item.fecha) : new Date();
    const total = item.total_con_descuento || item.total_normal || item.total || 0;
    const metodoPago = item.metodo_pago || 'efectivo';
    const cliente = item.cliente || 'Cliente no registrado';
    const itemsCount = item.detalles ? item.detalles.length : 1;
    const descuento = item.descuento_total || 0;
    
    return (
      <TouchableOpacity
        style={styles.ventaItem}
        onPress={() => {
          setVentaSeleccionada(item);
          setDetallesVentaVisible(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.ventaHeader}>
          <View>
            <Text style={styles.ventaTicket}>Ticket {ticketNum}</Text>
            <Text style={styles.ventaFecha}>
              {fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
          
          <View style={[
            styles.metodoPagoBadge,
            { backgroundColor: getColorMetodoPago(metodoPago) }
          ]}>
            <Text style={styles.metodoPagoText}>
              {metodoPago === 'efectivo' ? '💰' : 
               metodoPago === 'tarjeta' ? '💳' : '📱'}
            </Text>
          </View>
        </View>
        
        <View style={styles.ventaBody}>
          <View style={styles.ventaInfo}>
            <Text style={styles.ventaItems}>
              {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
            </Text>
            <Text style={styles.ventaCliente}>
              {cliente}
            </Text>
          </View>
          
          <View style={styles.ventaTotales}>
            <Text style={styles.ventaTotal}>
              ${total.toLocaleString()}
            </Text>
            {descuento > 0 && (
              <Text style={styles.ventaDescuento}>
                -${descuento.toLocaleString()}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getColorMetodoPago = (metodo) => {
    switch (metodo) {
      case 'efectivo': return '#4CAF50';
      case 'tarjeta': return '#2196F3';
      case 'transferencia': return '#9C27B0';
      default: return '#757575';
    }
  };

  const formatMoneda = (monto) => {
    const numero = parseFloat(monto || 0);
    return `$${numero.toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003b77" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#003b77" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Ventas & Caja</Text>
        
        <TouchableOpacity
          style={styles.reloadButton}
          onPress={cargarDatos}
        >
          <Text style={styles.reloadButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#003b77']}
            />
          }
        >
          {/* Estado de Caja */}
          <View style={styles.cajaSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Estado de Caja</Text>
              <View style={[
                styles.cajaStatusBadge,
                { backgroundColor: cajaAbierta ? '#4CAF50' : '#f44336' }
              ]}>
                <Text style={styles.cajaStatusText}>
                  {cajaAbierta ? 'ABIERTA' : 'CERRADA'}
                </Text>
              </View>
            </View>
            
            <View style={styles.cajaInfo}>
              <View style={styles.cajaMonto}>
                <Text style={styles.cajaMontoLabel}>Dinero en Caja</Text>
                <Text style={styles.cajaMontoValue}>
                  {formatMoneda(montoCaja)}
                </Text>
              </View>
              
              <View style={styles.cajaActions}>
                {!cajaAbierta ? (
                  <TouchableOpacity
                    style={[styles.cajaButton, styles.abrirCajaButton]}
                    onPress={() => setModalAperturaVisible(true)}
                  >
                    <Text style={styles.cajaButtonText}>💰 Abrir Caja</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.cajaButton, styles.extraerButton]}
                      onPress={() => setModalExtraccionVisible(true)}
                    >
                      <Text style={styles.cajaButtonText}>📤 Extraer</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.cajaButton, styles.cerrarCajaButton]}
                      onPress={() => setModalCierreVisible(true)}
                    >
                      <Text style={styles.cajaButtonText}>🔒 Cerrar Caja</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Resumen de Ventas */}
          {resumenCaja && (
            <View style={styles.resumenSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Resumen de Ventas</Text>
                
                {/* Filtros de fecha */}
                <View style={styles.filtrosContainer}>
                  {['hoy', 'ayer', 'semana', 'mes', 'todo'].map((filtro) => (
                    <TouchableOpacity
                      key={filtro}
                      style={[
                        styles.filtroButton,
                        filtroFecha === filtro && styles.filtroButtonActive
                      ]}
                      onPress={() => setFiltroFecha(filtro)}
                    >
                      <Text style={[
                        styles.filtroButtonText,
                        filtroFecha === filtro && styles.filtroButtonTextActive
                      ]}>
                        {filtro === 'hoy' ? 'Hoy' :
                         filtro === 'ayer' ? 'Ayer' :
                         filtro === 'semana' ? 'Semana' :
                         filtro === 'mes' ? 'Mes' : 'Todo'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.resumenGrid}>
                <View style={styles.resumenCard}>
                  <Text style={styles.resumenLabel}>Total Ventas</Text>
                  <Text style={styles.resumenValue}>{resumenCaja.totalVentas}</Text>
                  <Text style={styles.resumenSubtext}>transacciones</Text>
                </View>
                
                <View style={styles.resumenCard}>
                  <Text style={styles.resumenLabel}>Ingresos Totales</Text>
                  <Text style={styles.resumenValue}>
                    {formatMoneda(resumenCaja.totalIngresos)}
                  </Text>
                  <Text style={styles.resumenSubtext}>recaudado</Text>
                </View>
                
                <View style={styles.resumenCard}>
                  <Text style={styles.resumenLabel}>Ticket Promedio</Text>
                  <Text style={styles.resumenValue}>
                    {formatMoneda(resumenCaja.promedioTicket)}
                  </Text>
                  <Text style={styles.resumenSubtext}>por venta</Text>
                </View>
                
                <View style={styles.resumenCard}>
                  <Text style={styles.resumenLabel}>Total Cócteles</Text>
                  <Text style={styles.resumenValue}>{resumenCaja.totalCocktails}</Text>
                  <Text style={styles.resumenSubtext}>vendidos</Text>
                </View>
              </View>
              
              {/* Desglose por método de pago */}
              <View style={styles.metodosPago}>
                <Text style={styles.metodosTitle}>Por Método de Pago</Text>
                <View style={styles.metodosGrid}>
                  <View style={styles.metodoItem}>
                    <View style={[styles.metodoIcon, { backgroundColor: '#4CAF50' }]}>
                      <Text style={styles.metodoIconText}>💰</Text>
                    </View>
                    <Text style={styles.metodoLabel}>Efectivo</Text>
                    <Text style={styles.metodoMonto}>
                      {formatMoneda(resumenCaja.totalEfectivo)}
                    </Text>
                  </View>
                  
                  <View style={styles.metodoItem}>
                    <View style={[styles.metodoIcon, { backgroundColor: '#2196F3' }]}>
                      <Text style={styles.metodoIconText}>💳</Text>
                    </View>
                    <Text style={styles.metodoLabel}>Tarjeta</Text>
                    <Text style={styles.metodoMonto}>
                      {formatMoneda(resumenCaja.totalTarjeta)}
                    </Text>
                  </View>
                  
                  <View style={styles.metodoItem}>
                    <View style={[styles.metodoIcon, { backgroundColor: '#9C27B0' }]}>
                      <Text style={styles.metodoIconText}>📱</Text>
                    </View>
                    <Text style={styles.metodoLabel}>Transferencia</Text>
                    <Text style={styles.metodoMonto}>
                      {formatMoneda(resumenCaja.totalTransferencia)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Historial de Ventas */}
          <View style={styles.ventasSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Historial de Ventas</Text>
              <Text style={styles.ventasCount}>
                {ventas.length} ventas
              </Text>
            </View>
            
            {ventas.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No hay ventas registradas para este período
                </Text>
              </View>
            ) : (
              <FlatList
                data={ventas}
                renderItem={renderVentaItem}
                keyExtractor={item => item.id ? item.id.toString() : Math.random().toString()}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </View>

          {/* Estadísticas */}
          {estadisticas && (
            <View style={styles.estadisticasSection}>
              <Text style={styles.sectionTitle}>Estadísticas Generales</Text>
              <View style={styles.estadisticasGrid}>
                <View style={styles.estadisticaCard}>
                  <Text style={styles.estadisticaValue}>
                    {estadisticas.total_cocktails || 0}
                  </Text>
                  <Text style={styles.estadisticaLabel}>Cócteles en Menú</Text>
                </View>
                
                <View style={styles.estadisticaCard}>
                  <Text style={styles.estadisticaValue}>
                    {estadisticas.ventas_hoy || 0}
                  </Text>
                  <Text style={styles.estadisticaLabel}>Ventas Hoy</Text>
                </View>
                
                <View style={styles.estadisticaCard}>
                  <Text style={styles.estadisticaValue}>
                    {formatMoneda(estadisticas.monto_hoy || 0)}
                  </Text>
                  <Text style={styles.estadisticaLabel}>Recaudado Hoy</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Apertura de Caja */}
      <Modal
        visible={modalAperturaVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalAperturaVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💰 Abrir Caja</Text>
            <Text style={styles.modalSubtitle}>
              Ingrese el monto inicial de dinero en caja
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Monto inicial"
              value={montoApertura}
              onChangeText={setMontoApertura}
              keyboardType="numeric"
              autoFocus={true}
              placeholderTextColor="#999"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => {
                  setModalAperturaVisible(false);
                  setMontoApertura('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={handleAbrirCaja}
                disabled={!montoApertura || isNaN(parseFloat(montoApertura))}
              >
                <Text style={styles.modalConfirmText}>Abrir Caja</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Cierre de Caja */}
      <Modal
        visible={modalCierreVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalCierreVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔒 Cerrar Caja</Text>
            <Text style={styles.modalSubtitle}>
              Dinero actual en caja: {formatMoneda(montoCaja)}
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Monto final reportado"
              value={montoCierre}
              onChangeText={setMontoCierre}
              keyboardType="numeric"
              autoFocus={true}
              placeholderTextColor="#999"
            />
            
            <Text style={styles.modalNote}>
              Verifique físicamente el dinero en caja antes de cerrar
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => {
                  setModalCierreVisible(false);
                  setMontoCierre('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={handleCerrarCaja}
                disabled={!montoCierre || isNaN(parseFloat(montoCierre))}
              >
                <Text style={styles.modalConfirmText}>Cerrar Caja</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Extracción de Dinero */}
      <Modal
        visible={modalExtraccionVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalExtraccionVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📤 Extraer Dinero</Text>
            <Text style={styles.modalSubtitle}>
              Disponible: {formatMoneda(montoCaja)}
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Monto a extraer"
              value={montoExtraccion}
              onChangeText={setMontoExtraccion}
              keyboardType="numeric"
              autoFocus={true}
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={[styles.modalInput, styles.motivoInput]}
              placeholder="Motivo de la extracción"
              value={motivoExtraccion}
              onChangeText={setMotivoExtraccion}
              multiline={true}
              numberOfLines={3}
              placeholderTextColor="#999"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => {
                  setModalExtraccionVisible(false);
                  setMontoExtraccion('');
                  setMotivoExtraccion('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={handleExtraccion}
                disabled={!montoExtraccion || !motivoExtraccion.trim()}
              >
                <Text style={styles.modalConfirmText}>Extraer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Detalles de Venta */}
      <Modal
        visible={detallesVentaVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetallesVentaVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detallesContent}>
            <View style={styles.detallesHeader}>
              <Text style={styles.detallesTitle}>
                Detalles de Venta
              </Text>
              <TouchableOpacity
                style={styles.closeDetalles}
                onPress={() => setDetallesVentaVisible(false)}
              >
                <Text style={styles.closeDetallesText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.detallesBody}>
              {ventaSeleccionada ? (
                <>
                  <View style={styles.detallesInfo}>
                    <Text style={styles.detallesFecha}>
                      Fecha: {ventaSeleccionada.fecha ? 
                        new Date(ventaSeleccionada.fecha).toLocaleString('es-ES') : 
                        'No disponible'}
                    </Text>
                    
                    <View style={styles.detallesCliente}>
                      <Text style={styles.detallesClienteLabel}>Cliente:</Text>
                      <Text style={styles.detallesClienteValue}>
                        {ventaSeleccionada.cliente || 'No registrado'}
                      </Text>
                    </View>
                    
                    <View style={styles.detallesMetodo}>
                      <Text style={styles.detallesMetodoLabel}>Método de pago:</Text>
                      <View style={[
                        styles.detallesMetodoBadge,
                        { backgroundColor: getColorMetodoPago(ventaSeleccionada.metodo_pago) }
                      ]}>
                        <Text style={styles.detallesMetodoText}>
                          {ventaSeleccionada.metodo_pago?.toUpperCase() || 'NO ESPECIFICADO'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.detallesItems}>
                    <Text style={styles.detallesItemsTitle}>Items Vendidos</Text>
                    
                    {ventaSeleccionada.detalles && ventaSeleccionada.detalles.length > 0 ? (
                      ventaSeleccionada.detalles.map((detalle, index) => (
                        <View key={index} style={styles.detalleItem}>
                          <View style={styles.detalleInfo}>
                            <Text style={styles.detalleNombre}>
                              {detalle.producto || detalle.nombre || `Cóctel #${detalle.cocktailId || index + 1}`}
                            </Text>
                            <Text style={styles.detalleCantidad}>
                              {detalle.cantidad || 1} x {formatMoneda(detalle.precio || detalle.precio_unitario || 0)}
                            </Text>
                          </View>
                          <Text style={styles.detalleSubtotal}>
                            {formatMoneda(detalle.subtotal || detalle.cantidad * (detalle.precio || 0))}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noDetalles}>No hay detalles disponibles</Text>
                    )}
                  </View>
                  
                  <View style={styles.detallesTotales}>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Subtotal:</Text>
                      <Text style={styles.totalValue}>
                        {formatMoneda(ventaSeleccionada.total_normal || ventaSeleccionada.total)}
                      </Text>
                    </View>
                    
                    {ventaSeleccionada.descuento_total > 0 && (
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Descuento:</Text>
                        <Text style={[styles.totalValue, styles.descuentoValue]}>
                          -{formatMoneda(ventaSeleccionada.descuento_total)}
                        </Text>
                      </View>
                    )}
                    
                    <View style={[styles.totalRow, styles.totalFinalRow]}>
                      <Text style={styles.totalFinalLabel}>TOTAL:</Text>
                      <Text style={styles.totalFinalValue}>
                        {formatMoneda(ventaSeleccionada.total_con_descuento || ventaSeleccionada.total_normal || ventaSeleccionada.total)}
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={styles.noDetalles}>No hay información de venta</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#003b77',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#002a55',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  reloadButton: {
    padding: 8,
  },
  reloadButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cajaSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cajaStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cajaStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cajaInfo: {
    marginTop: 12,
  },
  cajaMonto: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cajaMontoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cajaMontoValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  cajaActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cajaButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  abrirCajaButton: {
    backgroundColor: '#4CAF50',
  },
  extraerButton: {
    backgroundColor: '#FF9800',
  },
  cerrarCajaButton: {
    backgroundColor: '#f44336',
  },
  cajaButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  resumenSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filtrosContainer: {
    flexDirection: 'row',
  },
  filtroButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 6,
    backgroundColor: '#f5f5f5',
  },
  filtroButtonActive: {
    backgroundColor: '#003b77',
  },
  filtroButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filtroButtonTextActive: {
    color: '#fff',
  },
  resumenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  resumenCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  resumenLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  resumenValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003b77',
  },
  resumenSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  metodosPago: {
    marginTop: 8,
  },
  metodosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  metodosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metodoItem: {
    alignItems: 'center',
    flex: 1,
  },
  metodoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  metodoIconText: {
    fontSize: 20,
  },
  metodoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  metodoMonto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  ventasSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ventasCount: {
    fontSize: 14,
    color: '#666',
  },
  ventaItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  ventaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ventaTicket: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ventaFecha: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  metodoPagoBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metodoPagoText: {
    fontSize: 16,
  },
  ventaBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ventaInfo: {
    flex: 1,
  },
  ventaItems: {
    fontSize: 14,
    color: '#666',
  },
  ventaCliente: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  ventaTotales: {
    alignItems: 'flex-end',
  },
  ventaTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  ventaDescuento: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 2,
  },
  separator: {
    height: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  estadisticasSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 30,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  estadisticasGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  estadisticaCard: {
    alignItems: 'center',
    flex: 1,
    padding: 10,
  },
  estadisticaValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#003b77',
    marginBottom: 4,
  },
  estadisticaLabel: {
    fontSize: 12,
    color: '#666',
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
    borderRadius: 15,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  motivoInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  modalCancel: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalConfirm: {
    backgroundColor: '#003b77',
  },
  modalCancelText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  detallesContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '95%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  detallesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detallesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeDetalles: {
    padding: 8,
  },
  closeDetallesText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  detallesBody: {
    padding: 20,
  },
  detallesInfo: {
    marginBottom: 20,
  },
  detallesFecha: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  detallesCliente: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detallesClienteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  detallesClienteValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detallesMetodo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detallesMetodoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  detallesMetodoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  detallesMetodoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detallesItems: {
    marginBottom: 20,
  },
  detallesItemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detalleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detalleInfo: {
    flex: 1,
  },
  detalleNombre: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  detalleCantidad: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  detalleSubtotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  noDetalles: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  detallesTotales: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  descuentoValue: {
    color: '#f44336',
  },
  totalFinalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 12,
    marginTop: 4,
  },
  totalFinalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalFinalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});

export default CajaVentasScreen;