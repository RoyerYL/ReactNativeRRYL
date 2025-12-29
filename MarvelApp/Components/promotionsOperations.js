import CocktailDatabase from './database';

class PromotionOperations {
  constructor() {
    this.db = CocktailDatabase.getDatabase();
  }

  // ===== PROMOCIONES BÁSICAS =====
  async crearPromocion2porPrecio(cocktailId, precioPromocional, datos) {
    const query = `
      INSERT INTO promociones 
      (nombre, tipo, cocktail_id, cantidad_requerida, precio_promocional,
       fecha_inicio, fecha_fin, dias_semana, hora_inicio, hora_fin)
      VALUES (?, '2por_precio', ?, 2, ?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const result = await this.db.executeSql(query, [
        datos.nombre || `2 por $${precioPromocional}`,
        cocktailId,
        precioPromocional,
        datos.fecha_inicio,
        datos.fecha_fin,
        datos.dias_semana || '1,2,3,4,5,6,7',
        datos.hora_inicio || '00:00:00',
        datos.hora_fin || '23:59:59'
      ]);
      return result[0].insertId;
    } catch (error) {
      console.error('Error al crear promoción 2 por precio:', error);
      throw error;
    }
  }

  async crearPromocion2x1(cocktailId, datos) {
    const query = `
      INSERT INTO promociones 
      (nombre, tipo, cocktail_id, cantidad_requerida, cantidad_pagada,
       fecha_inicio, fecha_fin, dias_semana, hora_inicio, hora_fin)
      VALUES (?, '2x1', ?, 2, 1, ?, ?, ?, ?, ?)
    `;
    
    try {
      const result = await this.db.executeSql(query, [
        datos.nombre || 'Promoción 2x1',
        cocktailId,
        datos.fecha_inicio,
        datos.fecha_fin,
        datos.dias_semana || '1,2,3,4,5,6,7',
        datos.hora_inicio || '00:00:00',
        datos.hora_fin || '23:59:59'
      ]);
      return result[0].insertId;
    } catch (error) {
      console.error('Error al crear promoción 2x1:', error);
      throw error;
    }
  }

  async crearPromocionDescuentoPorcentaje(cocktailId, porcentaje, datos) {
    const query = `
      INSERT INTO promociones 
      (nombre, tipo, cocktail_id, descuento_porcentaje,
       fecha_inicio, fecha_fin, dias_semana, hora_inicio, hora_fin)
      VALUES (?, 'descuento_porcentaje', ?, ?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const result = await this.db.executeSql(query, [
        datos.nombre || `${porcentaje}% de descuento`,
        cocktailId,
        porcentaje,
        datos.fecha_inicio,
        datos.fecha_fin,
        datos.dias_semana || '1,2,3,4,5,6,7',
        datos.hora_inicio || '00:00:00',
        datos.hora_fin || '23:59:59'
      ]);
      return result[0].insertId;
    } catch (error) {
      console.error('Error al crear descuento porcentaje:', error);
      throw error;
    }
  }

  async crearPromocionDescuentoFijo(cocktailId, montoDescuento, datos) {
    const query = `
      INSERT INTO promociones 
      (nombre, tipo, cocktail_id, descuento_monto,
       fecha_inicio, fecha_fin, dias_semana, hora_inicio, hora_fin)
      VALUES (?, 'descuento_fijo', ?, ?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const result = await this.db.executeSql(query, [
        datos.nombre || `$${montoDescuento} OFF`,
        cocktailId,
        montoDescuento,
        datos.fecha_inicio,
        datos.fecha_fin,
        datos.dias_semana || '1,2,3,4,5,6,7',
        datos.hora_inicio || '00:00:00',
        datos.hora_fin || '23:59:59'
      ]);
      return result[0].insertId;
    } catch (error) {
      console.error('Error al crear descuento fijo:', error);
      throw error;
    }
  }

  // ===== COMBOS =====
  async crearCombo(nombre, items, precioTotal, datos) {
    await this.db.executeSql('BEGIN TRANSACTION');
    
    try {
      // Crear la promoción tipo combo
      const comboQuery = `
        INSERT INTO promociones 
        (nombre, tipo, precio_promocional, fecha_inicio, fecha_fin)
        VALUES (?, 'combo', ?, ?, ?)
      `;
      
      const result = await this.db.executeSql(comboQuery, [
        nombre,
        precioTotal,
        datos.fecha_inicio,
        datos.fecha_fin
      ]);
      
      const comboId = result[0].insertId;
      
      // Agregar los cócteles al combo
      for (const item of items) {
        await this.db.executeSql(
          `INSERT INTO combo_items (combo_id, cocktail_id, cantidad)
           VALUES (?, ?, ?)`,
          [comboId, item.cocktail_id, item.cantidad || 1]
        );
      }
      
      await this.db.executeSql('COMMIT');
      return comboId;
      
    } catch (error) {
      await this.db.executeSql('ROLLBACK');
      console.error('Error al crear combo:', error);
      throw error;
    }
  }

  async obtenerComboDetalles(comboId) {
    const query = `
      SELECT 
        ci.*,
        c.nombre as cocktail_nombre,
        c.precio_venta,
        c.categoria
      FROM combo_items ci
      JOIN cocktails c ON ci.cocktail_id = c.id
      WHERE ci.combo_id = ?
    `;
    
    try {
      const result = await this.db.executeSql(query, [comboId]);
      const rows = result[0].rows;
      const items = [];
      
      for (let i = 0; i < rows.length; i++) {
        items.push(rows.item(i));
      }
      
      return items;
    } catch (error) {
      console.error('Error al obtener combo:', error);
      throw error;
    }
  }

  // ===== CONSULTA DE PROMOCIONES =====
  async obtenerPromocionesActivas() {
    const ahora = new Date();
    const diaSemana = ahora.getDay() + 1;
    const horaActual = ahora.toTimeString().split(' ')[0];
    
    const query = `
      SELECT 
        p.*,
        c.nombre as cocktail_nombre,
        c.precio_venta as precio_normal,
        c.imagen
      FROM promociones p
      LEFT JOIN cocktails c ON p.cocktail_id = c.id
      WHERE p.activo = 1 
        AND p.estado = 'activa'
        AND datetime('now') BETWEEN p.fecha_inicio AND p.fecha_fin
        AND (p.dias_semana LIKE '%' || ? || '%' OR p.dias_semana IS NULL)
        AND (? BETWEEN p.hora_inicio AND p.hora_fin OR p.hora_inicio = '00:00:00')
      ORDER BY 
        CASE 
          WHEN p.tipo = '2por_precio' THEN 1
          WHEN p.tipo = '2x1' THEN 2
          WHEN p.tipo = 'combo' THEN 3
          ELSE 4
        END,
        p.fecha_inicio DESC
    `;
    
    try {
      const result = await this.db.executeSql(query, [diaSemana, horaActual]);
      const rows = result[0].rows;
      const promociones = [];
      
      for (let i = 0; i < rows.length; i++) {
        promociones.push(rows.item(i));
      }
      
      return promociones;
    } catch (error) {
      console.error('Error al obtener promociones activas:', error);
      throw error;
    }
  }

  async obtenerPromocionesParaCocktail(cocktailId) {
    const ahora = new Date();
    const diaSemana = ahora.getDay() + 1;
    const horaActual = ahora.toTimeString().split(' ')[0];
    
    const query = `
      SELECT 
        p.*,
        CASE 
          WHEN p.cocktail_id IS NULL THEN 'todos'
          ELSE 'especifico'
        END as alcance
      FROM promociones p
      WHERE p.activo = 1 
        AND p.estado = 'activa'
        AND datetime('now') BETWEEN p.fecha_inicio AND p.fecha_fin
        AND (p.cocktail_id = ? OR p.cocktail_id IS NULL)
        AND (p.dias_semana LIKE '%' || ? || '%' OR p.dias_semana IS NULL)
        AND (? BETWEEN p.hora_inicio AND p.hora_fin OR p.hora_inicio = '00:00:00')
      ORDER BY 
        CASE p.tipo 
          WHEN '2por_precio' THEN 1
          WHEN '2x1' THEN 2
          WHEN 'descuento_porcentaje' THEN 3
          WHEN 'descuento_fijo' THEN 4
          WHEN 'combo' THEN 5
          ELSE 6
        END
    `;
    
    try {
      const result = await this.db.executeSql(query, [cocktailId, diaSemana, horaActual]);
      const rows = result[0].rows;
      const promociones = [];
      
      for (let i = 0; i < rows.length; i++) {
        promociones.push(rows.item(i));
      }
      
      return promociones;
    } catch (error) {
      console.error('Error al obtener promociones para cóctel:', error);
      throw error;
    }
  }

  // ===== CÁLCULO DE PRECIOS CON PROMOCIONES =====
  async calcularPrecioConPromocion(cocktailId, cantidad, precioNormal = null) {
    try {
      if (!precioNormal) {
        precioNormal = await this.obtenerPrecioCocktail(cocktailId);
      }
      
      const promociones = await this.obtenerPromocionesParaCocktail(cocktailId);
      
      let mejorPrecio = precioNormal * cantidad;
      let mejorPromocion = null;
      let descuentoAplicado = 0;
      let cantidadPromocion = cantidad;
      
      for (const promo of promociones) {
        let precioConPromo = 0;
        let cantidadAplicable = cantidad;
        
        switch(promo.tipo) {
          case '2x1':
            if (cantidad >= promo.cantidad_requerida) {
              const grupos = Math.floor(cantidad / promo.cantidad_requerida);
              const pagados = grupos * promo.cantidad_pagada;
              const individuales = cantidad % promo.cantidad_requerida;
              precioConPromo = (pagados * precioNormal) + (individuales * precioNormal);
              cantidadPromocion = grupos;
            }
            break;
            
          case '2por_precio':
            if (cantidad >= promo.cantidad_requerida) {
              const pares = Math.floor(cantidad / promo.cantidad_requerida);
              const individuales = cantidad % promo.cantidad_requerida;
              precioConPromo = (pares * promo.precio_promocional) + (individuales * precioNormal);
              cantidadPromocion = pares;
            }
            break;
            
          case 'descuento_porcentaje':
            precioConPromo = (precioNormal * cantidad) * (1 - (promo.descuento_porcentaje / 100));
            break;
            
          case 'descuento_fijo':
            precioConPromo = Math.max(0, (precioNormal * cantidad) - (promo.descuento_monto * cantidad));
            break;
            
          default:
            continue;
        }
        
        // Solo considerar si es mejor precio
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
        cantidad_promocion: cantidadPromocion,
        ahorro_porcentaje: mejorPromocion ? 
          ((descuentoAplicado / (precioNormal * cantidad)) * 100).toFixed(1) : 0,
        ahorro_unitario: mejorPromocion ? 
          (descuentoAplicado / cantidad).toFixed(2) : 0
      };
      
    } catch (error) {
      console.error('Error al calcular precio con promoción:', error);
      throw error;
    }
  }

  async obtenerPrecioCocktail(cocktailId) {
    const query = `SELECT precio_venta FROM cocktails WHERE id = ?`;
    
    try {
      const result = await this.db.executeSql(query, [cocktailId]);
      if (result[0].rows.length > 0) {
        return result[0].rows.item(0).precio_venta;
      }
      return 0;
    } catch (error) {
      console.error('Error al obtener precio:', error);
      throw error;
    }
  }

  // ===== APLICAR PROMOCIONES EN VENTAS =====
  async aplicarPromocionesEnVenta(ventaId, itemsConPromociones) {
    try {
      for (const item of itemsConPromociones) {
        if (item.promocion_aplicada) {
          await this.db.executeSql(
            `INSERT INTO venta_promociones 
             (venta_id, promocion_id, cocktail_id, cantidad, descuento_aplicado)
             VALUES (?, ?, ?, ?, ?)`,
            [
              ventaId,
              item.promocion_aplicada.id,
              item.cocktail_id,
              item.cantidad_promocion || item.cantidad,
              item.descuento_aplicado
            ]
          );
        }
      }
      return true;
    } catch (error) {
      console.error('Error al aplicar promociones en venta:', error);
      throw error;
    }
  }

  // ===== GESTIÓN DE PROMOCIONES =====
  async actualizarPromocion(promocionId, datos) {
    const campos = [];
    const valores = [];
    
    if (datos.nombre !== undefined) {
      campos.push('nombre = ?');
      valores.push(datos.nombre);
    }
    if (datos.fecha_fin !== undefined) {
      campos.push('fecha_fin = ?');
      valores.push(datos.fecha_fin);
    }
    if (datos.activo !== undefined) {
      campos.push('activo = ?');
      valores.push(datos.activo);
    }
    if (datos.estado !== undefined) {
      campos.push('estado = ?');
      valores.push(datos.estado);
    }
    
    if (campos.length === 0) return false;
    
    valores.push(promocionId);
    
    const query = `
      UPDATE promociones 
      SET ${campos.join(', ')}
      WHERE id = ?
    `;
    
    try {
      await this.db.executeSql(query, valores);
      return true;
    } catch (error) {
      console.error('Error al actualizar promoción:', error);
      throw error;
    }
  }

  async desactivarPromocion(promocionId) {
    const query = `UPDATE promociones SET activo = 0 WHERE id = ?`;
    
    try {
      await this.db.executeSql(query, [promocionId]);
      return true;
    } catch (error) {
      console.error('Error al desactivar promoción:', error);
      throw error;
    }
  }

  // ===== REPORTES DE PROMOCIONES =====
  async obtenerEstadisticasPromociones(fechaInicio, fechaFin) {
    const query = `
      SELECT 
        p.id,
        p.nombre,
        p.tipo,
        c.nombre as cocktail_nombre,
        COUNT(vp.id) as veces_aplicada,
        SUM(vp.descuento_aplicado) as descuento_total,
        SUM(vp.cantidad) as cantidad_vendida_promocion,
        AVG(vp.descuento_aplicado) as descuento_promedio
      FROM promociones p
      LEFT JOIN venta_promociones vp ON p.id = vp.promocion_id
      LEFT JOIN cocktails c ON p.cocktail_id = c.id
      WHERE vp.created_at BETWEEN ? AND ?
      GROUP BY p.id
      ORDER BY veces_aplicada DESC
    `;
    
    try {
      const result = await this.db.executeSql(query, [fechaInicio, fechaFin]);
      const rows = result[0].rows;
      const estadisticas = [];
      
      for (let i = 0; i < rows.length; i++) {
        estadisticas.push(rows.item(i));
      }
      
      return estadisticas;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  async obtenerPromocionesExpiradas() {
    const query = `
      SELECT 
        p.*,
        c.nombre as cocktail_nombre,
        CASE 
          WHEN datetime('now') > p.fecha_fin THEN 'expirada'
          WHEN p.activo = 0 THEN 'inactiva'
          ELSE 'activa'
        END as estado_actual
      FROM promociones p
      LEFT JOIN cocktails c ON p.cocktail_id = c.id
      WHERE datetime('now') > p.fecha_fin OR p.activo = 0
      ORDER BY p.fecha_fin DESC
    `;
    
    try {
      const result = await this.db.executeSql(query);
      const rows = result[0].rows;
      const promociones = [];
      
      for (let i = 0; i < rows.length; i++) {
        promociones.push(rows.item(i));
      }
      
      return promociones;
    } catch (error) {
      console.error('Error al obtener promociones expiradas:', error);
      throw error;
    }
  }

  // ===== CÁLCULO DE EFECTIVIDAD =====
  async calcularEfectividadPromocion(promocionId) {
    const query = `
      SELECT 
        COUNT(vp.id) as total_aplicaciones,
        SUM(vp.descuento_aplicado) as descuento_total,
        COUNT(DISTINCT DATE(vp.created_at)) as dias_con_aplicacion,
        MIN(vp.created_at) as primera_aplicacion,
        MAX(vp.created_at) as ultima_aplicacion
      FROM venta_promociones vp
      WHERE vp.promocion_id = ?
    `;
    
    try {
      const result = await this.db.executeSql(query, [promocionId]);
      if (result[0].rows.length > 0) {
        const datos = result[0].rows.item(0);
        
        // Calcular efectividad
        const ahora = new Date();
        const primera = new Date(datos.primera_aplicacion);
        const diasTranscurridos = Math.max(1, Math.floor((ahora - primera) / (1000 * 60 * 60 * 24)));
        const aplicacionesPorDia = datos.total_aplicaciones / diasTranscurridos;
        
        return {
          ...datos,
          aplicaciones_por_dia: aplicacionesPorDia.toFixed(2),
          efectividad: aplicacionesPorDia > 5 ? 'alta' : aplicacionesPorDia > 2 ? 'media' : 'baja'
        };
      }
      return null;
    } catch (error) {
      console.error('Error al calcular efectividad:', error);
      throw error;
    }
  }
}

export default new PromotionOperations();