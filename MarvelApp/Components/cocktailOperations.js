import CocktailDatabase from './database';

class CocktailOperations {
  constructor() {
    this.db = CocktailDatabase.getDatabase();
  }

  // ===== OPERACIONES DE CÓCTELES =====
  async obtenerCocktails() {
    const query = `
      SELECT * FROM cocktails 
      WHERE activo = 1 
      ORDER BY nombre ASC
    `;
    
    try {
      const result = await this.db.executeSql(query);
      const rows = result[0].rows;
      const cocktails = [];
      
      for (let i = 0; i < rows.length; i++) {
        cocktails.push(rows.item(i));
      }
      
      return cocktails;
    } catch (error) {
      console.error('Error al obtener cócteles:', error);
      throw error;
    }
  }

  async obtenerCocktailPorId(id) {
    const query = `
      SELECT * FROM cocktails 
      WHERE id = ? AND activo = 1
    `;
    
    try {
      const result = await this.db.executeSql(query, [id]);
      if (result[0].rows.length > 0) {
        return result[0].rows.item(0);
      }
      return null;
    } catch (error) {
      console.error('Error al obtener cóctel:', error);
      throw error;
    }
  }

  async agregarCocktail(cocktail) {
    const query = `
      INSERT INTO cocktails 
      (nombre, categoria, precio_venta, tiempo_preparacion, descripcion, instrucciones)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      cocktail.nombre,
      cocktail.categoria || 'clasico',
      cocktail.precio_venta,
      cocktail.tiempo_preparacion || 5,
      cocktail.descripcion || '',
      cocktail.instrucciones || ''
    ];

    try {
      const result = await this.db.executeSql(query, params);
      return result[0].insertId;
    } catch (error) {
      console.error('Error al agregar cóctel:', error);
      throw error;
    }
  }

  async actualizarCocktail(id, cocktail) {
    const query = `
      UPDATE cocktails 
      SET nombre = ?, categoria = ?, precio_venta = ?, 
          tiempo_preparacion = ?, descripcion = ?, instrucciones = ?
      WHERE id = ?
    `;
    
    const params = [
      cocktail.nombre,
      cocktail.categoria,
      cocktail.precio_venta,
      cocktail.tiempo_preparacion,
      cocktail.descripcion,
      cocktail.instrucciones,
      id
    ];

    try {
      await this.db.executeSql(query, params);
      return true;
    } catch (error) {
      console.error('Error al actualizar cóctel:', error);
      throw error;
    }
  }

  async eliminarCocktail(id) {
    const query = `UPDATE cocktails SET activo = 0 WHERE id = ?`;
    
    try {
      await this.db.executeSql(query, [id]);
      return true;
    } catch (error) {
      console.error('Error al eliminar cóctel:', error);
      throw error;
    }
  }

  async buscarCocktailsPorNombre(nombre) {
    const query = `
      SELECT * FROM cocktails 
      WHERE nombre LIKE ? AND activo = 1
      ORDER BY nombre ASC
    `;
    
    try {
      const result = await this.db.executeSql(query, [`%${nombre}%`]);
      const rows = result[0].rows;
      const cocktails = [];
      
      for (let i = 0; i < rows.length; i++) {
        cocktails.push(rows.item(i));
      }
      
      return cocktails;
    } catch (error) {
      console.error('Error buscando cócteles:', error);
      throw error;
    }
  }

  async obtenerCocktailsPorCategoria(categoria) {
    const query = `
      SELECT * FROM cocktails 
      WHERE categoria = ? AND activo = 1
      ORDER BY nombre ASC
    `;
    
    try {
      const result = await this.db.executeSql(query, [categoria]);
      const rows = result[0].rows;
      const cocktails = [];
      
      for (let i = 0; i < rows.length; i++) {
        cocktails.push(rows.item(i));
      }
      
      return cocktails;
    } catch (error) {
      console.error('Error obteniendo por categoría:', error);
      throw error;
    }
  }

  // ===== OPERACIONES DE RECETAS =====
  async obtenerRecetaCocktail(cocktailId) {
    const query = `
      SELECT 
        r.*,
        i.nombre as insumo_nombre,
        i.unidad_medida,
        i.precio_compra
      FROM recetas r
      JOIN insumos i ON r.insumo_id = i.id
      WHERE r.cocktail_id = ?
      ORDER BY r.orden
    `;
    
    try {
      const result = await this.db.executeSql(query, [cocktailId]);
      const rows = result[0].rows;
      const receta = [];
      
      for (let i = 0; i < rows.length; i++) {
        receta.push(rows.item(i));
      }
      
      return receta;
    } catch (error) {
      console.error('Error al obtener receta:', error);
      throw error;
    }
  }

  async agregarIngredienteReceta(cocktailId, ingrediente) {
    const query = `
      INSERT INTO recetas 
      (cocktail_id, insumo_id, cantidad, unidad, orden)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    try {
      await this.db.executeSql(query, [
        cocktailId,
        ingrediente.insumo_id,
        ingrediente.cantidad,
        ingrediente.unidad,
        ingrediente.orden || 1
      ]);
      return true;
    } catch (error) {
      console.error('Error al agregar ingrediente:', error);
      throw error;
    }
  }

  async calcularCostoCocktail(cocktailId) {
    const query = `
      SELECT 
        SUM(
          (r.cantidad * i.precio_compra) / 
          CASE i.unidad_medida
            WHEN 'ml' THEN 1000
            WHEN 'gr' THEN 1000
            WHEN 'kg' THEN 1
            WHEN 'unidad' THEN 1
            ELSE 1
          END
        ) as costo_total
      FROM recetas r
      JOIN insumos i ON r.insumo_id = i.id
      WHERE r.cocktail_id = ?
    `;
    
    try {
      const result = await this.db.executeSql(query, [cocktailId]);
      if (result[0].rows.length > 0) {
        return result[0].rows.item(0).costo_total || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error al calcular costo:', error);
      throw error;
    }
  }

  // ===== OPERACIONES DE INSUMOS =====
  async obtenerInsumos() {
    const query = `
      SELECT * FROM insumos 
      WHERE activo = 1 
      ORDER BY nombre ASC
    `;
    
    try {
      const result = await this.db.executeSql(query);
      const rows = result[0].rows;
      const insumos = [];
      
      for (let i = 0; i < rows.length; i++) {
        insumos.push(rows.item(i));
      }
      
      return insumos;
    } catch (error) {
      console.error('Error al obtener insumos:', error);
      throw error;
    }
  }

  async agregarInsumo(insumo) {
    const query = `
      INSERT INTO insumos 
      (nombre, categoria, unidad_medida, stock_actual, stock_minimo, precio_compra, proveedor, ubicacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      insumo.nombre,
      insumo.categoria,
      insumo.unidad_medida,
      insumo.stock_actual || 0,
      insumo.stock_minimo || 10,
      insumo.precio_compra,
      insumo.proveedor || '',
      insumo.ubicacion || ''
    ];

    try {
      const result = await this.db.executeSql(query, params);
      return result[0].insertId;
    } catch (error) {
      console.error('Error al agregar insumo:', error);
      throw error;
    }
  }

  async actualizarStockInsumo(insumoId, cantidad) {
    const query = `UPDATE insumos SET stock_actual = stock_actual + ? WHERE id = ?`;
    
    try {
      await this.db.executeSql(query, [cantidad, insumoId]);
      return true;
    } catch (error) {
      console.error('Error al actualizar stock:', error);
      throw error;
    }
  }

  async obtenerInsumosBajoStock() {
    const query = `
      SELECT * FROM insumos 
      WHERE stock_actual <= stock_minimo AND activo = 1
      ORDER BY (stock_actual / stock_minimo) ASC
    `;
    
    try {
      const result = await this.db.executeSql(query);
      const rows = result[0].rows;
      const insumos = [];
      
      for (let i = 0; i < rows.length; i++) {
        insumos.push(rows.item(i));
      }
      
      return insumos;
    } catch (error) {
      console.error('Error al obtener insumos bajos:', error);
      throw error;
    }
  }

  // ===== OPERACIONES DE VENTAS =====
  async registrarVentaCocktail(venta) {
    await this.db.executeSql('BEGIN TRANSACTION');
    
    try {
      // Generar número de ticket
      const fecha = new Date();
      const ticketNum = `TKT-${fecha.getFullYear()}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      // Registrar venta principal
      const ventaQuery = `
        INSERT INTO ventas_cocktails 
        (numero_ticket, total_normal, total_con_descuento, descuento_total, 
         metodo_pago, tipo_consumo, cliente, mesa, observaciones, caja_diaria_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const ventaResult = await this.db.executeSql(ventaQuery, [
        ticketNum,
        venta.total_normal,
        venta.total_con_descuento || venta.total_normal,
        venta.descuento_total || 0,
        venta.metodo_pago || 'efectivo',
        venta.tipo_consumo || 'local',
        venta.cliente || '',
        venta.mesa || '',
        venta.observaciones || '',
        venta.caja_diaria_id || null
      ]);

      const ventaId = ventaResult[0].insertId;

      // Registrar detalles de venta
      for (const detalle of venta.detalles) {
        const detalleQuery = `
          INSERT INTO venta_detalles 
          (venta_id, cocktail_id, cantidad, precio_unitario, 
           precio_con_descuento, descuento_aplicado, subtotal)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        await this.db.executeSql(detalleQuery, [
          ventaId,
          detalle.cocktail_id,
          detalle.cantidad,
          detalle.precio_unitario,
          detalle.precio_con_descuento || detalle.precio_unitario,
          detalle.descuento_aplicado || 0,
          detalle.subtotal
        ]);

        // Actualizar popularidad del cóctel
        await this.db.executeSql(
          'UPDATE cocktails SET popularidad = popularidad + ? WHERE id = ?',
          [detalle.cantidad, detalle.cocktail_id]
        );

        // Consumir insumos de la receta
        const receta = await this.obtenerRecetaCocktail(detalle.cocktail_id);
        for (const ingrediente of receta) {
          const cantidadConsumir = ingrediente.cantidad * detalle.cantidad;
          await this.actualizarStockInsumo(ingrediente.insumo_id, -cantidadConsumir);
        }
      }

      // Registrar promociones aplicadas
      if (venta.promociones && venta.promociones.length > 0) {
        for (const promo of venta.promociones) {
          await this.db.executeSql(
            `INSERT INTO venta_promociones 
             (venta_id, promocion_id, cocktail_id, cantidad, descuento_aplicado)
             VALUES (?, ?, ?, ?, ?)`,
            [ventaId, promo.promocion_id, promo.cocktail_id, promo.cantidad, promo.descuento_aplicado]
          );
        }
      }

      // Actualizar caja
      if (venta.metodo_pago) {
        const campo = `ventas_${venta.metodo_pago}`;
        await this.db.executeSql(
          `UPDATE caja_diaria 
           SET ${campo} = ${campo} + ? 
           WHERE estado = 'abierta'`,
          [venta.total_con_descuento || venta.total_normal]
        );
      }

      await this.db.executeSql('COMMIT');
      return {
        venta_id: ventaId,
        ticket_num: ticketNum,
        total: venta.total_con_descuento || venta.total_normal
      };
      
    } catch (error) {
      await this.db.executeSql('ROLLBACK');
      console.error('Error al registrar venta:', error);
      throw error;
    }
  }

  async obtenerVentasPorFecha(fechaInicio, fechaFin) {
    const query = `
      SELECT 
        v.*,
        COUNT(vd.id) as total_items,
        SUM(vd.cantidad) as total_cocktails
      FROM ventas_cocktails v
      LEFT JOIN venta_detalles vd ON v.id = vd.venta_id
      WHERE DATE(v.fecha_hora) BETWEEN ? AND ?
      GROUP BY v.id
      ORDER BY v.fecha_hora DESC
    `;
    
    try {
      const result = await this.db.executeSql(query, [fechaInicio, fechaFin]);
      const rows = result[0].rows;
      const ventas = [];
      
      for (let i = 0; i < rows.length; i++) {
        ventas.push(rows.item(i));
      }
      
      return ventas;
    } catch (error) {
      console.error('Error al obtener ventas:', error);
      throw error;
    }
  }

  async obtenerDetallesVenta(ventaId) {
    const query = `
      SELECT 
        vd.*,
        c.nombre as cocktail_nombre,
        c.categoria
      FROM venta_detalles vd
      JOIN cocktails c ON vd.cocktail_id = c.id
      WHERE vd.venta_id = ?
    `;
    
    try {
      const result = await this.db.executeSql(query, [ventaId]);
      const rows = result[0].rows;
      const detalles = [];
      
      for (let i = 0; i < rows.length; i++) {
        detalles.push(rows.item(i));
      }
      
      return detalles;
    } catch (error) {
      console.error('Error al obtener detalles:', error);
      throw error;
    }
  }

  // ===== OPERACIONES DE CAJA =====
  async abrirCajaDia(montoApertura) {
    const hoy = new Date().toISOString().split('T')[0];
    
    const query = `
      INSERT OR REPLACE INTO caja_diaria 
      (fecha, apertura_hora, monto_apertura, estado)
      VALUES (?, CURRENT_TIMESTAMP, ?, 'abierta')
    `;
    
    try {
      const result = await this.db.executeSql(query, [hoy, montoApertura]);
      return result[0].insertId;
    } catch (error) {
      console.error('Error al abrir caja:', error);
      throw error;
    }
  }

  async obtenerCajaAbierta() {
    const query = `
      SELECT * FROM caja_diaria 
      WHERE estado = 'abierta' 
      ORDER BY fecha DESC 
      LIMIT 1
    `;
    
    try {
      const result = await this.db.executeSql(query);
      if (result[0].rows.length > 0) {
        return result[0].rows.item(0);
      }
      return null;
    } catch (error) {
      console.error('Error al obtener caja abierta:', error);
      throw error;
    }
  }

  async cerrarCajaDia(datosCierre) {
    const hoy = new Date().toISOString().split('T')[0];
    
    const query = `
      UPDATE caja_diaria 
      SET cierre_hora = CURRENT_TIMESTAMP,
          monto_cierre = ?,
          retiros = ?,
          ingresos_extra = ?,
          propinas = ?,
          observaciones = ?,
          estado = 'cerrada'
      WHERE fecha = ? AND estado = 'abierta'
    `;
    
    try {
      await this.db.executeSql(query, [
        datosCierre.monto_cierre,
        datosCierre.retiros || 0,
        datosCierre.ingresos_extra || 0,
        datosCierre.propinas || 0,
        datosCierre.observaciones || '',
        hoy
      ]);
      return true;
    } catch (error) {
      console.error('Error al cerrar caja:', error);
      throw error;
    }
  }

  async obtenerResumenCaja(fecha) {
    const query = `
      SELECT 
        c.*,
        COALESCE(SUM(v.total_con_descuento), 0) as ventas_totales,
        COUNT(v.id) as cantidad_ventas,
        COALESCE(SUM(v.total_con_descuento) / COUNT(v.id), 0) as ticket_promedio,
        COALESCE(SUM(g.monto), 0) as gastos_totales
      FROM caja_diaria c
      LEFT JOIN ventas_cocktails v ON DATE(v.fecha_hora) = c.fecha
      LEFT JOIN gastos_operativos g ON DATE(g.fecha) = c.fecha
      WHERE c.fecha = ?
      GROUP BY c.id
    `;
    
    try {
      const result = await this.db.executeSql(query, [fecha]);
      if (result[0].rows.length > 0) {
        const resumen = result[0].rows.item(0);
        
        // Calcular balance
        const ingresos = resumen.ventas_totales + (resumen.ingresos_extra || 0);
        const egresos = resumen.gastos_totales + (resumen.retiros || 0);
        const balance = ingresos - egresos;
        
        return {
          ...resumen,
          ingresos,
          egresos,
          balance
        };
      }
      return null;
    } catch (error) {
      console.error('Error al obtener resumen:', error);
      throw error;
    }
  }

  // ===== OPERACIONES DE COMPRAS =====
  async registrarCompraInsumo(compra) {
    const query = `
      INSERT INTO compras_insumos 
      (insumo_id, cantidad, precio_unitario, total, proveedor, factura_numero, observaciones)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const result = await this.db.executeSql(query, [
        compra.insumo_id,
        compra.cantidad,
        compra.precio_unitario,
        compra.total,
        compra.proveedor || '',
        compra.factura_numero || '',
        compra.observaciones || ''
      ]);

      // Actualizar stock
      await this.actualizarStockInsumo(compra.insumo_id, compra.cantidad);

      // Actualizar fecha de última compra
      await this.db.executeSql(
        'UPDATE insumos SET fecha_ultima_compra = CURRENT_TIMESTAMP WHERE id = ?',
        [compra.insumo_id]
      );

      return result[0].insertId;
    } catch (error) {
      console.error('Error al registrar compra:', error);
      throw error;
    }
  }

  async obtenerComprasPorFecha(fechaInicio, fechaFin) {
    const query = `
      SELECT 
        c.*,
        i.nombre as insumo_nombre,
        i.unidad_medida
      FROM compras_insumos c
      JOIN insumos i ON c.insumo_id = i.id
      WHERE DATE(c.fecha) BETWEEN ? AND ?
      ORDER BY c.fecha DESC
    `;
    
    try {
      const result = await this.db.executeSql(query, [fechaInicio, fechaFin]);
      const rows = result[0].rows;
      const compras = [];
      
      for (let i = 0; i < rows.length; i++) {
        compras.push(rows.item(i));
      }
      
      return compras;
    } catch (error) {
      console.error('Error al obtener compras:', error);
      throw error;
    }
  }

  // ===== OPERACIONES DE GASTOS =====
  async registrarGastoOperativo(gasto) {
    const query = `
      INSERT INTO gastos_operativos 
      (categoria, descripcion, monto, metodo_pago, comprobante, observaciones)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const result = await this.db.executeSql(query, [
        gasto.categoria,
        gasto.descripcion,
        gasto.monto,
        gasto.metodo_pago || 'efectivo',
        gasto.comprobante || '',
        gasto.observaciones || ''
      ]);
      return result[0].insertId;
    } catch (error) {
      console.error('Error al registrar gasto:', error);
      throw error;
    }
  }

  async obtenerGastosPorFecha(fechaInicio, fechaFin) {
    const query = `
      SELECT * FROM gastos_operativos 
      WHERE DATE(fecha) BETWEEN ? AND ?
      ORDER BY fecha DESC
    `;
    
    try {
      const result = await this.db.executeSql(query, [fechaInicio, fechaFin]);
      const rows = result[0].rows;
      const gastos = [];
      
      for (let i = 0; i < rows.length; i++) {
        gastos.push(rows.item(i));
      }
      
      return gastos;
    } catch (error) {
      console.error('Error al obtener gastos:', error);
      throw error;
    }
  }

  // ===== REPORTES =====
  async obtenerVentasDiarias(fecha) {
    const query = `
      SELECT 
        DATE(v.fecha_hora) as fecha,
        COUNT(v.id) as total_ventas,
        SUM(v.total_con_descuento) as monto_total,
        SUM(v.total_normal - v.total_con_descuento) as descuento_total,
        SUM(CASE WHEN v.metodo_pago = 'efectivo' THEN v.total_con_descuento ELSE 0 END) as efectivo,
        SUM(CASE WHEN v.metodo_pago = 'tarjeta' THEN v.total_con_descuento ELSE 0 END) as tarjeta,
        SUM(CASE WHEN v.metodo_pago = 'transferencia' THEN v.total_con_descuento ELSE 0 END) as transferencia,
        SUM(vd.cantidad) as total_cocktails_vendidos
      FROM ventas_cocktails v
      LEFT JOIN venta_detalles vd ON v.id = vd.venta_id
      WHERE DATE(v.fecha_hora) = ?
      GROUP BY DATE(v.fecha_hora)
    `;
    
    try {
      const result = await this.db.executeSql(query, [fecha]);
      if (result[0].rows.length > 0) {
        return result[0].rows.item(0);
      }
      return null;
    } catch (error) {
      console.error('Error al obtener ventas diarias:', error);
      throw error;
    }
  }

  async obtenerTopCocktails(limit = 10) {
    const query = `
      SELECT 
        c.id,
        c.nombre,
        c.categoria,
        c.precio_venta,
        SUM(vd.cantidad) as cantidad_vendida,
        SUM(vd.subtotal) as ingresos_generados,
        AVG(vd.precio_unitario) as precio_promedio,
        COUNT(DISTINCT v.id) as ventas_totales
      FROM venta_detalles vd
      JOIN cocktails c ON vd.cocktail_id = c.id
      JOIN ventas_cocktails v ON vd.venta_id = v.id
      WHERE v.estado = 'completado'
      GROUP BY c.id, c.nombre
      ORDER BY cantidad_vendida DESC
      LIMIT ?
    `;
    
    try {
      const result = await this.db.executeSql(query, [limit]);
      const rows = result[0].rows;
      const top = [];
      
      for (let i = 0; i < rows.length; i++) {
        top.push(rows.item(i));
      }
      
      return top;
    } catch (error) {
      console.error('Error al obtener top cócteles:', error);
      throw error;
    }
  }

  async obtenerAnalisisCostos(fechaInicio, fechaFin) {
    const query = `
      SELECT 
        -- Ingresos
        COALESCE(SUM(v.total_con_descuento), 0) as ingresos_totales,
        
        -- Costos de insumos vendidos
        COALESCE(SUM(
          (SELECT SUM(r.cantidad * i.precio_compra / 
            CASE i.unidad_medida 
              WHEN 'ml' THEN 1000
              WHEN 'gr' THEN 1000
              WHEN 'kg' THEN 1
              ELSE 1
            END)
           FROM recetas r
           JOIN insumos i ON r.insumo_id = i.id
           WHERE r.cocktail_id = vd.cocktail_id) * vd.cantidad
        ), 0) as costo_insumos,
        
        -- Gastos operativos
        COALESCE(SUM(g.monto), 0) as gastos_operativos,
        
        -- Compras de insumos
        COALESCE(SUM(ci.total), 0) as compras_insumos
      FROM ventas_cocktails v
      JOIN venta_detalles vd ON v.id = vd.venta_id
      LEFT JOIN gastos_operativos g ON DATE(g.fecha) BETWEEN ? AND ?
      LEFT JOIN compras_insumos ci ON DATE(ci.fecha) BETWEEN ? AND ?
      WHERE DATE(v.fecha_hora) BETWEEN ? AND ?
    `;
    
    try {
      const result = await this.db.executeSql(query, [
        fechaInicio, fechaFin,
        fechaInicio, fechaFin,
        fechaInicio, fechaFin
      ]);
      
      if (result[0].rows.length > 0) {
        const datos = result[0].rows.item(0);
        const utilidadBruta = datos.ingresos_totales - datos.costo_insumos;
        const utilidadNeta = utilidadBruta - datos.gastos_operativos;
        const margenBruto = datos.ingresos_totales > 0 ? (utilidadBruta / datos.ingresos_totales) * 100 : 0;
        const margenNeto = datos.ingresos_totales > 0 ? (utilidadNeta / datos.ingresos_totales) * 100 : 0;
        
        return {
          ...datos,
          utilidad_bruta: utilidadBruta,
          utilidad_neta: utilidadNeta,
          margen_bruto: parseFloat(margenBruto.toFixed(2)),
          margen_neto: parseFloat(margenNeto.toFixed(2))
        };
      }
      return null;
    } catch (error) {
      console.error('Error en análisis de costos:', error);
      throw error;
    }
  }

  // ===== INVENTARIO =====
  async realizarConteoInventario() {
    const hoy = new Date().toISOString().split('T')[0];
    
    try {
      // Obtener todos los insumos activos
      const insumos = await this.db.executeSql(
        'SELECT id, stock_actual FROM insumos WHERE activo = 1'
      );
      
      for (let i = 0; i < insumos[0].rows.length; i++) {
        const insumo = insumos[0].rows.item(i);
        
        // Registrar en inventario diario
        await this.db.executeSql(
          `INSERT OR REPLACE INTO inventario_diario 
           (fecha, insumo_id, stock_inicial, stock_final) 
           VALUES (?, ?, ?, ?)`,
          [hoy, insumo.id, insumo.stock_actual, insumo.stock_actual]
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error en conteo inventario:', error);
      throw error;
    }
  }

  async calcularConsumoDiario(fecha) {
    const query = `
      SELECT 
        i.id,
        i.nombre,
        i.categoria,
        i.unidad_medida,
        inv.stock_inicial,
        inv.stock_final,
        COALESCE(inv.stock_inicial - inv.stock_final, 0) as consumo_dia,
        i.precio_compra,
        COALESCE((inv.stock_inicial - inv.stock_final) * i.precio_compra / 
          CASE i.unidad_medida 
            WHEN 'ml' THEN 1000
            WHEN 'gr' THEN 1000
            WHEN 'kg' THEN 1
            ELSE 1
          END, 0) as costo_consumo
      FROM insumos i
      LEFT JOIN inventario_diario inv ON i.id = inv.insumo_id AND inv.fecha = ?
      WHERE i.activo = 1
      ORDER BY consumo_dia DESC
    `;
    
    try {
      const result = await this.db.executeSql(query, [fecha]);
      const rows = result[0].rows;
      const consumo = [];
      
      for (let i = 0; i < rows.length; i++) {
        consumo.push(rows.item(i));
      }
      
      return consumo;
    } catch (error) {
      console.error('Error al calcular consumo:', error);
      throw error;
    }
  }

  // ===== FUNCIONES DE UTILIDAD =====
  async obtenerEstadisticasGenerales() {
    try {
      const [
        totalCocktails,
        totalVentas,
        ventasHoy,
        insumosBajoStock
      ] = await Promise.all([
        this.contarTabla('cocktails', 'activo = 1'),
        this.contarTabla('ventas_cocktails', "DATE(fecha_hora) = DATE('now')"),
        this.obtenerVentasDiarias(new Date().toISOString().split('T')[0]),
        this.obtenerInsumosBajoStock()
      ]);

      return {
        total_cocktails: totalCocktails,
        ventas_hoy: ventasHoy ? ventasHoy.total_ventas : 0,
        monto_hoy: ventasHoy ? ventasHoy.monto_total : 0,
        insumos_bajo_stock: insumosBajoStock.length
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  async contarTabla(tabla, condiciones = '') {
    const whereClause = condiciones ? `WHERE ${condiciones}` : '';
    const query = `SELECT COUNT(*) as count FROM ${tabla} ${whereClause}`;
    
    try {
      const result = await this.db.executeSql(query);
      return result[0].rows.item(0).count;
    } catch (error) {
      console.error(`Error contando ${tabla}:`, error);
      return 0;
    }
  }

  // ===== BACKUP Y RESTAURACIÓN =====
  async exportarDatos() {
    try {
      const tables = [
        'cocktails', 
        'insumos', 
        'recetas', 
        'ventas_cocktails', 
        'venta_detalles',
        'promociones',
        'caja_diaria',
        'compras_insumos',
        'gastos_operativos'
      ];
      
      const backup = {
        fecha_exportacion: new Date().toISOString(),
        version: '1.0',
        datos: {}
      };
      
      for (const table of tables) {
        const result = await this.db.executeSql(`SELECT * FROM ${table}`);
        const rows = result[0].rows;
        const data = [];
        
        for (let i = 0; i < rows.length; i++) {
          data.push(rows.item(i));
        }
        
        backup.datos[table] = data;
      }
      
      return backup;
    } catch (error) {
      console.error('Error exportando datos:', error);
      throw error;
    }
  }
}

export default new CocktailOperations();