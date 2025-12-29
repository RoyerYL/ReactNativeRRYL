// simpleDatabase.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class SimpleDatabase {
    constructor() {
        // Datos por defecto
        this.defaultData = {
            cocktails: [],
            promociones: [],
            ventas: [],
            caja: [],
            config: {
                precio_base: 3500,
                caja_abierta: false,
                monto_caja: 0
            }
        };
        this.data = { ...this.defaultData };
    }

    async init() {
        try {
            console.log('Inicializando base de datos simple...');

            // Intentar cargar datos existentes
            const stored = await AsyncStorage.getItem('barData');

            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    this.data = {
                        ...this.defaultData,
                        ...parsed,
                        // Asegurar que todas las propiedades existan
                        cocktails: Array.isArray(parsed.cocktails) ? parsed.cocktails : [],
                        promociones: Array.isArray(parsed.promociones) ? parsed.promociones : [],
                        ventas: Array.isArray(parsed.ventas) ? parsed.ventas : [],
                        caja: Array.isArray(parsed.caja) ? parsed.caja : [],
                        config: {
                            ...this.defaultData.config,
                            ...(parsed.config || {})
                        }
                    };
                    console.log('Datos cargados de AsyncStorage');
                } catch (parseError) {
                    console.error('Error parseando datos almacenados:', parseError);
                    await this.loadDatosEjemplo();
                }
            } else {
                console.log('No hay datos almacenados, cargando ejemplo...');
                await this.loadDatosEjemplo();
            }

            console.log('Base de datos inicializada correctamente');
            console.log('Cócteles cargados:', this.data.cocktails.length);
            console.log('Promociones cargadas:', this.data.promociones.length);

            return true;
        } catch (error) {
            console.error('Error crítico en init:', error);
            // En caso de error, usar datos de ejemplo en memoria
            await this.loadDatosEjemplo();
            return true;
        }
    }
    // En simpleDatabase.js, agrega esta función (si no existe):
    async registrarVenta(venta) {
        try {
            const ventaId = this.data.ventas.length > 0
                ? Math.max(...this.data.ventas.map(v => v.id)) + 1
                : 1;

            const nuevaVenta = {
                id: ventaId,
                fecha: venta.fecha || new Date().toISOString(),
                numero_ticket: `TKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                total_normal: venta.total_normal || 0,
                total_con_descuento: venta.total_con_descuento || venta.total_normal || 0,
                descuento_total: venta.descuento_total || 0,
                metodo_pago: venta.metodo_pago || 'efectivo',
                tipo_consumo: venta.tipo_consumo || 'local',
                cliente: venta.cliente || '',
                mesa: venta.mesa || '',
                observaciones: venta.observaciones || '',
                detalles: venta.detalles || [],
                promociones_aplicadas: venta.promociones_aplicadas || []
            };

            this.data.ventas.push(nuevaVenta);

            // Actualizar estadísticas si es necesario
            // Por ejemplo, podrías actualizar la caja aquí
            if (venta.metodo_pago === 'efectivo') {
                this.data.config.monto_caja = (this.data.config.monto_caja || 0) + (venta.total_con_descuento || 0);
            }

            await this.save();
            return ventaId;

        } catch (error) {
            console.error('Error registrando venta:', error);
            throw error;
        }
    }
    async loadDatosEjemplo() {
        try {
            console.log('Cargando datos de ejemplo...');

            this.data.cocktails = [
                {
                    id: 1,
                    nombre: 'Daiquiri Frutilla',
                    precio1: 3500,
                    precio2: 3000,
                    categoria: 'daiquiri',
                    descripcion: 'Daiquiri de frutilla fresca',
                    tiempo_preparacion: 5,
                    popularidad: 0,
                    activo: true,
                    creado: new Date().toISOString()
                },
                {
                    id: 2,
                    nombre: 'Daiquiri Durazno',
                    precio1: 3500,
                    precio2: 3000,
                    categoria: 'daiquiri',
                    descripcion: 'Daiquiri de durazno natural',
                    tiempo_preparacion: 5,
                    popularidad: 0,
                    activo: true,
                    creado: new Date().toISOString()
                },
                {
                    id: 3,
                    nombre: 'Pasion Roja',
                    precio1: 3500,
                    precio2: 3000,
                    categoria: 'tropical',
                    descripcion: 'Mezcla de frutos rojos y cítricos',
                    tiempo_preparacion: 6,
                    popularidad: 0,
                    activo: true,
                    creado: new Date().toISOString()
                },
                {
                    id: 4,
                    nombre: 'Gancia',
                    precio1: 3500,
                    precio2: 3000,
                    categoria: 'aperitivo',
                    descripcion: 'Gancia con soda y naranja',
                    tiempo_preparacion: 4,
                    popularidad: 0,
                    activo: true,
                    creado: new Date().toISOString()
                },
                {
                    id: 5,
                    nombre: 'Fernet',
                    precio1: 3500,
                    precio2: 3000,
                    categoria: 'clasico',
                    descripcion: 'Fernet con cola',
                    tiempo_preparacion: 3,
                    popularidad: 0,
                    activo: true,
                    creado: new Date().toISOString()
                },
                {
                    id: 6,
                    nombre: 'Piña Colada',
                    precio1: 3500,
                    precio2: 3000,
                    categoria: 'tropical',
                    descripcion: 'Ron, crema de coco y piña',
                    tiempo_preparacion: 7,
                    popularidad: 0,
                    activo: true,
                    creado: new Date().toISOString()
                },
                {
                    id: 7,
                    nombre: 'Pantera Rosa',
                    precio1: 3500,
                    precio2: 3000,
                    categoria: 'cremoso',
                    descripcion: 'Cóctel cremoso y dulce',
                    tiempo_preparacion: 6,
                    popularidad: 0,
                    activo: true,
                    creado: new Date().toISOString()
                },
                {
                    id: 8,
                    nombre: 'Caipirinha',
                    precio1: 3500,
                    precio2: 3000,
                    categoria: 'brasileño',
                    descripcion: 'Cachaça, lima y azúcar',
                    tiempo_preparacion: 5,
                    popularidad: 0,
                    activo: true,
                    creado: new Date().toISOString()
                },
                {
                    id: 9,
                    nombre: 'Menta Fuerte',
                    precio1: 3500,
                    precio2: 3000,
                    categoria: 'mentolado',
                    descripcion: 'Refrescante con hierbabuena',
                    tiempo_preparacion: 5,
                    popularidad: 0,
                    activo: true,
                    creado: new Date().toISOString()
                },
                {
                    id: 10,
                    nombre: 'Tequila Sunrise',
                    precio1: 3500,
                    precio2: 3000,
                    categoria: 'tropical',
                    descripcion: 'Degradado de colores como el amanecer',
                    tiempo_preparacion: 6,
                    popularidad: 0,
                    activo: true,
                    creado: new Date().toISOString()
                },
                {
                    id: 11,
                    nombre: 'Pitufo Azul',
                    precio1: 3500,
                    precio2: 3000,
                    categoria: 'cremoso',
                    descripcion: 'Cóctel azul y cremoso',
                    tiempo_preparacion: 6,
                    popularidad: 0,
                    activo: true,
                    creado: new Date().toISOString()
                },
                {
                    id: 12,
                    nombre: 'Cuba Libre',
                    precio1: 3500,
                    precio2: 3000,
                    categoria: 'clasico',
                    descripcion: 'Ron y refresco de cola',
                    tiempo_preparacion: 3,
                    popularidad: 0,
                    activo: true,
                    creado: new Date().toISOString()
                },
                {
                    id: 13,
                    nombre: 'Destornillador',
                    precio1: 3500,
                    precio2: 3000,
                    categoria: 'citrico',
                    descripcion: 'Vodka y jugo de naranja',
                    tiempo_preparacion: 4,
                    popularidad: 0,
                    activo: true,
                    creado: new Date().toISOString()
                },
                {
                    id: 14,
                    nombre: 'Laguna Azul',
                    precio1: 3500,
                    precio2: 3000,
                    categoria: 'tropical',
                    descripcion: 'Cóctel azul refrescante',
                    tiempo_preparacion: 6,
                    popularidad: 0,
                    activo: true,
                    creado: new Date().toISOString()
                }
            ];
            // Ventas de ejemplo
            this.data.ventas = [
                {
                    id: 1,
                    fecha: new Date().toISOString(),
                    ticket: 'TKT-001',
                    total: 0,
                    metodo_pago: 'efectivo',
                    estado: 'completada',
                    cliente: 'Cliente 1',
                    detalles: [
                        { producto: 'Daiquiri Frutilla', cantidad: 2, precio: 3500, subtotal: 7000 },
                        { producto: 'Cuba Libre', cantidad: 1, precio: 3200, subtotal: 3200 },
                    ],
                    descuento_total: 0
                },
                // ... más ventas
            ];

            // Promociones de ejemplo
            this.data.promociones = [
                {
                    id: 1,
                    cocktailId: 12, // Cuba Libre
                    nombre: '🔥 2 por $3000 - Cuba Libre',
                    tipo: '2por_precio',
                    precio_promocional: 3500,
                    cantidad_requerida: 2,
                    fecha_inicio: new Date().toISOString(),
                    fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    activa: true,
                    creada: new Date().toISOString()
                },
                {
                    id: 2,
                    cocktailId: 1, // Daiquiri frutilla
                    nombre: '🎯 2x1 - Daiquiri frutilla',
                    tipo: '2x1',
                    cantidad_requerida: 2,
                    cantidad_pagada: 1,
                    fecha_inicio: new Date().toISOString(),
                    fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    activa: true,
                    creada: new Date().toISOString()
                }
            ];
            // Extracciones de ejemplo
            this.data.extractions = [
                {
                    id: 1,
                    fecha: new Date().toISOString(),
                    monto: 0,
                    motivo: 'Compra de insumos',
                    categoria: 'retiro',
                    observaciones: 'Compra de limones y azúcar',
                    usuario: 'Admin'
                },
                {
                    id: 2,
                    fecha: new Date(Date.now() - 86400000).toISOString(), // Ayer
                    monto: 0,
                    motivo: 'Pago de servicios',
                    categoria: 'gasto',
                    observaciones: 'Luz y agua',
                    usuario: 'Admin'
                }
            ];
            // Configuración inicial
            this.data.config = {
                precio_base: 3500,
                caja_abierta: false,
                monto_caja: 0,
                iva_porcentaje: 21,
                usar_precio2_por_defecto: false // ← Nueva configuración
            };

            await this.save();
            console.log('Datos de ejemplo cargados exitosamente');

        } catch (error) {
            console.error('Error cargando datos de ejemplo:', error);
            // Si hay error, al menos asegurar arrays vacíos
            this.data.cocktails = [];
            this.data.promociones = [];
        }
    }

    async save() {
        try {
            await AsyncStorage.setItem('barData', JSON.stringify(this.data));
            console.log('Datos guardados en AsyncStorage');
        } catch (error) {
            console.error('Error guardando datos:', error);
        }
    }

    // ===== MÉTODOS PARA CÓCTELES =====
    async getCocktails() {
        return this.data.cocktails.filter(c => c.activo !== false);
    }

    async getCocktailById(id) {
        return this.data.cocktails.find(c => c.id === id && c.activo !== false);
    }
    async getExtractions() {
        return this.data.extractions || [];
    }

    async addExtraction(extraction) {
        if (!this.data.extractions) {
            this.data.extractions = [];
        }

        this.data.extractions.unshift(extraction); // Agregar al inicio
        await this.save();
        return extraction.id;
    }

    async getVentas() {
        return this.data.ventas || [];
    }

    async getVentasByDate(fecha) {
        const ventas = this.data.ventas || [];
        return ventas.filter(venta =>
            venta.fecha && venta.fecha.startsWith(fecha)
        );
    }
    async addCocktail(cocktail) {
        const newId = this.data.cocktails.length > 0
            ? Math.max(...this.data.cocktails.map(c => c.id)) + 1
            : 1;

        const newCocktail = {
            id: newId,
            precio: cocktail.precio || this.data.config.precio_base,
            activo: true,
            popularidad: 0,
            creado: new Date().toISOString(),
            ...cocktail
        };

        this.data.cocktails.push(newCocktail);
        await this.save();
        return newId;
    }

    async updateCocktail(id, updates) {
        const index = this.data.cocktails.findIndex(c => c.id === id);
        if (index !== -1) {
            this.data.cocktails[index] = {
                ...this.data.cocktails[index],
                ...updates
            };
            await this.save();
            return true;
        }
        return false;
    }

    // ===== MÉTODOS PARA PROMOCIONES =====
    async getPromocionesActivas() {
        const ahora = new Date();
        return this.data.promociones.filter(p =>
            p.activa === true &&
            (!p.fecha_inicio || new Date(p.fecha_inicio) <= ahora) &&
            (!p.fecha_fin || new Date(p.fecha_fin) >= ahora)
        );
    }

    async getPromocionesForCocktail(cocktailId) {
        const activas = await this.getPromocionesActivas();
        return activas.filter(p =>
            p.cocktailId === cocktailId ||
            p.cocktailId === undefined ||
            p.cocktailId === null
        );
    }

    async addPromocion(promocion) {
        const newId = this.data.promociones.length > 0
            ? Math.max(...this.data.promociones.map(p => p.id)) + 1
            : 1;

        const nuevaPromo = {
            id: newId,
            activa: true,
            creada: new Date().toISOString(),
            ...promocion
        };

        this.data.promociones.push(nuevaPromo);
        await this.save();
        return newId;
    }

    async calcularPrecioConPromocion(cocktailId, cantidad, precioNormal) {
        try {
            const promociones = await this.getPromocionesForCocktail(cocktailId);

            let mejorPrecio = precioNormal * cantidad;
            let mejorPromocion = null;
            let descuentoAplicado = 0;

            for (const promo of promociones) {
                let precioConPromo = 0;

                switch (promo.tipo) {
                    case '2x1':
                        if (cantidad >= 2) {
                            const grupos = Math.floor(cantidad / 2);
                            const individuales = cantidad % 2;
                            precioConPromo = (grupos * precioNormal) + (individuales * precioNormal);
                        }
                        break;

                    case '2por_precio':
                        if (cantidad >= 2) {
                            const pares = Math.floor(cantidad / 2);
                            const individuales = cantidad % 2;
                            precioConPromo = (pares * promo.precio_promocional) + (individuales * precioNormal);
                        }
                        break;

                    case 'descuento_porcentaje':
                        if (promo.descuento_porcentaje) {
                            precioConPromo = (precioNormal * cantidad) * (1 - (promo.descuento_porcentaje / 100));
                        }
                        break;

                    case 'descuento_fijo':
                        if (promo.descuento_monto) {
                            precioConPromo = Math.max(0, (precioNormal * cantidad) - (promo.descuento_monto * cantidad));
                        }
                        break;
                }

                if (precioConPromo > 0 && precioConPromo < mejorPrecio) {
                    mejorPrecio = precioConPromo;
                    mejorPromocion = promo;
                    descuentoAplicado = (precioNormal * cantidad) - precioConPromo;
                }
            }

            return {
                precio_normal: precioNormal,
                cantidad: cantidad,
                precio_total_normal: precioNormal * cantidad,
                precio_con_promocion: mejorPrecio,
                promocion_aplicada: mejorPromocion,
                descuento_aplicado: descuentoAplicado,
                ahorro_porcentaje: mejorPromocion ?
                    ((descuentoAplicado / (precioNormal * cantidad)) * 100).toFixed(1) : 0
            };

        } catch (error) {
            console.error('Error calculando promoción:', error);
            return {
                precio_normal: precioNormal,
                cantidad: cantidad,
                precio_total_normal: precioNormal * cantidad,
                precio_con_promocion: precioNormal * cantidad,
                promocion_aplicada: null,
                descuento_aplicado: 0,
                ahorro_porcentaje: 0
            };
        }
    }

    // ===== MÉTODOS PARA CAJA =====
    async abrirCaja(montoInicial) {
        this.data.config.caja_abierta = true;
        this.data.config.monto_caja = montoInicial;
        this.data.config.caja_fecha_apertura = new Date().toISOString();

        // Registrar en historial de caja
        const registroCaja = {
            id: this.data.caja.length > 0 ? Math.max(...this.data.caja.map(c => c.id)) + 1 : 1,
            tipo: 'apertura',
            monto: montoInicial,
            fecha: new Date().toISOString(),
            descripcion: 'Apertura de caja'
        };

        this.data.caja.push(registroCaja);
        await this.save();
        return true;
    }

    async cerrarCaja(montoFinal, observaciones = '') {
        this.data.config.caja_abierta = false;
        this.data.config.caja_fecha_cierre = new Date().toISOString();

        // Registrar cierre
        const registroCierre = {
            id: this.data.caja.length > 0 ? Math.max(...this.data.caja.map(c => c.id)) + 1 : 1,
            tipo: 'cierre',
            monto: montoFinal,
            fecha: new Date().toISOString(),
            descripcion: observaciones || 'Cierre de caja'
        };

        this.data.caja.push(registroCierre);
        await this.save();
        return true;
    }

    async getEstadoCaja() {
        return {
            abierta: this.data.config.caja_abierta || false,
            monto: this.data.config.monto_caja || 0,
            fecha_apertura: this.data.config.caja_fecha_apertura
        };
    }

    // ===== MÉTODOS PARA VENTAS =====
    async registrarVenta(venta) {
        const ventaId = this.data.ventas.length > 0
            ? Math.max(...this.data.ventas.map(v => v.id)) + 1
            : 1;

        const nuevaVenta = {
            id: ventaId,
            fecha: new Date().toISOString(),
            numero_ticket: `TKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            total_normal: venta.total_normal || 0,
            total_con_descuento: venta.total_con_descuento || venta.total_normal || 0,
            descuento_total: venta.descuento_total || 0,
            metodo_pago: venta.metodo_pago || 'efectivo',
            detalles: venta.detalles || [],
            promociones_aplicadas: venta.promociones_aplicadas || []
        };

        this.data.ventas.push(nuevaVenta);

        // Actualizar popularidad de cócteles
        if (venta.detalles) {
            venta.detalles.forEach(detalle => {
                const cocktail = this.data.cocktails.find(c => c.id === detalle.cocktailId);
                if (cocktail) {
                    cocktail.popularidad = (cocktail.popularidad || 0) + detalle.cantidad;
                }
            });
        }

        await this.save();
        return ventaId;
    }

    // ===== MÉTODOS DE UTILIDAD =====
    async resetDatabase() {
        this.data = { ...this.defaultData };
        await AsyncStorage.removeItem('barData');
        await this.loadDatosEjemplo();
        return true;
    }

    // ===== MÉTODOS PARA VENTAS =====
    async getAllVentas() {
        return this.data.ventas || [];
    }

    async getVentasPorFecha(fechaInicio, fechaFin) {
        const ventas = this.data.ventas || [];
        return ventas.filter(venta => {
            const fechaVenta = new Date(venta.fecha);
            return fechaVenta >= fechaInicio && fechaVenta <= fechaFin;
        });
    }

    async getVentaPorId(id) {
        return (this.data.ventas || []).find(v => v.id === id);
    }

    // ===== MÉTODOS PARA CAJA Y EXTRACCIONES =====
    async registrarExtraccion(extraccion) {
        const newId = this.data.extracciones ?
            (this.data.extracciones.length > 0 ? Math.max(...this.data.extracciones.map(e => e.id)) + 1 : 1)
            : 1;

        const nuevaExtraccion = {
            id: newId,
            ...extraccion,
            tipo: 'extraccion',
            registrada: new Date().toISOString()
        };

        if (!this.data.extracciones) {
            this.data.extracciones = [];
        }

        this.data.extracciones.push(nuevaExtraccion);

        // Actualizar monto en caja
        this.data.config.monto_caja -= extraccion.monto;

        // Registrar también en historial de caja
        if (!this.data.caja) {
            this.data.caja = [];
        }

        this.data.caja.push({
            id: this.data.caja.length > 0 ? Math.max(...this.data.caja.map(c => c.id)) + 1 : 1,
            tipo: 'extraccion',
            monto: extraccion.monto,
            motivo: extraccion.motivo,
            fecha: new Date().toISOString(),
            descripcion: `Extracción: ${extraccion.motivo}`
        });

        await this.save();
        return newId;
    }

    async actualizarMontoCaja(nuevoMonto) {
        this.data.config.monto_caja = nuevoMonto;
        await this.save();
        return true;
    }

    async getHistorialCaja() {
        return this.data.caja || [];
    }

    async getExtracciones() {
        return this.data.extracciones || [];
    }

    // ===== MÉTODOS PARA ESTADÍSTICAS =====
    async getEstadisticasVentas() {
        const ventas = this.data.ventas || [];
        const hoy = new Date().toISOString().split('T')[0];

        const ventasHoy = ventas.filter(v => v.fecha && v.fecha.split('T')[0] === hoy);
        const ventasSemana = ventas.filter(v => {
            const fechaVenta = new Date(v.fecha);
            const semanaPasada = new Date();
            semanaPasada.setDate(semanaPasada.getDate() - 7);
            return fechaVenta >= semanaPasada;
        });

        return {
            total_ventas: ventas.length,
            ventas_hoy: ventasHoy.length,
            monto_hoy: ventasHoy.reduce((sum, v) => sum + (v.total_con_descuento || v.total_normal || 0), 0),
            ventas_semana: ventasSemana.length,
            monto_semana: ventasSemana.reduce((sum, v) => sum + (v.total_con_descuento || v.total_normal || 0), 0),
            promedio_ticket: ventas.length > 0 ?
                ventas.reduce((sum, v) => sum + (v.total_con_descuento || v.total_normal || 0), 0) / ventas.length
                : 0,
            metodo_pago: {
                efectivo: ventas.filter(v => v.metodo_pago === 'efectivo').length,
                tarjeta: ventas.filter(v => v.metodo_pago === 'tarjeta').length,
                transferencia: ventas.filter(v => v.metodo_pago === 'transferencia').length,
            }
        };
    }
    // MÉTODO FALTANTE 1: getAllVentas
    async getAllVentas() {
        return this.data.ventas || [];
    }

    // MÉTODO FALTANTE 2: getVentasPorFecha (para filtros)
    async getVentasPorFecha(inicio, fin) {
        const ventas = this.data.ventas || [];
        const fechaInicio = new Date(inicio);
        const fechaFin = new Date(fin);

        return ventas.filter(venta => {
            const fechaVenta = new Date(venta.fecha);
            return fechaVenta >= fechaInicio && fechaVenta <= fechaFin;
        });
    }

    // MÉTODO FALTANTE 3: getEstadisticas (simplificado)
    async getEstadisticas() {
        const ventas = this.data.ventas || [];
        const hoy = new Date().toISOString().split('T')[0];
        const ventasHoy = ventas.filter(v => v.fecha && v.fecha.split('T')[0] === hoy);

        return {
            total_cocktails: this.data.cocktails ? this.data.cocktails.length : 0,
            ventas_hoy: ventasHoy.length,
            monto_hoy: ventasHoy.reduce((sum, v) => sum + (v.total_con_descuento || v.total_normal || 0), 0),
            caja_abierta: this.data.config ? this.data.config.caja_abierta || false : false,
            promociones_activas: await this.getPromocionesActivas() ? (await this.getPromocionesActivas()).length : 0
        };
    }

    // MÉTODO FALTANTE 4: registrarExtraccion
    async registrarExtraccion(extraccion) {
        if (!this.data.extracciones) {
            this.data.extracciones = [];
        }

        const newId = this.data.extracciones.length > 0
            ? Math.max(...this.data.extracciones.map(e => e.id)) + 1
            : 1;

        const nuevaExtraccion = {
            id: newId,
            ...extraccion,
            fecha: new Date().toISOString()
        };

        this.data.extracciones.push(nuevaExtraccion);

        // Actualizar monto en caja
        if (this.data.config) {
            this.data.config.monto_caja = (this.data.config.monto_caja || 0) - (extraccion.monto || 0);
        }

        await this.save();
        return newId;
    }

    // MÉTODO FALTANTE 5: actualizarMontoCaja
    async actualizarMontoCaja(nuevoMonto) {
        if (!this.data.config) {
            this.data.config = {};
        }
        this.data.config.monto_caja = nuevoMonto;
        await this.save();
        return true;
    }
    // MÉTODO FALTANTE 6: Si quieres mantener historial de caja
    async getHistorialCaja() {
        if (!this.data.cajaHistorial) {
            this.data.cajaHistorial = [];
        }
        return this.data.cajaHistorial;
    }
    // ===== MÉTODO PARA REGISTRAR VENTA COMPLETA =====
    async registrarVentaCompleta(venta) {
        const ventaId = this.data.ventas.length > 0
            ? Math.max(...this.data.ventas.map(v => v.id)) + 1
            : 1;

        const nuevaVenta = {
            id: ventaId,
            fecha: new Date().toISOString(),
            numero_ticket: `TKT-${Date.now()}-${ventaId.toString().padStart(4, '0')}`,
            total_normal: venta.total_normal || 0,
            total_con_descuento: venta.total_con_descuento || venta.total_normal || 0,
            descuento_total: venta.descuento_total || 0,
            metodo_pago: venta.metodo_pago || 'efectivo',
            cliente: venta.cliente || '',
            detalles: venta.detalles || [],
            promociones_aplicadas: venta.promociones_aplicadas || [],
            estado: 'completada'
        };

        this.data.ventas.push(nuevaVenta);

        // Si la caja está abierta, sumar al monto
        if (this.data.config.caja_abierta && nuevaVenta.metodo_pago === 'efectivo') {
            this.data.config.monto_caja += nuevaVenta.total_con_descuento;
        }

        // Actualizar popularidad de cócteles
        if (venta.detalles) {
            venta.detalles.forEach(detalle => {
                const cocktail = this.data.cocktails.find(c => c.id === detalle.cocktailId);
                if (cocktail) {
                    cocktail.popularidad = (cocktail.popularidad || 0) + detalle.cantidad;
                }
            });
        }

        return {
            total_cocktails: this.data.cocktails.length,
            ventas_hoy: ventasHoy.length,
            monto_hoy: ventasHoy.reduce((sum, v) => sum + (v.total_con_descuento || 0), 0),
            caja_abierta: this.data.config.caja_abierta || false,
            promociones_activas: (await this.getPromocionesActivas()).length
        };
    }
}

export default new SimpleDatabase();