import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

class CocktailDatabase {
  constructor() {
    this.db = null;
    this.databaseName = 'BarCocktailsPro.db';
  }

  async init() {
    try {
      this.db = await SQLite.openDatabase({
        name: this.databaseName,
        location: 'default',
      });
      await this.createTables();
      console.log('Base de datos de cócteles PRO inicializada');
      await this.insertDatosEjemplo();
    } catch (error) {
      console.error('Error al inicializar:', error);
      throw error;
    }
  }

  async createTables() {
    const queries = [
      // ============ TABLAS PRINCIPALES ============
      
      // Tabla de insumos/ingredientes
      `CREATE TABLE IF NOT EXISTS insumos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        categoria TEXT NOT NULL,
        unidad_medida TEXT NOT NULL,
        stock_actual REAL NOT NULL DEFAULT 0,
        stock_minimo REAL NOT NULL DEFAULT 10,
        precio_compra REAL NOT NULL,
        proveedor TEXT,
        ubicacion TEXT,
        fecha_ultima_compra DATETIME,
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de cócteles
      `CREATE TABLE IF NOT EXISTS cocktails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        categoria TEXT NOT NULL,
        precio_venta REAL NOT NULL,
        tiempo_preparacion INTEGER DEFAULT 5,
        descripcion TEXT,
        instrucciones TEXT,
        imagen TEXT,
        popularidad INTEGER DEFAULT 0,
        costo_aproximado REAL DEFAULT 0,
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de recetas (ingredientes por cóctel)
      `CREATE TABLE IF NOT EXISTS recetas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cocktail_id INTEGER NOT NULL,
        insumo_id INTEGER NOT NULL,
        cantidad REAL NOT NULL,
        unidad TEXT NOT NULL,
        orden INTEGER DEFAULT 1,
        FOREIGN KEY (cocktail_id) REFERENCES cocktails(id) ON DELETE CASCADE,
        FOREIGN KEY (insumo_id) REFERENCES insumos(id),
        UNIQUE(cocktail_id, insumo_id)
      )`,

      // ============ TABLAS DE VENTAS ============
      
      // Tabla de ventas principales
      `CREATE TABLE IF NOT EXISTS ventas_cocktails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
        numero_ticket TEXT UNIQUE,
        total_normal REAL NOT NULL,
        total_con_descuento REAL,
        descuento_total REAL DEFAULT 0,
        metodo_pago TEXT DEFAULT 'efectivo',
        tipo_consumo TEXT DEFAULT 'local',
        estado TEXT DEFAULT 'completado',
        cliente TEXT,
        mesa TEXT,
        bartender_id INTEGER,
        observaciones TEXT,
        caja_diaria_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de detalles de venta
      `CREATE TABLE IF NOT EXISTS venta_detalles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id INTEGER NOT NULL,
        cocktail_id INTEGER NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_unitario REAL NOT NULL,
        precio_con_descuento REAL,
        descuento_aplicado REAL DEFAULT 0,
        subtotal REAL NOT NULL,
        FOREIGN KEY (venta_id) REFERENCES ventas_cocktails(id) ON DELETE CASCADE,
        FOREIGN KEY (cocktail_id) REFERENCES cocktails(id)
      )`,

      // ============ TABLAS DE PROMOCIONES ============
      
      // Tabla de promociones
      `CREATE TABLE IF NOT EXISTS promociones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        tipo TEXT NOT NULL, 
          -- '2x1', '2por_precio', 'descuento_porcentaje', 'descuento_fijo', 'combo', 'todos'
        cocktail_id INTEGER,
        cantidad_requerida INTEGER DEFAULT 2,
        cantidad_pagada INTEGER DEFAULT 1,
        precio_promocional REAL,
        descuento_porcentaje REAL,
        descuento_monto REAL,
        fecha_inicio DATETIME NOT NULL,
        fecha_fin DATETIME NOT NULL,
        dias_semana TEXT DEFAULT '1,2,3,4,5,6,7',
        hora_inicio TIME DEFAULT '00:00:00',
        hora_fin TIME DEFAULT '23:59:59',
        estado TEXT DEFAULT 'activa',
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cocktail_id) REFERENCES cocktails(id)
      )`,

      // Tabla de combos
      `CREATE TABLE IF NOT EXISTS combo_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        combo_id INTEGER NOT NULL,
        cocktail_id INTEGER NOT NULL,
        cantidad INTEGER DEFAULT 1,
        FOREIGN KEY (combo_id) REFERENCES promociones(id) ON DELETE CASCADE,
        FOREIGN KEY (cocktail_id) REFERENCES cocktails(id),
        UNIQUE(combo_id, cocktail_id)
      )`,

      // Tabla de promociones aplicadas en ventas
      `CREATE TABLE IF NOT EXISTS venta_promociones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id INTEGER NOT NULL,
        promocion_id INTEGER NOT NULL,
        cocktail_id INTEGER,
        cantidad INTEGER DEFAULT 1,
        descuento_aplicado REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (venta_id) REFERENCES ventas_cocktails(id) ON DELETE CASCADE,
        FOREIGN KEY (promocion_id) REFERENCES promociones(id),
        FOREIGN KEY (cocktail_id) REFERENCES cocktails(id)
      )`,

      // ============ TABLAS DE CAJA Y CONTROL ============
      
      // Tabla de caja diaria
      `CREATE TABLE IF NOT EXISTS caja_diaria (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha DATE NOT NULL UNIQUE,
        apertura_hora DATETIME,
        cierre_hora DATETIME,
        monto_apertura REAL NOT NULL DEFAULT 0,
        monto_cierre REAL,
        ventas_efectivo REAL DEFAULT 0,
        ventas_tarjeta REAL DEFAULT 0,
        ventas_transferencia REAL DEFAULT 0,
        propinas REAL DEFAULT 0,
        retiros REAL DEFAULT 0,
        ingresos_extra REAL DEFAULT 0,
        observaciones TEXT,
        estado TEXT DEFAULT 'cerrada',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de compras de insumos
      `CREATE TABLE IF NOT EXISTS compras_insumos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        insumo_id INTEGER NOT NULL,
        cantidad REAL NOT NULL,
        precio_unitario REAL NOT NULL,
        total REAL NOT NULL,
        proveedor TEXT,
        factura_numero TEXT,
        estado TEXT DEFAULT 'recibido',
        observaciones TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (insumo_id) REFERENCES insumos(id)
      )`,

      // Tabla de gastos operativos
      `CREATE TABLE IF NOT EXISTS gastos_operativos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        categoria TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        monto REAL NOT NULL,
        metodo_pago TEXT,
        comprobante TEXT,
        observaciones TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // ============ TABLAS DE CONTROL ============
      
      // Tabla de empleados
      `CREATE TABLE IF NOT EXISTS empleados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        rol TEXT NOT NULL,
        telefono TEXT,
        email TEXT UNIQUE,
        salario_hora REAL,
        activo INTEGER DEFAULT 1,
        fecha_contratacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de turnos
      `CREATE TABLE IF NOT EXISTS turnos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empleado_id INTEGER NOT NULL,
        fecha DATE NOT NULL,
        hora_entrada DATETIME,
        hora_salida DATETIME,
        horas_trabajadas REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empleado_id) REFERENCES empleados(id)
      )`,

      // Tabla de inventario diario
      `CREATE TABLE IF NOT EXISTS inventario_diario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha DATE NOT NULL,
        insumo_id INTEGER NOT NULL,
        stock_inicial REAL NOT NULL,
        stock_final REAL,
        consumo_dia REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (insumo_id) REFERENCES insumos(id),
        UNIQUE(fecha, insumo_id)
      )`,

      // Tabla de clientes
      `CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        telefono TEXT UNIQUE,
        email TEXT,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_compras REAL DEFAULT 0,
        visitas INTEGER DEFAULT 0,
        ultima_visita DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de configuraciones
      `CREATE TABLE IF NOT EXISTS configuraciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clave TEXT UNIQUE NOT NULL,
        valor TEXT,
        descripcion TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    try {
      for (const query of queries) {
        await this.db.executeSql(query);
      }
      
      // Crear índices para mejor performance
      await this.createIndexes();
      
      console.log('Todas las tablas creadas correctamente');
    } catch (error) {
      console.error('Error al crear tablas:', error);
      throw error;
    }
  }

  async createIndexes() {
    const indexQueries = [
      // Índices para insumos
      `CREATE INDEX IF NOT EXISTS idx_insumos_categoria ON insumos(categoria)`,
      `CREATE INDEX IF NOT EXISTS idx_insumos_activo ON insumos(activo)`,
      
      // Índices para cocktails
      `CREATE INDEX IF NOT EXISTS idx_cocktails_categoria ON cocktails(categoria)`,
      `CREATE INDEX IF NOT EXISTS idx_cocktails_precio ON cocktails(precio_venta)`,
      `CREATE INDEX IF NOT EXISTS idx_cocktails_activo ON cocktails(activo)`,
      
      // Índices para recetas
      `CREATE INDEX IF NOT EXISTS idx_recetas_cocktail ON recetas(cocktail_id)`,
      `CREATE INDEX IF NOT EXISTS idx_recetas_insumo ON recetas(insumo_id)`,
      
      // Índices para ventas
      `CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas_cocktails(fecha_hora)`,
      `CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas_cocktails(estado)`,
      `CREATE INDEX IF NOT EXISTS idx_ventas_metodo_pago ON ventas_cocktails(metodo_pago)`,
      
      // Índices para detalles de venta
      `CREATE INDEX IF NOT EXISTS idx_venta_detalles_venta ON venta_detalles(venta_id)`,
      `CREATE INDEX IF NOT EXISTS idx_venta_detalles_cocktail ON venta_detalles(cocktail_id)`,
      
      // Índices para promociones
      `CREATE INDEX IF NOT EXISTS idx_promociones_tipo ON promociones(tipo)`,
      `CREATE INDEX IF NOT EXISTS idx_promociones_activo ON promociones(activo)`,
      `CREATE INDEX IF NOT EXISTS idx_promociones_fechas ON promociones(fecha_inicio, fecha_fin)`,
      
      // Índices para caja
      `CREATE INDEX IF NOT EXISTS idx_caja_fecha ON caja_diaria(fecha)`,
      `CREATE INDEX IF NOT EXISTS idx_caja_estado ON caja_diaria(estado)`,
      
      // Índices para compras
      `CREATE INDEX IF NOT EXISTS idx_compras_fecha ON compras_insumos(fecha)`,
      `CREATE INDEX IF NOT EXISTS idx_compras_insumo ON compras_insumos(insumo_id)`,
      
      // Índices para gastos
      `CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos_operativos(fecha)`,
      `CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos_operativos(categoria)`
    ];

    try {
      for (const query of indexQueries) {
        await this.db.executeSql(query);
      }
      console.log('Índices creados correctamente');
    } catch (error) {
      console.error('Error al crear índices:', error);
    }
  }

   async insertDatosEjemplo() {
    try {
      // Verificar si ya hay datos
      const check = await this.db.executeSql('SELECT COUNT(*) as count FROM cocktails');
      if (check[0].rows.item(0).count > 0) {
        console.log('Ya existen datos, omitiendo inserción de ejemplo');
        return;
      }

      // Insertar cócteles de ejemplo
      const cocktails = [
        ['Daiquiri frutilla', 'daiquiri', 3500, 5, 'Daiquiri de frutilla fresca'],
        ['Daiquiri durazno', 'daiquiri', 3500, 5, 'Daiquiri de durazno natural'],
        ['Pasion Roja', 'tropical', 3800, 6, 'Mezcla de frutos rojos y cítricos'],
        ['Gancia', 'aperitivo', 3200, 4, 'Gancia con soda y naranja'],
        ['Fernet', 'clasico', 3000, 3, 'Fernet con cola'],
        ['Piña Colada', 'tropical', 3800, 7, 'Ron, crema de coco y piña'],
        ['Pantera Rosa', 'cremoso', 4000, 6, 'Cóctel cremoso y dulce'],
        ['Caipirinha', 'brasileño', 3600, 5, 'Cachaça, lima y azúcar'],
        ['Menta Fuerte', 'mentolado', 3700, 5, 'Refrescante con hierbabuena'],
        ['Tequila Sunrise', 'tropical', 3800, 6, 'Degradado de colores como el amanecer'],
        ['Pitufo Azul', 'cremoso', 4000, 6, 'Cóctel azul y cremoso'],
        ['Cuba Libre', 'clasico', 3200, 3, 'Ron y refresco de cola'],
        ['Destornillador', 'citrico', 3300, 4, 'Vodka y jugo de naranja'],
        ['Laguna Azul', 'tropical', 3900, 6, 'Cóctel azul refrescante']
      ];

      for (const cocktail of cocktails) {
        await this.db.executeSql(
          `INSERT INTO cocktails (nombre, categoria, precio_venta, tiempo_preparacion, descripcion) 
           VALUES (?, ?, ?, ?, ?)`,
          cocktail
        );
      }

      console.log('Datos de ejemplo insertados correctamente');
      
    } catch (error) {
      console.error('Error insertando datos de ejemplo:', error);
    }
  }

  // ===== MÉTODOS DE UTILIDAD =====
  
  async backupDatabase() {
    try {
      const tables = ['cocktails', 'ventas_cocktails', 'promociones', 'caja_diaria', 'compras_insumos', 'gastos_operativos'];
      const backup = {};
      
      for (const table of tables) {
        const result = await this.db.executeSql(`SELECT * FROM ${table}`);
        const rows = result[0].rows;
        const data = [];
        
        for (let i = 0; i < rows.length; i++) {
          data.push(rows.item(i));
        }
        
        backup[table] = data;
      }
      
      const fecha = new Date().toISOString().replace(/[:.]/g, '-');
      return {
        fecha_backup: fecha,
        datos: backup
      };
      
    } catch (error) {
      console.error('Error en backup:', error);
      throw error;
    }
  }

  async getDatabaseInfo() {
    try {
      const tablesQuery = `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `;
      
      const result = await this.db.executeSql(tablesQuery);
      const rows = result[0].rows;
      const tables = [];
      
      for (let i = 0; i < rows.length; i++) {
        const tableName = rows.item(i).name;
        const countResult = await this.db.executeSql(`SELECT COUNT(*) as count FROM ${tableName}`);
        tables.push({
          nombre: tableName,
          registros: countResult[0].rows.item(0).count
        });
      }
      
      return {
        nombre_bd: this.databaseName,
        fecha_consulta: new Date().toISOString(),
        tablas: tables
      };
      
    } catch (error) {
      console.error('Error obteniendo info BD:', error);
      throw error;
    }
  }

  async resetDatabase() {
    try {
      const tablesQuery = `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `;
      
      const result = await this.db.executeSql(tablesQuery);
      const rows = result[0].rows;
      
      // Desactivar foreign keys temporalmente
      await this.db.executeSql('PRAGMA foreign_keys = OFF');
      
      // Eliminar todas las tablas
      for (let i = 0; i < rows.length; i++) {
        const tableName = rows.item(i).name;
        await this.db.executeSql(`DROP TABLE IF EXISTS ${tableName}`);
      }
      
      // Reactivar foreign keys
      await this.db.executeSql('PRAGMA foreign_keys = ON');
      
      // Volver a crear las tablas
      await this.createTables();
      
      console.log('Base de datos reinicializada correctamente');
      return true;
      
    } catch (error) {
      console.error('Error reinicializando BD:', error);
      await this.db.executeSql('PRAGMA foreign_keys = ON');
      throw error;
    }
  }

  getDatabase() {
    return this.db;
  }

  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
      console.log('Base de datos cerrada');
    }
  }
}

export default new CocktailDatabase();