// ReportesScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    RefreshControl,
    FlatList,
    Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SimpleOperations from './simpleOperations';
import SimpleDatabase from './simpleDatabase';
import { BarChart, PieChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ReportesScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reporteDiario, setReporteDiario] = useState(null);
    const [extracciones, setExtracciones] = useState([]);
    const [topCocktails, setTopCocktails] = useState([]);
    const [ventasHoy, setVentasHoy] = useState([]);
    const [ventasPorMetodo, setVentasPorMetodo] = useState({});
    const [estadisticas, setEstadisticas] = useState({});
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        cargarDatos();
    }, [fechaSeleccionada]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            
            // 1. Cargar estadísticas generales
            const stats = await SimpleOperations.obtenerEstadisticas();
            setEstadisticas(stats);
            
            // 2. Cargar reporte diario
            await cargarReporteDiario();
            
            // 3. Cargar extracciones
            const extraccionesData = await SimpleOperations.obtenerExtracciones();
            setExtracciones(extraccionesData);
            
            // 4. Cargar cócteles más populares
            await cargarTopCocktails();
            
            // 5. Cargar ventas de hoy
            const ventas = await SimpleOperations.obtenerVentasPorFecha(fechaSeleccionada, fechaSeleccionada);
            setVentasHoy(ventas);
            
            // 6. Calcular ventas por método de pago
            calcularVentasPorMetodo(ventas);
            
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const cargarReporteDiario = async () => {
        try {
            // Obtener cierres de caja del día
            const historialCaja = await SimpleOperations.obtenerHistorialCaja();
            
            // Filtrar cierres del día seleccionado
            const cierresHoy = historialCaja.filter(item => 
                item.fecha && item.fecha.startsWith(fechaSeleccionada) && item.tipo === 'cierre'
            );
            
            // Obtener aperturas del día
            const aperturasHoy = historialCaja.filter(item =>
                item.fecha && item.fecha.startsWith(fechaSeleccionada) && item.tipo === 'apertura'
            );
            
            // Obtener ventas del día
            const ventasHoy = await SimpleOperations.obtenerVentasPorFecha(fechaSeleccionada, fechaSeleccionada);
            
            // Obtener extracciones del día
            const extraccionesHoy = extracciones.filter(item =>
                item.fecha && item.fecha.startsWith(fechaSeleccionada)
            );
            
            // Calcular totales
            const montoApertura = aperturasHoy.length > 0 ? Math.max(...aperturasHoy.map(a => a.monto)) : 0;
            const montoCierre = cierresHoy.length > 0 ? Math.max(...cierresHoy.map(c => c.monto)) : 0;
            const totalVentas = ventasHoy.reduce((sum, venta) => sum + (venta.total_con_descuento || 0), 0);
            const totalExtracciones = extraccionesHoy.reduce((sum, ext) => sum + (ext.monto || 0), 0);
            
            // Calcular ganancia teórica
            const gananciaTeorica = (montoCierre - montoApertura) - totalExtracciones;
            
            setReporteDiario({
                fecha: fechaSeleccionada,
                apertura: montoApertura,
                cierre: montoCierre,
                ventas: totalVentas,
                extracciones: totalExtracciones,
                ganancia: gananciaTeorica,
                cierreRegistrado: cierresHoy.length > 0,
                cantidadVentas: ventasHoy.length,
                cantidadExtracciones: extraccionesHoy.length
            });
            
        } catch (error) {
            console.error('Error cargando reporte diario:', error);
        }
    };

    const cargarTopCocktails = async () => {
        try {
            const cocktails = await SimpleOperations.obtenerCocktails();
            
            // Ordenar por popularidad (descendente)
            const sorted = cocktails
                .filter(c => c.popularidad > 0)
                .sort((a, b) => b.popularidad - a.popularidad)
                .slice(0, 10); // Top 10
            
            setTopCocktails(sorted);
        } catch (error) {
            console.error('Error cargando top cócteles:', error);
        }
    };

    const calcularVentasPorMetodo = (ventas) => {
        const porMetodo = {
            efectivo: 0,
            tarjeta: 0,
            transferencia: 0
        };
        
        ventas.forEach(venta => {
            const metodo = venta.metodo_pago || 'efectivo';
            const monto = venta.total_con_descuento || 0;
            
            if (porMetodo[metodo] !== undefined) {
                porMetodo[metodo] += monto;
            } else {
                porMetodo[metodo] = monto;
            }
        });
        
        setVentasPorMetodo(porMetodo);
    };

    const onRefresh = () => {
        setRefreshing(true);
        cargarDatos();
    };

    const cambiarFecha = (dias) => {
        const fecha = new Date(fechaSeleccionada);
        fecha.setDate(fecha.getDate() + dias);
        setFechaSeleccionada(fecha.toISOString().split('T')[0]);
    };

    const formatCurrency = (amount) => {
        return `$${amount?.toLocaleString('es-AR') || '0'}`;
    };

    const renderReporteDiario = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>📊 Reporte Diario</Text>
                <Text style={styles.cardSubtitle}>{fechaSeleccionada}</Text>
            </View>
            
            <View style={styles.reporteGrid}>
                <View style={styles.reporteItem}>
                    <Text style={styles.reporteLabel}>Apertura</Text>
                    <Text style={styles.reporteValue}>{formatCurrency(reporteDiario?.apertura)}</Text>
                </View>
                
                <View style={styles.reporteItem}>
                    <Text style={styles.reporteLabel}>Ventas</Text>
                    <Text style={styles.reporteValue}>{formatCurrency(reporteDiario?.ventas)}</Text>
                    <Text style={styles.reporteCount}>({reporteDiario?.cantidadVentas || 0} ventas)</Text>
                </View>
                
                <View style={styles.reporteItem}>
                    <Text style={styles.reporteLabel}>Extracciones</Text>
                    <Text style={[styles.reporteValue, styles.negativeValue]}>
                        {formatCurrency(reporteDiario?.extracciones)}
                    </Text>
                    <Text style={styles.reporteCount}>({reporteDiario?.cantidadExtracciones || 0})</Text>
                </View>
                
                <View style={styles.reporteItem}>
                    <Text style={styles.reporteLabel}>Cierre</Text>
                    <Text style={[
                        styles.reporteValue,
                        reporteDiario?.cierreRegistrado ? styles.positiveValue : styles.warningValue
                    ]}>
                        {reporteDiario?.cierreRegistrado ? formatCurrency(reporteDiario?.cierre) : 'Sin cerrar'}
                    </Text>
                </View>
            </View>
            
            <View style={styles.gananciaContainer}>
                <Text style={styles.gananciaLabel}>Ganancia Teórica:</Text>
                <Text style={[
                    styles.gananciaValue,
                    (reporteDiario?.ganancia || 0) >= 0 ? styles.positiveValue : styles.negativeValue
                ]}>
                    {formatCurrency(reporteDiario?.ganancia)}
                </Text>
            </View>
            
            <Text style={styles.formula}>
                (Cierre - Apertura) - Extracciones = {formatCurrency(reporteDiario?.ganancia)}
            </Text>
        </View>
    );

    const renderExtracciones = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>💸 Historial de Extracciones</Text>
                <Text style={styles.cardSubtitle}>{extracciones.length} registros</Text>
            </View>
            
            {extracciones.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No hay extracciones registradas</Text>
                </View>
            ) : (
                <FlatList
                    data={extracciones.slice(0, 10)} // Mostrar solo las 10 más recientes
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.extraccionItem}>
                            <View style={styles.extraccionHeader}>
                                <Text style={styles.extraccionMotivo}>{item.motivo}</Text>
                                <Text style={styles.extraccionMonto}>
                                    -{formatCurrency(item.monto)}
                                </Text>
                            </View>
                            <View style={styles.extraccionDetails}>
                                <Text style={styles.extraccionFecha}>
                                    {new Date(item.fecha).toLocaleDateString()} {new Date(item.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                {item.categoria && (
                                    <Text style={styles.extraccionCategoria}>{item.categoria}</Text>
                                )}
                            </View>
                            {item.observaciones && (
                                <Text style={styles.extraccionObservaciones}>
                                    📝 {item.observaciones}
                                </Text>
                            )}
                        </View>
                    )}
                    scrollEnabled={false}
                />
            )}
            
            {extracciones.length > 10 && (
                <TouchableOpacity
                    style={styles.verMasButton}
                    onPress={() => navigation.navigate('ExtraccionesScreen')}
                >
                    <Text style={styles.verMasText}>Ver todas ({extracciones.length})</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderTopCocktails = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>🏆 Top Cócteles Populares</Text>
                <Text style={styles.cardSubtitle}>Más vendidos</Text>
            </View>
            
            {topCocktails.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No hay datos de popularidad</Text>
                </View>
            ) : (
                <View style={styles.topList}>
                    {topCocktails.map((cocktail, index) => (
                        <View key={cocktail.id} style={styles.topItem}>
                            <View style={styles.topPosition}>
                                <Text style={styles.positionText}>#{index + 1}</Text>
                            </View>
                            <View style={styles.topInfo}>
                                <Text style={styles.topName}>{cocktail.nombre}</Text>
                                <Text style={styles.topCategory}>{cocktail.categoria}</Text>
                            </View>
                            <View style={styles.topStats}>
                                <Text style={styles.topPopularity}>{cocktail.popularidad} ventas</Text>
                                {cocktail.precio1 && (
                                    <Text style={styles.topPrice}>
                                        {formatCurrency(cocktail.precio1)}
                                    </Text>
                                )}
                            </View>
                        </View>
                    ))}
                </View>
            )}
            
            <View style={styles.statsSummary}>
                <Text style={styles.summaryText}>
                    Total de ventas registradas: {topCocktails.reduce((sum, c) => sum + c.popularidad, 0)}
                </Text>
            </View>
        </View>
    );

    const renderVentasPorMetodo = () => {
        const total = Object.values(ventasPorMetodo).reduce((sum, val) => sum + val, 0);
        const data = [
            {
                name: 'Efectivo',
                population: ventasPorMetodo.efectivo || 0,
                color: '#4CAF50',
                legendFontColor: '#7F7F7F',
                legendFontSize: 12,
            },
            {
                name: 'Tarjeta',
                population: ventasPorMetodo.tarjeta || 0,
                color: '#2196F3',
                legendFontColor: '#7F7F7F',
                legendFontSize: 12,
            },
            {
                name: 'Transferencia',
                population: ventasPorMetodo.transferencia || 0,
                color: '#9C27B0',
                legendFontColor: '#7F7F7F',
                legendFontSize: 12,
            },
        ].filter(item => item.population > 0);

        if (data.length === 0) return null;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>💳 Ventas por Método de Pago</Text>
                    <Text style={styles.cardSubtitle}>Total: {formatCurrency(total)}</Text>
                </View>
                
                <View style={styles.chartContainer}>
                    <PieChart
                        data={data}
                        width={Dimensions.get('window').width - 80}
                        height={180}
                        chartConfig={{
                            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        }}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                    />
                </View>
                
                <View style={styles.metodoStats}>
                    {data.map((item, index) => {
                        const porcentaje = total > 0 ? ((item.population / total) * 100).toFixed(1) : 0;
                        return (
                            <View key={index} style={styles.metodoItem}>
                                <View style={[styles.metodoColor, { backgroundColor: item.color }]} />
                                <Text style={styles.metodoName}>{item.name}</Text>
                                <Text style={styles.metodoValue}>{formatCurrency(item.population)}</Text>
                                <Text style={styles.metodoPorcentaje}>{porcentaje}%</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderResumenDiario = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>📈 Resumen del Día</Text>
            </View>
            
            <View style={styles.resumenGrid}>
                <View style={styles.resumenItem}>
                    <Text style={styles.resumenValue}>{estadisticas.ventas_hoy || 0}</Text>
                    <Text style={styles.resumenLabel}>Ventas</Text>
                </View>
                
                <View style={styles.resumenItem}>
                    <Text style={styles.resumenValue}>{formatCurrency(estadisticas.monto_hoy || 0)}</Text>
                    <Text style={styles.resumenLabel}>Recaudación</Text>
                </View>
                
                <View style={styles.resumenItem}>
                    <Text style={styles.resumenValue}>{estadisticas.total_cocktails || 0}</Text>
                    <Text style={styles.resumenLabel}>Productos</Text>
                </View>
                
                <View style={styles.resumenItem}>
                    <Text style={[
                        styles.resumenValue,
                        estadisticas.caja_abierta ? styles.positiveValue : styles.warningValue
                    ]}>
                        {estadisticas.caja_abierta ? '💰' : '🔒'}
                    </Text>
                    <Text style={styles.resumenLabel}>
                        {estadisticas.caja_abierta ? 'Abierta' : 'Cerrada'}
                    </Text>
                </View>
            </View>
            
            <View style={styles.resumenActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('VentasScreen')}
                >
                    <Icon name="receipt" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Ver Ventas</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('CajaScreen')}
                >
                    <Icon name="account-balance-wallet" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Gestionar Caja</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#003b77" />
                <Text style={styles.loadingText}>Cargando reportes...</Text>
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
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                
                <Text style={styles.headerTitle}>📊 Reportes y Estadísticas</Text>
                
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => cambiarFecha(-1)}
                    >
                        <Icon name="chevron-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={styles.currentDateButton}
                        onPress={() => setFechaSeleccionada(new Date().toISOString().split('T')[0])}
                    >
                        <Text style={styles.dateText}>{fechaSeleccionada}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => cambiarFecha(1)}
                        disabled={fechaSeleccionada >= new Date().toISOString().split('T')[0]}
                    >
                        <Icon 
                            name="chevron-right" 
                            size={24} 
                            color={fechaSeleccionada >= new Date().toISOString().split('T')[0] ? '#666' : '#fff'} 
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#003b77']}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Resumen Diario */}
                {renderResumenDiario()}
                
                {/* Reporte Diario */}
                {reporteDiario && renderReporteDiario()}
                
                {/* Ventas por Método */}
                {renderVentasPorMetodo()}
                
                {/* Top Cócteles */}
                {renderTopCocktails()}
                
                {/* Extracciones */}
                {renderExtracciones()}
                
                {/* Nota Informativa */}
                <View style={styles.infoCard}>
                    <Icon name="info" size={20} color="#003b77" />
                    <Text style={styles.infoText}>
                        La popularidad de los cócteles aumenta automáticamente con cada venta.
                        La ganancia teórica se calcula: (Cierre - Apertura) - Extracciones.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
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
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateButton: {
        padding: 8,
    },
    currentDateButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginHorizontal: 8,
    },
    dateText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    reporteGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    reporteItem: {
        width: '48%',
        marginBottom: 16,
        alignItems: 'center',
    },
    reporteLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    reporteValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#28a745',
    },
    reporteCount: {
        fontSize: 10,
        color: '#999',
        marginTop: 2,
    },
    negativeValue: {
        color: '#dc3545',
    },
    positiveValue: {
        color: '#28a745',
    },
    warningValue: {
        color: '#ff9800',
    },
    gananciaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    gananciaLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    gananciaValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    formula: {
        fontSize: 11,
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 8,
    },
    extraccionItem: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    extraccionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    extraccionMotivo: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    extraccionMonto: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#dc3545',
    },
    extraccionDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    extraccionFecha: {
        fontSize: 12,
        color: '#666',
    },
    extraccionCategoria: {
        fontSize: 11,
        color: '#fff',
        backgroundColor: '#6c757d',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    extraccionObservaciones: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        fontStyle: 'italic',
    },
    verMasButton: {
        backgroundColor: '#003b77',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    verMasText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    topList: {
        marginTop: 8,
    },
    topItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    topPosition: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#003b77',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    positionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    topInfo: {
        flex: 1,
    },
    topName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    topCategory: {
        fontSize: 12,
        color: '#666',
    },
    topStats: {
        alignItems: 'flex-end',
    },
    topPopularity: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#28a745',
    },
    topPrice: {
        fontSize: 12,
        color: '#666',
    },
    statsSummary: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    summaryText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    chartContainer: {
        alignItems: 'center',
        marginVertical: 16,
    },
    metodoStats: {
        marginTop: 16,
    },
    metodoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    metodoColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    metodoName: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    metodoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginRight: 12,
    },
    metodoPorcentaje: {
        fontSize: 14,
        color: '#666',
        minWidth: 40,
        textAlign: 'right',
    },
    resumenGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    resumenItem: {
        alignItems: 'center',
        flex: 1,
    },
    resumenValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#003b77',
        marginBottom: 4,
    },
    resumenLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    resumenActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#003b77',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#e8f4fd',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#003b77',
        marginLeft: 12,
    },
});

export default ReportesScreen;