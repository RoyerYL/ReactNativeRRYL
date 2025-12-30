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
import SimpleOperations from './simpleOperations';

const PreciosScreen = () => {
    const navigation = useNavigation();
    const [cocktails, setCocktails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [cocktailEditando, setCocktailEditando] = useState(null);
    const [nuevoPrecio1, setNuevoPrecio1] = useState('');
    const [nuevoPrecio2, setNuevoPrecio2] = useState('');
    const [ajustePorcentaje, setAjustePorcentaje] = useState('');
    const [editandoMasivamente, setEditandoMasivamente] = useState(false);
    const [precioMasivo1, setPrecioMasivo1] = useState('');
    const [precioMasivo2, setPrecioMasivo2] = useState('');
    const [tipoPrecioMasivo, setTipoPrecioMasivo] = useState('ambos');

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
        setNuevoPrecio1(cocktail.precio1?.toString() || '');
        setNuevoPrecio2(cocktail.precio2?.toString() || '');
        setModalVisible(true);
    };

    const actualizarPrecios = async () => {
        if ((!nuevoPrecio1 || isNaN(parseFloat(nuevoPrecio1)) || parseFloat(nuevoPrecio1) <= 0) &&
            (!nuevoPrecio2 || isNaN(parseFloat(nuevoPrecio2)) || parseFloat(nuevoPrecio2) <= 0)) {
            Alert.alert('Error', 'Ingrese al menos un precio válido');
            return;
        }

        try {
            const updates = {};
            let cambios = [];

            // Actualizar precio1 si es válido y cambió
            if (nuevoPrecio1 && !isNaN(parseFloat(nuevoPrecio1)) && parseFloat(nuevoPrecio1) > 0) {
                const precioNum = parseFloat(nuevoPrecio1);
                if (precioNum !== cocktailEditando.precio1) {
                    updates.precio1 = precioNum;
                    cambios.push(`Precio 1: $${precioNum.toLocaleString()}`);
                }
            }

            // Actualizar precio2 si es válido y cambió
            if (nuevoPrecio2 && !isNaN(parseFloat(nuevoPrecio2)) && parseFloat(nuevoPrecio2) > 0) {
                const precioNum = parseFloat(nuevoPrecio2);
                if (precioNum !== cocktailEditando.precio2) {
                    updates.precio2 = precioNum;
                    cambios.push(`Precio 2: $${precioNum.toLocaleString()}`);
                }
            }

            // Si hay cambios, actualizar
            if (Object.keys(updates).length > 0) {
                const success = await SimpleOperations.actualizarPreciosCocktail(
                    cocktailEditando.id,
                    updates
                );

                if (success) {
                    // Actualizar estado local
                    setCocktails(prev =>
                        prev.map(c =>
                            c.id === cocktailEditando.id
                                ? { ...c, ...updates }
                                : c
                        )
                    );

                    Alert.alert('✅ Éxito', `"${cocktailEditando.nombre}" actualizado:\n${cambios.join('\n')}`);
                    setModalVisible(false);
                    setCocktailEditando(null);
                    setNuevoPrecio1('');
                    setNuevoPrecio2('');
                } else {
                    Alert.alert('❌ Error', 'No se pudieron actualizar los precios');
                }
            } else {
                Alert.alert('Info', 'No hay cambios para guardar');
            }
        } catch (error) {
            console.error('Error actualizando precios:', error);
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
                    text: 'Solo Precio 1',
                    onPress: () => aplicarAjustePorcentajeConTipo('precio1', porcentaje)
                },
                {
                    text: 'Solo Precio 2',
                    onPress: () => aplicarAjustePorcentajeConTipo('precio2', porcentaje)
                },
                {
                    text: 'Ambos Precios',
                    style: 'destructive',
                    onPress: () => aplicarAjustePorcentajeConTipo('ambos', porcentaje)
                }
            ]
        );
    };

    const aplicarAjustePorcentajeConTipo = async (tipo, porcentaje) => {
        try {
            setLoading(true);
            const factor = 1 + (porcentaje / 100);
            let actualizados = 0;

            for (const cocktail of cocktails) {
                const updates = {};
                let tieneCambios = false;

                if (tipo === 'precio1' || tipo === 'ambos') {
                    const nuevoPrecio1 = Math.round(cocktail.precio1 * factor);
                    if (nuevoPrecio1 !== cocktail.precio1) {
                        updates.precio1 = nuevoPrecio1;
                        tieneCambios = true;
                    }
                }

                if (tipo === 'precio2' || tipo === 'ambos') {
                    // Si no tiene precio2, usar precio1 como base
                    const precioBase = cocktail.precio2 || cocktail.precio1;
                    const nuevoPrecio2 = Math.round(precioBase * factor);
                    if (nuevoPrecio2 !== cocktail.precio2) {
                        updates.precio2 = nuevoPrecio2;
                        tieneCambios = true;
                    }
                }

                if (tieneCambios) {
                    await SimpleOperations.actualizarPreciosCocktail(cocktail.id, updates);
                    actualizados++;
                }
            }

            // Recargar datos
            await cargarCocktails();

            Alert.alert(
                '✅ Éxito',
                `Se actualizaron ${actualizados} cócteles.\n${porcentaje > 0 ? 'Aumento' : 'Disminución'} del ${Math.abs(porcentaje)}% aplicado al ${tipo === 'ambos' ? 'precio 1 y 2' : tipo === 'precio1' ? 'precio 1' : 'precio 2'}.`
            );
            setAjustePorcentaje('');
        } catch (error) {
            console.error('Error en ajuste masivo:', error);
            Alert.alert('❌ Error', 'No se pudieron actualizar todos los precios');
        } finally {
            setLoading(false);
        }
    };

    const aplicarPrecioMasivo = () => {
        let precio1 = null;
        let precio2 = null;

        if (tipoPrecioMasivo === 'precio1' || tipoPrecioMasivo === 'ambos') {
            if (!precioMasivo1 || isNaN(parseFloat(precioMasivo1)) || parseFloat(precioMasivo1) <= 0) {
                Alert.alert('Error', 'Ingrese un precio 1 válido');
                return;
            }
            precio1 = parseFloat(precioMasivo1);
        }

        if (tipoPrecioMasivo === 'precio2' || tipoPrecioMasivo === 'ambos') {
            if (!precioMasivo2 || isNaN(parseFloat(precioMasivo2)) || parseFloat(precioMasivo2) <= 0) {
                Alert.alert('Error', 'Ingrese un precio 2 válido');
                return;
            }
            precio2 = parseFloat(precioMasivo2);
        }

        Alert.alert(
            '⚠️ Precio Masivo',
            `¿Aplicar precios a TODOS los cócteles?\n\n${tipoPrecioMasivo === 'ambos' ? `Precio 1: $${precio1.toLocaleString()}\nPrecio 2: $${precio2.toLocaleString()}` : tipoPrecioMasivo === 'precio1' ? `Precio 1: $${precio1.toLocaleString()}` : `Precio 2: $${precio2.toLocaleString()}`}\n\nEsta acción afectará a ${cocktails.length} productos.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Aplicar a Todos',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            let actualizados = 0;

                            for (const cocktail of cocktails) {
                                const updates = {};

                                if (precio1 !== null) {
                                    updates.precio1 = precio1;
                                }

                                if (precio2 !== null) {
                                    updates.precio2 = precio2;
                                }

                                await SimpleOperations.actualizarPreciosCocktail(cocktail.id, updates);
                                actualizados++;
                            }

                            await cargarCocktails();
                            Alert.alert('✅ Éxito', `${actualizados} cócteles actualizados`);
                            setPrecioMasivo1('');
                            setPrecioMasivo2('');
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
                    onPress: () => mostrarOpcionesCategorias(precio1, precio2)
                }
            ]
        );
    };

    const mostrarOpcionesCategorias = (precio1, precio2) => {
        const categorias = [...new Set(cocktails.map(c => c.categoria))];

        Alert.alert(
            'Aplicar por Categoría',
            `Seleccione la categoría:`,
            categorias.map(cat => ({
                text: cat.charAt(0).toUpperCase() + cat.slice(1),
                onPress: () => aplicarPrecioPorCategoria(cat, precio1, precio2)
            })).concat([{ text: 'Cancelar', style: 'cancel' }])
        );
    };

    const aplicarPrecioPorCategoria = async (categoria, precio1, precio2) => {
        try {
            setLoading(true);
            const cocktailsCategoria = cocktails.filter(c => c.categoria === categoria);
            let actualizados = 0;

            for (const cocktail of cocktailsCategoria) {
                const updates = {};

                if (precio1 !== null) {
                    updates.precio1 = precio1;
                }

                if (precio2 !== null) {
                    updates.precio2 = precio2;
                }

                await SimpleOperations.actualizarPreciosCocktail(cocktail.id, updates);
                actualizados++;
            }

            await cargarCocktails();
            Alert.alert('✅ Éxito', `${actualizados} cócteles de "${categoria}" actualizados`);
            setPrecioMasivo1('');
            setPrecioMasivo2('');
            setEditandoMasivamente(false);
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('❌ Error', 'No se pudieron actualizar los precios');
        } finally {
            setLoading(false);
        }
    };

    const copiarPrecio1aPrecio2 = async () => {
        Alert.alert(
            '⚠️ Copiar Precios',
            '¿Copiar precio 1 al precio 2 para TODOS los cócteles?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Copiar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const actualizados = await SimpleOperations.copiarPrecio1aPrecio2();
                            await cargarCocktails();
                            Alert.alert('✅ Éxito', `Precio 2 actualizado en ${actualizados} cócteles`);
                        } catch (error) {
                            console.error('Error copiando precios:', error);
                            Alert.alert('❌ Error', 'No se pudieron copiar los precios');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const aplicarPorcentajePrecio2 = async () => {
        Alert.prompt(
            '📊 Porcentaje Precio 2',
            'Ingrese el % para calcular Precio 2 en base al Precio 1:\n(Ej: 20 para +20%, -10 para -10%)',
            async (porcentaje) => {
                if (porcentaje && !isNaN(parseFloat(porcentaje))) {
                    try {
                        setLoading(true);
                        const resultado = await SimpleOperations.aplicarPorcentajePrecio2(parseFloat(porcentaje));
                        await cargarCocktails();
                        Alert.alert('✅ Éxito', resultado.mensaje);
                    } catch (error) {
                        console.error('Error aplicando porcentaje:', error);
                        Alert.alert('❌ Error', 'No se pudo aplicar el porcentaje');
                    } finally {
                        setLoading(false);
                    }
                }
            },
            'plain-text',
            '',
            'numeric'
        );
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

            <View style={styles.pricesSection}>
                {/* Precio 1 */}
                <View style={styles.priceDisplay}>
                    <Text style={styles.priceLabel}>P1:</Text>
                    <Text style={styles.priceValue}>
                        ${item.precio1?.toLocaleString() || '0'}
                    </Text>
                </View>

                {/* Precio 2 */}
                <View style={styles.priceDisplay}>
                    <Text style={styles.priceLabel}>P2:</Text>
                    <Text style={[
                        styles.priceValue,
                        !item.precio2 && styles.priceValueDisabled
                    ]}>
                        ${item.precio2?.toLocaleString() || item.precio1?.toLocaleString() || '0'}
                    </Text>
                </View>
            </View>

            <View style={styles.editIcon}>
                <Text style={styles.editIconText}>✏️</Text>
            </View>
        </TouchableOpacity>
    );

    const renderCategoriaSection = (categoria, items) => {
        const precioPromedio1 = Math.round(items.reduce((sum, c) => sum + (c.precio1 || 0), 0) / items.length);
        const precioPromedio2 = Math.round(items.reduce((sum, c) => sum + (c.precio2 || c.precio1 || 0), 0) / items.length);
        const diferenciaPromedio = precioPromedio2 - precioPromedio1;
        const porcentajeDiferencia = precioPromedio1 > 0 ? ((diferenciaPromedio / precioPromedio1) * 100).toFixed(1) : 0;

        return (
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
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Prom. P1:</Text>
                        <Text style={styles.summaryValue}>${precioPromedio1.toLocaleString()}</Text>
                        <Text style={styles.summaryLabel}>Prom. P2:</Text>
                        <Text style={styles.summaryValue}>${precioPromedio2.toLocaleString()}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Diferencia:</Text>
                        <Text style={[
                            styles.summaryValue,
                            diferenciaPromedio > 0 ? styles.diferenciaPositiva : 
                            diferenciaPromedio < 0 ? styles.diferenciaNegativa : styles.diferenciaNeutral
                        ]}>
                            {diferenciaPromedio > 0 ? '+' : ''}{diferenciaPromedio.toLocaleString()} ({porcentajeDiferencia}%)
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

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

                <Text style={styles.headerTitle}>Gestión de Precios</Text>

                <View style={styles.headerRight}>
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

                    {/* Acciones Rápidas */}
                    <View style={styles.quickActionsContainer}>
                        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
                        <View style={styles.quickActions}>
                            <TouchableOpacity
                                style={styles.quickActionButton}
                                onPress={copiarPrecio1aPrecio2}
                            >
                                <Text style={styles.quickActionText}>📋 Copiar P1→P2</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.quickActionButton}
                                onPress={aplicarPorcentajePrecio2}
                            >
                                <Text style={styles.quickActionText}>📊 % P2</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Ajustes Masivos */}
                    <View style={styles.massActions}>
                        <Text style={styles.sectionTitle}>Ajustes Masivos</Text>

                        {/* Ajuste porcentual */}
                        <View style={styles.actionCard}>
                            <Text style={styles.actionTitle}>Ajuste Porcentual</Text>
                            <Text style={styles.actionDescription}>
                                Aumentar o disminuir precios en un porcentaje
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
                            <Text style={styles.actionTitle}>Precio Fijo Masivo</Text>
                            <Text style={styles.actionDescription}>
                                Establecer precios fijos para todos los cócteles
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
                                    <View style={styles.tipoPrecioSelector}>
                                        <TouchableOpacity
                                            style={[
                                                styles.tipoPrecioButton,
                                                tipoPrecioMasivo === 'precio1' && styles.tipoPrecioButtonActive
                                            ]}
                                            onPress={() => setTipoPrecioMasivo('precio1')}
                                        >
                                            <Text style={[
                                                styles.tipoPrecioButtonText,
                                                tipoPrecioMasivo === 'precio1' && styles.tipoPrecioButtonTextActive
                                            ]}>
                                                Solo P1
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.tipoPrecioButton,
                                                tipoPrecioMasivo === 'precio2' && styles.tipoPrecioButtonActive
                                            ]}
                                            onPress={() => setTipoPrecioMasivo('precio2')}
                                        >
                                            <Text style={[
                                                styles.tipoPrecioButtonText,
                                                tipoPrecioMasivo === 'precio2' && styles.tipoPrecioButtonTextActive
                                            ]}>
                                                Solo P2
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.tipoPrecioButton,
                                                tipoPrecioMasivo === 'ambos' && styles.tipoPrecioButtonActive
                                            ]}
                                            onPress={() => setTipoPrecioMasivo('ambos')}
                                        >
                                            <Text style={[
                                                styles.tipoPrecioButtonText,
                                                tipoPrecioMasivo === 'ambos' && styles.tipoPrecioButtonTextActive
                                            ]}>
                                                Ambos
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {(tipoPrecioMasivo === 'precio1' || tipoPrecioMasivo === 'ambos') && (
                                        <TextInput
                                            style={styles.massPriceInput}
                                            placeholder="Precio 1 para todos"
                                            value={precioMasivo1}
                                            onChangeText={setPrecioMasivo1}
                                            keyboardType="numeric"
                                            placeholderTextColor="#999"
                                        />
                                    )}

                                    {(tipoPrecioMasivo === 'precio2' || tipoPrecioMasivo === 'ambos') && (
                                        <TextInput
                                            style={styles.massPriceInput}
                                            placeholder="Precio 2 para todos"
                                            value={precioMasivo2}
                                            onChangeText={setPrecioMasivo2}
                                            keyboardType="numeric"
                                            placeholderTextColor="#999"
                                        />
                                    )}

                                    <View style={styles.massEditButtons}>
                                        <TouchableOpacity
                                            style={[styles.massEditButton, styles.cancelMassButton]}
                                            onPress={() => {
                                                setEditandoMasivamente(false);
                                                setPrecioMasivo1('');
                                                setPrecioMasivo2('');
                                            }}
                                        >
                                            <Text style={styles.cancelMassText}>Cancelar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.massEditButton,
                                                styles.applyMassButton,
                                                ((tipoPrecioMasivo === 'precio1' && (!precioMasivo1 || isNaN(parseFloat(precioMasivo1)))) ||
                                                (tipoPrecioMasivo === 'precio2' && (!precioMasivo2 || isNaN(parseFloat(precioMasivo2)))) ||
                                                (tipoPrecioMasivo === 'ambos' && (!precioMasivo1 || !precioMasivo2 || isNaN(parseFloat(precioMasivo1)) || isNaN(parseFloat(precioMasivo2))))) &&
                                                styles.disabledButton
                                            ]}
                                            onPress={aplicarPrecioMasivo}
                                            disabled={
                                                (tipoPrecioMasivo === 'precio1' && (!precioMasivo1 || isNaN(parseFloat(precioMasivo1)))) ||
                                                (tipoPrecioMasivo === 'precio2' && (!precioMasivo2 || isNaN(parseFloat(precioMasivo2)))) ||
                                                (tipoPrecioMasivo === 'ambos' && (!precioMasivo1 || !precioMasivo2 || isNaN(parseFloat(precioMasivo1)) || isNaN(parseFloat(precioMasivo2))))
                                            }
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
                                Precio 2 definido: {cocktails.filter(c => c.precio2 !== null && c.precio2 !== undefined).length}/{cocktails.length}
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

            {/* Modal de edición */}
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

                        {/* Precio 1 */}
                        <View style={styles.priceInputGroup}>
                            <Text style={styles.priceInputLabel}>Precio 1</Text>
                            <Text style={styles.oldPrice}>
                                Actual: ${cocktailEditando?.precio1?.toLocaleString()}
                            </Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Nuevo precio 1"
                                value={nuevoPrecio1}
                                onChangeText={setNuevoPrecio1}
                                keyboardType="numeric"
                                autoFocus={true}
                                placeholderTextColor="#999"
                            />
                        </View>

                        {/* Precio 2 */}
                        <View style={styles.priceInputGroup}>
                            <Text style={styles.priceInputLabel}>Precio 2</Text>
                            <Text style={styles.oldPrice}>
                                Actual: ${cocktailEditando?.precio2?.toLocaleString() || cocktailEditando?.precio1?.toLocaleString() || 'No definido'}
                            </Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Nuevo precio 2"
                                value={nuevoPrecio2}
                                onChangeText={setNuevoPrecio2}
                                keyboardType="numeric"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalCancel]}
                                onPress={() => {
                                    setModalVisible(false);
                                    setCocktailEditando(null);
                                    setNuevoPrecio1('');
                                    setNuevoPrecio2('');
                                }}
                            >
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalSave]}
                                onPress={actualizarPrecios}
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
    quickActionsContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    quickActions: {
        flexDirection: 'row',
    },
    quickActionButton: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 4,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    quickActionText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#003b77',
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
    tipoPrecioSelector: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    tipoPrecioButton: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderRadius: 6,
        marginHorizontal: 2,
        alignItems: 'center',
    },
    tipoPrecioButtonActive: {
        backgroundColor: '#003b77',
    },
    tipoPrecioButtonText: {
        fontSize: 12,
        color: '#666',
        fontWeight: 'bold',
    },
    tipoPrecioButtonTextActive: {
        color: '#fff',
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
        fontSize: 14,
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
    pricesSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    priceDisplay: {
        marginHorizontal: 8,
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    priceValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#28a745',
    },
    priceValueDisabled: {
        color: '#999',
        fontStyle: 'italic',
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f8f9fa',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#666',
    },
    summaryValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    diferenciaPositiva: {
        color: '#28a745',
    },
    diferenciaNegativa: {
        color: '#dc3545',
    },
    diferenciaNeutral: {
        color: '#666',
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
    priceInputGroup: {
        marginBottom: 20,
    },
    priceInputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#003b77',
        marginBottom: 4,
    },
    oldPrice: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    modalInput: {
        backgroundColor: '#f9f9f9',
        borderWidth: 2,
        borderColor: '#003b77',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        color: '#333',
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
});

export default PreciosScreen;