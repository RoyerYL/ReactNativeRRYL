// PreciosScreen.js
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SimpleDatabase from './simpleDatabase';
import SimpleOperations from './simpleOperations';

const PreciosScreen = () => {
    const navigation = useNavigation();
    const [cocktails, setCocktails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [cocktailEditando, setCocktailEditando] = useState(null);
    const [nuevoPrecio, setNuevoPrecio] = useState('');
    const [ajustePorcentaje, setAjustePorcentaje] = useState('');
    const [editandoMasivamente, setEditandoMasivamente] = useState(false);
    const [precioMasivo, setPrecioMasivo] = useState('');

    useEffect(() => {
        cargarCocktails();
    }, []);

    const cargarCocktails = async () => {
        try {
            setLoading(true);
            const data = await SimpleOperations.obtenerCocktails();
            setCocktails(data);
        } catch (error) {
            console.error('Error cargando cócteles:', error);
            Alert.alert('Error', 'No se pudieron cargar los cócteles');
        } finally {
            setLoading(false);
        }
    };

    // Filtrar cócteles por búsqueda
    const filteredCocktails = cocktails.filter(cocktail =>
        cocktail.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cocktail.categoria.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Agrupar por categoría
    const cocktailsPorCategoria = filteredCocktails.reduce((acc, cocktail) => {
        const categoria = cocktail.categoria || 'Otros';
        if (!acc[categoria]) {
            acc[categoria] = [];
        }
        acc[categoria].push(cocktail);
        return acc;
    }, {});

    const abrirModalEdicion = (cocktail) => {
        setCocktailEditando(cocktail);
        setNuevoPrecio(cocktail.precio?.toString() || '');
        setModalVisible(true);
    };

    const actualizarPrecio = async () => {
        if (!nuevoPrecio || isNaN(parseFloat(nuevoPrecio)) || parseFloat(nuevoPrecio) <= 0) {
            Alert.alert('Error', 'Ingrese un precio válido');
            return;
        }

        try {
            const precioNum = parseFloat(nuevoPrecio);
            const success = await SimpleDatabase.updateCocktail(cocktailEditando.id, {
                precio: precioNum
            });

            if (success) {
                // Actualizar estado local
                setCocktails(prev =>
                    prev.map(c =>
                        c.id === cocktailEditando.id
                            ? { ...c, precio: precioNum }
                            : c
                    )
                );

                Alert.alert('✅ Éxito', `Precio de "${cocktailEditando.nombre}" actualizado a $${precioNum.toLocaleString()}`);
                setModalVisible(false);
                setCocktailEditando(null);
                setNuevoPrecio('');
            } else {
                Alert.alert('❌ Error', 'No se pudo actualizar el precio');
            }
        } catch (error) {
            console.error('Error actualizando precio:', error);
            Alert.alert('❌ Error', 'Hubo un problema al actualizar');
        }
    };

    const aplicarAjustePorcentaje = () => {
        if (!ajustePorcentaje || isNaN(parseFloat(ajustePorcentaje))) {
            Alert.alert('Error', 'Ingrese un porcentaje válido');
            return;
        }

        const porcentaje = parseFloat(ajustePorcentaje);

        Alert.alert(
            '⚠️ Confirmar Ajuste Masivo',
            `¿Está seguro de aplicar un ${porcentaje > 0 ? 'aumento' : 'disminución'} del ${Math.abs(porcentaje)}% a TODOS los cócteles?\n\nEsta acción afectará a ${cocktails.length} productos.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Aplicar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const factor = 1 + (porcentaje / 100);

                            // Actualizar cada cóctel en la base de datos
                            for (const cocktail of cocktails) {
                                const nuevoPrecio = Math.round(cocktail.precio * factor);
                                await SimpleDatabase.updateCocktail(cocktail.id, {
                                    precio: nuevoPrecio
                                });
                            }

                            // Recargar datos
                            await cargarCocktails();

                            Alert.alert(
                                '✅ Éxito',
                                `Se actualizaron ${cocktails.length} cócteles.\n${porcentaje > 0 ? 'Aumento' : 'Disminución'} del ${Math.abs(porcentaje)}% aplicado.`
                            );
                            setAjustePorcentaje('');
                        } catch (error) {
                            console.error('Error en ajuste masivo:', error);
                            Alert.alert('❌ Error', 'No se pudieron actualizar todos los precios');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const aplicarPrecioMasivo = () => {
        if (!precioMasivo || isNaN(parseFloat(precioMasivo)) || parseFloat(precioMasivo) <= 0) {
            Alert.alert('Error', 'Ingrese un precio válido');
            return;
        }

        const precio = parseFloat(precioMasivo);

        Alert.alert(
            '⚠️ Precio Masivo',
            `¿Aplicar precio de $${precio.toLocaleString()} a TODOS los cócteles?\n\nEsta acción afectará a ${cocktails.length} productos.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Aplicar a Todos',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);

                            for (const cocktail of cocktails) {
                                await SimpleDatabase.updateCocktail(cocktail.id, {
                                    precio: precio
                                });
                            }

                            await cargarCocktails();
                            Alert.alert('✅ Éxito', `Todos los cócteles actualizados a $${precio.toLocaleString()}`);
                            setPrecioMasivo('');
                            setEditandoMasivamente(false);
                        } catch (error) {
                            console.error('Error en precio masivo:', error);
                            Alert.alert('❌ Error', 'No se pudieron actualizar los precios');
                        } finally {
                            setLoading(false);
                        }
                    }
                },
                {
                    text: 'Aplicar por Categoría',
                    onPress: () => mostrarOpcionesCategorias(precio)
                }
            ]
        );
    };

    const mostrarOpcionesCategorias = (precio) => {
        const categorias = [...new Set(cocktails.map(c => c.categoria))];

        Alert.alert(
            'Aplicar por Categoría',
            `Seleccione la categoría para aplicar $${precio.toLocaleString()}:`,
            categorias.map(cat => ({
                text: cat.charAt(0).toUpperCase() + cat.slice(1),
                onPress: () => aplicarPrecioPorCategoria(cat, precio)
            })).concat([{ text: 'Cancelar', style: 'cancel' }])
        );
    };

    const aplicarPrecioPorCategoria = async (categoria, precio) => {
        try {
            setLoading(true);
            const cocktailsCategoria = cocktails.filter(c => c.categoria === categoria);

            for (const cocktail of cocktailsCategoria) {
                await SimpleDatabase.updateCocktail(cocktail.id, {
                    precio: precio
                });
            }

            await cargarCocktails();
            Alert.alert('✅ Éxito', `${cocktailsCategoria.length} cócteles de "${categoria}" actualizados a $${precio.toLocaleString()}`);
            setPrecioMasivo('');
            setEditandoMasivamente(false);
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('❌ Error', 'No se pudieron actualizar los precios');
        } finally {
            setLoading(false);
        }
    };

    const renderCocktailItem = ({ item }) => (
        <TouchableOpacity
            style={styles.cocktailItem}
            onPress={() => abrirModalEdicion(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cocktailInfo}>
                <Text style={styles.cocktailName} numberOfLines={1}>
                    {item.nombre}
                </Text>
                <Text style={styles.cocktailCategory}>
                    {item.categoria}
                </Text>
            </View>

            <View style={styles.priceSection}>
                <Text style={styles.currentPrice}>
                    ${item.precio?.toLocaleString() || '0'}
                </Text>
                <Text style={styles.editHint}>Tocar para editar</Text>
            </View>

            <View style={styles.editIcon}>
                <Text style={styles.editIconText}>✏️</Text>
            </View>
        </TouchableOpacity>
    );

    const renderCategoriaSection = (categoria, items) => (
        <View key={categoria} style={styles.categoriaSection}>
            <View style={styles.categoriaHeader}>
                <Text style={styles.categoriaTitle}>
                    {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                </Text>
                <Text style={styles.categoriaCount}>
                    {items.length} productos
                </Text>
            </View>

            <FlatList
                data={items}
                renderItem={renderCocktailItem}
                keyExtractor={item => item.id.toString()}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />

            <View style={styles.categoriaSummary}>
                <Text style={styles.summaryText}>
                    Precio promedio: ${Math.round(items.reduce((sum, c) => sum + (c.precio || 0), 0) / items.length).toLocaleString()}
                </Text>
                <TouchableOpacity
                    style={styles.bulkEditButton}
                    onPress={() => {
                        Alert.prompt(
                            `Editar ${categoria}`,
                            `Nuevo precio para todos los ${items.length} cócteles de ${categoria}:`,
                            async (precio) => {
                                if (precio && !isNaN(parseFloat(precio)) && parseFloat(precio) > 0) {
                                    try {
                                        setLoading(true);
                                        for (const cocktail of items) {
                                            await SimpleDatabase.updateCocktail(cocktail.id, {
                                                precio: parseFloat(precio)
                                            });
                                        }
                                        await cargarCocktails();
                                        Alert.alert('✅ Éxito', `${items.length} cócteles actualizados`);
                                    } catch (error) {
                                        Alert.alert('❌ Error', 'No se pudieron actualizar');
                                    } finally {
                                        setLoading(false);
                                    }
                                }
                            },
                            'plain-text',
                            '',
                            'numeric'
                        );
                    }}
                >
                    <Text style={styles.bulkEditText}>Editar Todos</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading && cocktails.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#003b77" />
                <Text style={styles.loadingText}>Cargando cócteles...</Text>
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
                    <Text style={styles.backButtonText}>← Volver</Text>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Administrar Precios</Text>

                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.finanzasButton}
                        onPress={() => navigation.navigate('CajaVentas')}
                    >
                        <Text style={styles.finanzasButtonText}>💰</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.reloadButton}
                        onPress={cargarCocktails}
                    >
                        <Text style={styles.reloadButtonText}>🔄</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Búsqueda */}
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar cóctel o categoría..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#999"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Text style={styles.clearSearch}>✕</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Ajustes Masivos */}
                    <View style={styles.massActions}>
                        <Text style={styles.sectionTitle}>Ajustes Masivos</Text>

                        {/* Ajuste porcentual */}
                        <View style={styles.actionCard}>
                            <Text style={styles.actionTitle}>Ajuste Porcentual</Text>
                            <Text style={styles.actionDescription}>
                                Aumentar o disminuir todos los precios en un porcentaje
                            </Text>
                            <View style={styles.actionInputRow}>
                                <TextInput
                                    style={styles.percentInput}
                                    placeholder="Ej: 10 para +10%"
                                    value={ajustePorcentaje}
                                    onChangeText={setAjustePorcentaje}
                                    keyboardType="numeric"
                                    placeholderTextColor="#999"
                                />
                                <Text style={styles.percentSymbol}>%</Text>
                                <TouchableOpacity
                                    style={[
                                        styles.actionButton,
                                        (!ajustePorcentaje || isNaN(parseFloat(ajustePorcentaje))) && styles.disabledButton
                                    ]}
                                    onPress={aplicarAjustePorcentaje}
                                    disabled={!ajustePorcentaje || isNaN(parseFloat(ajustePorcentaje))}
                                >
                                    <Text style={styles.actionButtonText}>Aplicar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Precio fijo masivo */}
                        <View style={styles.actionCard}>
                            <Text style={styles.actionTitle}>Precio Fijo</Text>
                            <Text style={styles.actionDescription}>
                                Establecer el mismo precio para todos los cócteles
                            </Text>

                            {!editandoMasivamente ? (
                                <TouchableOpacity
                                    style={styles.enableMassEditButton}
                                    onPress={() => setEditandoMasivamente(true)}
                                >
                                    <Text style={styles.enableMassEditText}>Activar Edición Masiva</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.massEditContainer}>
                                    <TextInput
                                        style={styles.massPriceInput}
                                        placeholder="Precio para todos"
                                        value={precioMasivo}
                                        onChangeText={setPrecioMasivo}
                                        keyboardType="numeric"
                                        placeholderTextColor="#999"
                                        autoFocus={true}
                                    />
                                    <View style={styles.massEditButtons}>
                                        <TouchableOpacity
                                            style={[styles.massEditButton, styles.cancelMassButton]}
                                            onPress={() => {
                                                setEditandoMasivamente(false);
                                                setPrecioMasivo('');
                                            }}
                                        >
                                            <Text style={styles.cancelMassText}>Cancelar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.massEditButton,
                                                styles.applyMassButton,
                                                (!precioMasivo || isNaN(parseFloat(precioMasivo))) && styles.disabledButton
                                            ]}
                                            onPress={aplicarPrecioMasivo}
                                            disabled={!precioMasivo || isNaN(parseFloat(precioMasivo))}
                                        >
                                            <Text style={styles.applyMassText}>Aplicar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Lista de cócteles */}
                    <View style={styles.cocktailsList}>
                        <View style={styles.listHeader}>
                            <Text style={styles.sectionTitle}>
                                Cócteles ({filteredCocktails.length})
                            </Text>
                            <Text style={styles.totalValue}>
                                Valor total: ${filteredCocktails.reduce((sum, c) => sum + (c.precio || 0), 0).toLocaleString()}
                            </Text>
                        </View>

                        {Object.keys(cocktailsPorCategoria).length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>
                                    {searchQuery ? 'No se encontraron cócteles' : 'No hay cócteles'}
                                </Text>
                            </View>
                        ) : (
                            Object.entries(cocktailsPorCategoria).map(([categoria, items]) =>
                                renderCategoriaSection(categoria, items)
                            )
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modal de edición individual */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {cocktailEditando?.nombre}
                        </Text>

                        <Text style={styles.modalCategory}>
                            {cocktailEditando?.categoria}
                        </Text>

                        <View style={styles.priceDisplay}>
                            <Text style={styles.oldPrice}>
                                Precio actual: ${cocktailEditando?.precio?.toLocaleString()}
                            </Text>
                        </View>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Nuevo precio"
                            value={nuevoPrecio}
                            onChangeText={setNuevoPrecio}
                            keyboardType="numeric"
                            autoFocus={true}
                            placeholderTextColor="#999"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalCancel]}
                                onPress={() => {
                                    setModalVisible(false);
                                    setCocktailEditando(null);
                                    setNuevoPrecio('');
                                }}
                            >
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalSave]}
                                onPress={actualizarPrecio}
                            >
                                <Text style={styles.modalSaveText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#333',
    },
    clearSearch: {
        fontSize: 18,
        color: '#ff4444',
        marginLeft: 8,
    },
    massActions: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    actionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#003b77',
        marginBottom: 4,
    },
    actionDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    actionInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    percentInput: {
        flex: 1,
        height: 45,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#f9f9f9',
    },
    percentSymbol: {
        fontSize: 16,
        color: '#333',
        marginHorizontal: 8,
    },
    actionButton: {
        backgroundColor: '#003b77',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginLeft: 8,
    },
    disabledButton: {
        backgroundColor: '#ccc',
        opacity: 0.7,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    enableMassEditButton: {
        backgroundColor: '#28a745',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    enableMassEditText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    massEditContainer: {
        marginTop: 8,
    },
    massPriceInput: {
        height: 45,
        borderWidth: 2,
        borderColor: '#28a745',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#f9f9f9',
        marginBottom: 12,
    },
    massEditButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    massEditButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    cancelMassButton: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    applyMassButton: {
        backgroundColor: '#28a745',
    },
    cancelMassText: {
        color: '#666',
        fontWeight: 'bold',
    },
    applyMassText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    cocktailsList: {
        paddingHorizontal: 16,
        paddingBottom: 30,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    totalValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#28a745',
    },
    categoriaSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    categoriaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    categoriaTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#003b77',
    },
    categoriaCount: {
        fontSize: 14,
        color: '#666',
        backgroundColor: '#e9ecef',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    cocktailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    cocktailInfo: {
        flex: 1,
    },
    cocktailName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    cocktailCategory: {
        fontSize: 14,
        color: '#666',
    },
    priceSection: {
        alignItems: 'flex-end',
        marginRight: 12,
    },
    currentPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#28a745',
    },
    editHint: {
        fontSize: 10,
        color: '#999',
        marginTop: 2,
    },
    editIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#003b77',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIconText: {
        fontSize: 16,
        color: '#fff',
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 16,
    },
    categoriaSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f8f9fa',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    summaryText: {
        fontSize: 14,
        color: '#666',
    },
    bulkEditButton: {
        backgroundColor: '#003b77',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 15,
    },
    bulkEditText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
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
        marginBottom: 4,
        textAlign: 'center',
    },
    modalCategory: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    priceDisplay: {
        alignItems: 'center',
        marginBottom: 20,
    },
    oldPrice: {
        fontSize: 18,
        color: '#666',
    },
    modalInput: {
        backgroundColor: '#f9f9f9',
        borderWidth: 2,
        borderColor: '#003b77',
        borderRadius: 10,
        padding: 15,
        fontSize: 18,
        textAlign: 'center',
        color: '#333',
        marginBottom: 24,
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
    modalSave: {
        backgroundColor: '#003b77',
    },
    modalCancelText: {
        color: '#666',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalSaveText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    finanzasButton: {
        backgroundColor: '#4CAF50',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    finanzasButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default PreciosScreen;