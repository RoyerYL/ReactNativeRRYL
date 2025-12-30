import * as SQLite from 'expo-sqlite';

class SimpleDatabase {
    constructor() {
        this.db = null;
    }

    async init() {
        try {
            console.log('Inicializando base de datos SQLite...');
            
            // Abrir/Crear base de datos
            this.db = await SQLite.openDatabaseAsync('barDatabase.db');
            
            // Crear tablas
            await this.createTables();
            
            // Cargar datos de ejemplo si las tablas están vacías
            await this.verificarDatosIniciales();
            
            console.log('Base de datos SQLite inicializada correctamente');
            return true;
            
        } catch (error) {
            console.error('Error crítico en init:', error);
            throw error;
        }
    }

    async createTables() {
        try {
            // Tabla de configuración
            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS config (
                    key TEXT PRIMARY KEY,
                    value TEXT
                );
            `);

            // Tabla de cócteles
            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS cocktails (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre TEXT NOT NULL,
                    precio1 REAL DEFAULT 3500,
                    precio2 REAL DEFAULT 3500,
                    categoria TEXT,
                    descripcion TEXT,
                    tiempo_preparacion INTEGER DEFAULT 5,
                    popularidad INTEGER DEFAULT 0,
                    activo BOOLEAN DEFAULT 1,
                    activar_precio2 BOOLEAN DEFAULT 0,
                    creado TEXT DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Tabla de promociones
            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS promociones (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    cocktailId INTEGER,
                    nombre TEXT NOT NULL,
                    tipo TEXT NOT NULL,
                    precio_promocional REAL,
                    descuento_porcentaje REAL,
                    descuento_monto REAL,
                    cantidad_requerida INTEGER,
                    cantidad_pagada INTEGER,
                    fecha_inicio TEXT,
                    fecha_fin TEXT,
                    activa BOOLEAN DEFAULT 1,
                    creada TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (cocktailId) REFERENCES cocktails(id) ON DELETE CASCADE
                );
            `);

            // Tabla de ventas
            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS ventas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    fecha TEXT DEFAULT CURRENT_TIMESTAMP,
                    numero_ticket TEXT UNIQUE,
                    total_normal REAL DEFAULT 0,
                    total_con_descuento REAL DEFAULT 0,
                    descuento_total REAL DEFAULT 0,
                    metodo_pago TEXT DEFAULT 'efectivo',
                    cliente TEXT,
                    estado TEXT DEFAULT 'completada',
                    detalles TEXT,
                    promociones_aplicadas TEXT
                );
            `);

            // Tabla de caja
            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS caja (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tipo TEXT NOT NULL,
                    monto REAL NOT NULL,
                    fecha TEXT DEFAULT CURRENT_TIMESTAMP,
                    motivo TEXT,
                    descripcion TEXT
                );
            `);

            // Tabla de extracciones
            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS extracciones (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    fecha TEXT DEFAULT CURRENT_TIMESTAMP,
                    monto REAL NOT NULL,
                    motivo TEXT NOT NULL,
                    categoria TEXT,
                    observaciones TEXT,
                    usuario TEXT
                );
            `);

            console.log('Tablas creadas exitosamente');
        } catch (error) {
            console.error('Error creando tablas:', error);
            throw error;
        }
    }

    async verificarDatosIniciales() {
        try {
            // Verificar si hay cócteles
            const cocktailsCount = await this.db.getFirstAsync(
                'SELECT COUNT(*) as count FROM cocktails'
            );
            
            if (cocktailsCount.count === 0) {
                await this.loadDatosEjemplo();
            }

            // Verificar configuración
            const configCount = await this.db.getFirstAsync(
                'SELECT COUNT(*) as count FROM config'
            );
            
            if (configCount.count === 0) {
                await this.setConfigDefaults();
            }

        } catch (error) {
            console.error('Error verificando datos iniciales:', error);
            await this.loadDatosEjemplo();
        }
    }

    async setConfigDefaults() {
        const defaults = [
            { key: 'precio_base', value: '3500' },
            { key: 'caja_abierta', value: 'false' },
            { key: 'monto_caja', value: '0' },
            { key: 'iva_porcentaje', value: '21' },
            { key: 'usar_precio2_por_defecto', value: 'false' },
            { key: 'caja_fecha_apertura', value: '' }
        ];

        for (const config of defaults) {
            await this.db.runAsync(
                'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
                [config.key, config.value]
            );
        }
    }

    async getConfigValue(key) {
        const result = await this.db.getFirstAsync(
            'SELECT value FROM config WHERE key = ?',
            [key]
        );
        return result ? result.value : null;
    }

    async setConfigValue(key, value) {
        await this.db.runAsync(
            'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
            [key, String(value)]
        );
    }

    async loadDatosEjemplo() {
        try {
            console.log('Cargando datos de ejemplo...');

            // Insertar cócteles de ejemplo
            const cocktailsEjemplo = [
                [1, 'Daiquiri Frutilla', 3500, 3000, 'daiquiri', 'Daiquiri de frutilla fresca', 5, 0, 1, 0],
                [2, 'Daiquiri Durazno', 3500, 3000, 'daiquiri', 'Daiquiri de durazno natural', 5, 0, 1, 0],
                [3, 'Pasion Roja', 3500, 3000, 'tropical', 'Mezcla de frutos rojos y cítricos', 6, 0, 1, 0],
                [4, 'Gancia', 3500, 3000, 'aperitivo', 'Gancia con soda y naranja', 4, 0, 1, 0],
                [5, 'Fernet', 3500, 3000, 'clasico', 'Fernet con cola', 3, 0, 1, 0],
                [6, 'Piña Colada', 3500, 3000, 'tropical', 'Ron, crema de coco y piña', 7, 0, 1, 0],
                [7, 'Pantera Rosa', 3500, 3000, 'cremoso', 'Cóctel cremoso y dulce', 6, 0, 1, 0],
                [8, 'Caipirinha', 3500, 3000, 'brasileño', 'Cachaça, lima y azúcar', 5, 0, 1, 0],
                [9, 'Menta Fuerte', 3500, 3000, 'mentolado', 'Refrescante con hierbabuena', 5, 0, 1, 0],
                [10, 'Tequila Sunrise', 3500, 3000, 'tropical', 'Degradado de colores como el amanecer', 6, 0, 1, 0],
                [11, 'Pitufo Azul', 3500, 3000, 'cremoso', 'Cóctel azul y cremoso', 6, 0, 1, 0],
                [12, 'Cuba Libre', 3500, 3000, 'clasico', 'Ron y refresco de cola', 3, 0, 1, 0],
                [13, 'Destornillador', 3500, 3000, 'citrico', 'Vodka y jugo de naranja', 4, 0, 1, 0],
                [14, 'Laguna Azul', 3500, 3000, 'tropical', 'Cóctel azul refrescante', 6, 0, 1, 0]
                [15, 'Mojito', 3500, 3000, 'Limon, menta y ron', 'Cóctel refrescante', 6, 0, 1, 0]
            ];

            for (const cocktail of cocktailsEjemplo) {
                await this.db.runAsync(
                    `INSERT OR REPLACE INTO cocktails 
                    (id, nombre, precio1, precio2, categoria, descripcion, tiempo_preparacion, popularidad, activo, activar_precio2)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    cocktail
                );
            }

            // Insertar promociones de ejemplo
            const promocionesEjemplo = [
                [1, 12, '🔥 2 por $3000 - Cuba Libre', '2por_precio', 3500, null, null, 2, null, new Date().toISOString(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), 1],
                [2, 1, '🎯 2x1 - Daiquiri frutilla', '2x1', null, null, null, 2, 1, new Date().toISOString(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), 1]
            ];

            for (const promo of promocionesEjemplo) {
                await this.db.runAsync(
                    `INSERT OR REPLACE INTO promociones 
                    (id, cocktailId, nombre, tipo, precio_promocional, descuento_porcentaje, descuento_monto, cantidad_requerida, cantidad_pagada, fecha_inicio, fecha_fin, activa)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    promo
                );
            }

            // Insertar extracciones de ejemplo
            const extraccionesEjemplo = [
                [1, new Date().toISOString(), 0, 'Compra de insumos', 'retiro', 'Compra de limones y azúcar', 'Admin'],
                [2, new Date(Date.now() - 86400000).toISOString(), 0, 'Pago de servicios', 'gasto', 'Luz y agua', 'Admin']
            ];

            for (const extraccion of extraccionesEjemplo) {
                await this.db.runAsync(
                    `INSERT OR REPLACE INTO extracciones 
                    (id, fecha, monto, motivo, categoria, observaciones, usuario)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    extraccion
                );
            }

            console.log('Datos de ejemplo cargados exitosamente');
            return true;

        } catch (error) {
            console.error('Error cargando datos de ejemplo:', error);
            throw error;
        }
    }

    // ===== MÉTODOS PARA CÓCTELES =====
    async getCocktails() {
        try {
            return await this.db.getAllAsync(
                'SELECT * FROM cocktails WHERE activo = 1 ORDER BY nombre'
            );
        } catch (error) {
            console.error('Error obteniendo cócteles:', error);
            return [];
        }
    }

    async getCocktailById(id) {
        try {
            return await this.db.getFirstAsync(
                'SELECT * FROM cocktails WHERE id = ? AND activo = 1',
                [id]
            );
        } catch (error) {
            console.error('Error obteniendo cóctel:', error);
            return null;
        }
    }

    async addCocktail(cocktail) {
        try {
            const result = await this.db.runAsync(
                `INSERT INTO cocktails 
                (nombre, precio1, precio2, categoria, descripcion, tiempo_preparacion, activo, activar_precio2)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    cocktail.nombre,
                    cocktail.precio1 || 3500,
                    cocktail.precio2 || 3500,
                    cocktail.categoria || '',
                    cocktail.descripcion || '',
                    cocktail.tiempo_preparacion || 5,
                    cocktail.activo !== undefined ? cocktail.activo : 1,
                    cocktail.activar_precio2 || 0
                ]
            );
            return result.lastInsertRowId;
        } catch (error) {
            console.error('Error agregando cóctel:', error);
            throw error;
        }
    }

    async updateCocktail(id, updates) {
        try {
            const fields = [];
            const values = [];
            
            for (const [key, value] of Object.entries(updates)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
            
            values.push(id);
            
            await this.db.runAsync(
                `UPDATE cocktails SET ${fields.join(', ')} WHERE id = ?`,
                values
            );
            return true;
        } catch (error) {
            console.error('Error actualizando cóctel:', error);
            return false;
        }
    }

    // ===== MÉTODOS PARA PROMOCIONES =====
    async getPromocionesActivas() {
        try {
            return await this.db.getAllAsync(`
                SELECT p.*, c.nombre as cocktail_nombre 
                FROM promociones p
                LEFT JOIN cocktails c ON p.cocktailId = c.id
                WHERE p.activa = 1 
                AND (p.fecha_fin IS NULL OR p.fecha_fin >= date('now'))
                ORDER BY p.fecha_inicio DESC
            `);
        } catch (error) {
            console.error('Error obteniendo promociones:', error);
            return [];
        }
    }

    async getPromocionesForCocktail(cocktailId) {
        try {
            return await this.db.getAllAsync(`
                SELECT * FROM promociones 
                WHERE cocktailId = ? 
                AND activa = 1
                AND (fecha_fin IS NULL OR fecha_fin >= date('now'))
                ORDER BY fecha_inicio DESC
            `, [cocktailId]);
        } catch (error) {
            console.error('Error obteniendo promociones para cóctel:', error);
            return [];
        }
    }

    async addPromocion(promocion) {
        try {
            const result = await this.db.runAsync(
                `INSERT INTO promociones 
                (cocktailId, nombre, tipo, precio_promocional, descuento_porcentaje, 
                 descuento_monto, cantidad_requerida, cantidad_pagada, 
                 fecha_inicio, fecha_fin, activa)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    promocion.cocktailId,
                    promocion.nombre,
                    promocion.tipo,
                    promocion.precio_promocional || null,
                    promocion.descuento_porcentaje || null,
                    promocion.descuento_monto || null,
                    promocion.cantidad_requerida || null,
                    promocion.cantidad_pagada || null,
                    promocion.fecha_inicio || new Date().toISOString(),
                    promocion.fecha_fin || null,
                    promocion.activa !== undefined ? promocion.activa : 1
                ]
            );
            return result.lastInsertRowId;
        } catch (error) {
            console.error('Error agregando promoción:', error);
            throw error;
        }
    }

    // ===== MÉTODOS PARA VENTAS =====
    async registrarVenta(venta) {
        try {
            const ticketNumber = `TKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
            const result = await this.db.runAsync(
                `INSERT INTO ventas 
                (fecha, numero_ticket, total_normal, total_con_descuento, 
                 descuento_total, metodo_pago, cliente, estado, 
                 detalles, promociones_aplicadas)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    new Date().toISOString(),
                    ticketNumber,
                    venta.total_normal || 0,
                    venta.total_con_descuento || venta.total_normal || 0,
                    venta.descuento_total || 0,
                    venta.metodo_pago || 'efectivo',
                    venta.cliente || '',
                    venta.estado || 'completada',
                    JSON.stringify(venta.detalles || []),
                    JSON.stringify(venta.promociones_aplicadas || [])
                ]
            );

            const ventaId = result.lastInsertRowId;

            // Actualizar popularidad de cócteles
            if (venta.detalles) {
                for (const detalle of venta.detalles) {
                    await this.db.runAsync(
                        'UPDATE cocktails SET popularidad = popularidad + ? WHERE id = ?',
                        [detalle.cantidad || 1, detalle.cocktailId]
                    );
                }
            }

            // Si la caja está abierta, sumar al monto
            const cajaAbierta = await this.getConfigValue('caja_abierta') === 'true';
            if (cajaAbierta && (venta.metodo_pago === 'efectivo' || !venta.metodo_pago)) {
                const montoActual = parseFloat(await this.getConfigValue('monto_caja') || '0');
                const nuevoMonto = montoActual + (venta.total_con_descuento || venta.total_normal || 0);
                await this.setConfigValue('monto_caja', nuevoMonto);
            }

            return ventaId;
        } catch (error) {
            console.error('Error registrando venta:', error);
            throw error;
        }
    }

    async getAllVentas() {
        try {
            const ventas = await this.db.getAllAsync(
                'SELECT * FROM ventas ORDER BY fecha DESC'
            );
            
            // Parsear JSON strings
            return ventas.map(venta => ({
                ...venta,
                detalles: JSON.parse(venta.detalles || '[]'),
                promociones_aplicadas: JSON.parse(venta.promociones_aplicadas || '[]')
            }));
        } catch (error) {
            console.error('Error obteniendo ventas:', error);
            return [];
        }
    }

    async getVentaPorId(id) {
        try {
            const venta = await this.db.getFirstAsync(
                'SELECT * FROM ventas WHERE id = ?',
                [id]
            );
            
            if (venta) {
                venta.detalles = JSON.parse(venta.detalles || '[]');
                venta.promociones_aplicadas = JSON.parse(venta.promociones_aplicadas || '[]');
            }
            
            return venta;
        } catch (error) {
            console.error('Error obteniendo venta:', error);
            return null;
        }
    }

    async getVentasByDate(fecha) {
        try {
            const ventas = await this.db.getAllAsync(
                `SELECT * FROM ventas 
                WHERE date(fecha) = date(?)
                ORDER BY fecha DESC`,
                [fecha]
            );
            
            return ventas.map(venta => ({
                ...venta,
                detalles: JSON.parse(venta.detalles || '[]'),
                promociones_aplicadas: JSON.parse(venta.promociones_aplicadas || '[]')
            }));
        } catch (error) {
            console.error('Error obteniendo ventas por fecha:', error);
            return [];
        }
    }

    async getVentasPorFecha(fechaInicio, fechaFin) {
        try {
            const ventas = await this.db.getAllAsync(
                `SELECT * FROM ventas 
                WHERE date(fecha) BETWEEN date(?) AND date(?)
                ORDER BY fecha DESC`,
                [fechaInicio, fechaFin]
            );
            
            return ventas.map(venta => ({
                ...venta,
                detalles: JSON.parse(venta.detalles || '[]'),
                promociones_aplicadas: JSON.parse(venta.promociones_aplicadas || '[]')
            }));
        } catch (error) {
            console.error('Error obteniendo ventas por rango:', error);
            return [];
        }
    }

    // ===== MÉTODOS PARA CAJA =====
    async abrirCaja(montoInicial) {
        try {
            await this.setConfigValue('caja_abierta', 'true');
            await this.setConfigValue('monto_caja', montoInicial.toString());
            await this.setConfigValue('caja_fecha_apertura', new Date().toISOString());

            await this.db.runAsync(
                `INSERT INTO caja (tipo, monto, motivo, descripcion)
                VALUES (?, ?, ?, ?)`,
                ['apertura', montoInicial, 'Apertura de caja', 'Apertura de caja diaria']
            );

            return true;
        } catch (error) {
            console.error('Error abriendo caja:', error);
            throw error;
        }
    }

    async cerrarCaja(montoFinal, observaciones = '') {
        try {
            await this.setConfigValue('caja_abierta', 'false');
            await this.setConfigValue('caja_fecha_cierre', new Date().toISOString());

            await this.db.runAsync(
                `INSERT INTO caja (tipo, monto, motivo, descripcion)
                VALUES (?, ?, ?, ?)`,
                ['cierre', montoFinal, 'Cierre de caja', observaciones || 'Cierre de caja diaria']
            );

            return true;
        } catch (error) {
            console.error('Error cerrando caja:', error);
            throw error;
        }
    }

    async getEstadoCaja() {
        try {
            const abierta = await this.getConfigValue('caja_abierta') === 'true';
            const monto = parseFloat(await this.getConfigValue('monto_caja') || '0');
            const fecha_apertura = await this.getConfigValue('caja_fecha_apertura');
            
            return {
                abierta,
                monto,
                fecha_apertura
            };
        } catch (error) {
            console.error('Error obteniendo estado de caja:', error);
            return { abierta: false, monto: 0, fecha_apertura: null };
        }
    }

    async registrarExtraccion(extraccion) {
        try {
            const result = await this.db.runAsync(
                `INSERT INTO extracciones (fecha, monto, motivo, categoria, observaciones, usuario)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    new Date().toISOString(),
                    extraccion.monto,
                    extraccion.motivo,
                    extraccion.categoria || 'retiro',
                    extraccion.observaciones || '',
                    extraccion.usuario || 'Admin'
                ]
            );

            // Registrar en historial de caja
            await this.db.runAsync(
                `INSERT INTO caja (tipo, monto, motivo, descripcion)
                VALUES (?, ?, ?, ?)`,
                [
                    'extraccion',
                    extraccion.monto,
                    extraccion.motivo,
                    `Extracción: ${extraccion.motivo}`
                ]
            );

            // Actualizar monto en caja
            const estadoCaja = await this.getEstadoCaja();
            if (estadoCaja.abierta) {
                const nuevoMonto = estadoCaja.monto - extraccion.monto;
                await this.setConfigValue('monto_caja', nuevoMonto.toString());
            }

            return result.lastInsertRowId;
        } catch (error) {
            console.error('Error registrando extracción:', error);
            throw error;
        }
    }

    async getExtracciones() {
        try {
            return await this.db.getAllAsync(
                'SELECT * FROM extracciones ORDER BY fecha DESC'
            );
        } catch (error) {
            console.error('Error obteniendo extracciones:', error);
            return [];
        }
    }

    async getHistorialCaja() {
        try {
            return await this.db.getAllAsync(
                'SELECT * FROM caja ORDER BY fecha DESC'
            );
        } catch (error) {
            console.error('Error obteniendo historial de caja:', error);
            return [];
        }
    }

    async actualizarMontoCaja(nuevoMonto) {
        try {
            await this.setConfigValue('monto_caja', nuevoMonto.toString());
            return true;
        } catch (error) {
            console.error('Error actualizando monto de caja:', error);
            return false;
        }
    }

    // ===== MÉTODOS PARA ESTADÍSTICAS =====
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
                        if (cantidad >= 2 && promo.precio_promocional) {
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

    async getEstadisticasVentas() {
        try {
            const ventas = await this.getAllVentas();
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
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return {
                total_ventas: 0,
                ventas_hoy: 0,
                monto_hoy: 0,
                ventas_semana: 0,
                monto_semana: 0,
                promedio_ticket: 0,
                metodo_pago: {
                    efectivo: 0,
                    tarjeta: 0,
                    transferencia: 0
                }
            };
        }
    }

    async getEstadisticas() {
        try {
            const totalCocktails = await this.db.getFirstAsync(
                'SELECT COUNT(*) as count FROM cocktails WHERE activo = 1'
            );
            
            const promocionesActivas = await this.db.getFirstAsync(
                `SELECT COUNT(*) as count FROM promociones 
                WHERE activa = 1 AND (fecha_fin IS NULL OR fecha_fin >= date('now'))`
            );
            
            const estadisticasVentas = await this.getEstadisticasVentas();
            const estadoCaja = await this.getEstadoCaja();

            return {
                total_cocktails: totalCocktails.count || 0,
                ventas_hoy: estadisticasVentas.ventas_hoy,
                monto_hoy: estadisticasVentas.monto_hoy,
                caja_abierta: estadoCaja.abierta,
                promociones_activas: promocionesActivas.count || 0
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas generales:', error);
            return {
                total_cocktails: 0,
                ventas_hoy: 0,
                monto_hoy: 0,
                caja_abierta: false,
                promociones_activas: 0
            };
        }
    }

    // ===== UTILIDAD =====
    async resetDatabase() {
        try {
            // Eliminar todas las tablas
            await this.db.execAsync('DROP TABLE IF EXISTS cocktails');
            await this.db.execAsync('DROP TABLE IF EXISTS promociones');
            await this.db.execAsync('DROP TABLE IF EXISTS ventas');
            await this.db.execAsync('DROP TABLE IF EXISTS caja');
            await this.db.execAsync('DROP TABLE IF EXISTS extracciones');
            await this.db.execAsync('DROP TABLE IF EXISTS config');
            
            // Volver a crear
            await this.createTables();
            await this.loadDatosEjemplo();
            
            console.log('Base de datos reseteada exitosamente');
            return true;
        } catch (error) {
            console.error('Error reseteando base de datos:', error);
            throw error;
        }
    }
}

export default new SimpleDatabase();