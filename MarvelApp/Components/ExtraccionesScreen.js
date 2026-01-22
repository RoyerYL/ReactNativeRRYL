// ExtraccionesScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SimpleOperations from './simpleOperations';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ExtraccionesScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [extracciones, setExtracciones] = useState([]);
    const [totalExtracciones, setTotalExtracciones] = useState(0);

    useEffect(() => {
        cargarExtracciones();
    }, []);

    const cargarExtracciones = async () => {
        try {
            setLoading(true);
            const data = await SimpleOperations.obtenerExtracciones();
            setExtracciones(data);
            
            // Calcular total
            const total = data.reduce((sum, ext) => sum + (ext.monto || 0), 0);
            setTotalExtracciones(total);
        } catch (error) {
            console.error('Error cargando extracciones:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        cargarExtracciones();
    };

    const formatCurrency = (amount) => {
        return `$${amount?.toLocaleString('es-AR') || '0'}`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderExtraccionItem = ({ item }) => (
        <View style={styles.extraccionItem}>
            <View style={styles.extraccionHeader}>
                <View style={styles.extraccionInfo}>
                    <Text style={styles.extraccionMotivo}>{item.motivo}</Text>
                    <Text style={styles.extraccionFecha}>{formatDate(item.fecha)}</Text>
                </View>
                <Text style={styles.extraccionMonto}>
                    -{formatCurrency(item.monto)}
                </Text>
            </View>
            
            {(item.categoria || item.observaciones) && (
                <View style={styles.extraccionDetails}>
                    {item.categoria && (
                        <View style={styles.categoriaBadge}>
                            <Text style={styles.categoriaText}>{item.categoria}</Text>
                        </View>
                    )}
                    {item.usuario && (
                        <Text style={styles.usuarioText}>👤 {item.usuario}</Text>
                    )}
                </View>
            )}
            
            {item.observaciones && (
                <Text style={styles.observacionesText}>📝 {item.observaciones}</Text>
            )}
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#003b77" />
                <Text style={styles.loadingText}>Cargando extracciones...</Text>
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
                
                <Text style={styles.headerTitle}>💸 Historial de Extracciones</Text>
                
                <View style={styles.headerStats}>
                    <Text style={styles.headerCount}>{extracciones.length} registros</Text>
                    <Text style={styles.headerTotal}>Total: -{formatCurrency(totalExtracciones)}</Text>
                </View>
            </View>

            <FlatList
                data={extracciones}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderExtraccionItem}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#003b77']}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Icon name="money-off" size={60} color="#ccc" />
                        <Text style={styles.emptyStateTitle}>Sin extracciones</Text>
                        <Text style={styles.emptyStateText}>
                            No hay registros de extracciones en la caja
                        </Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    extracciones.length > 0 ? (
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Resumen Total</Text>
                            <Text style={styles.summaryValue}>
                                -{formatCurrency(totalExtracciones)}
                            </Text>
                            <Text style={styles.summaryCount}>
                                {extracciones.length} extracciones registradas
                            </Text>
                        </View>
                    ) : null
                }
            />
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
        backgroundColor: '#003b77',
        paddingHorizontal: 16,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#002a55',
    },
    backButton: {
        position: 'absolute',
        left: 16,
        top: 15,
        zIndex: 1,
        padding: 8,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    headerStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerCount: {
        color: '#fff',
        fontSize: 14,
        opacity: 0.9,
    },
    headerTotal: {
        color: '#ff6b6b',
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryTitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#dc3545',
        marginBottom: 8,
    },
    summaryCount: {
        fontSize: 14,
        color: '#999',
    },
    extraccionItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    extraccionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    extraccionInfo: {
        flex: 1,
    },
    extraccionMotivo: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    extraccionFecha: {
        fontSize: 12,
        color: '#666',
    },
    extraccionMonto: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#dc3545',
    },
    extraccionDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoriaBadge: {
        backgroundColor: '#6c757d',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: 8,
    },
    categoriaText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    usuarioText: {
        fontSize: 12,
        color: '#666',
    },
    observacionesText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        maxWidth: 300,
    },
});

export default ExtraccionesScreen;