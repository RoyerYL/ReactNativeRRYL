import SimpleDatabase from './simpleDatabase';

class SimpleOperations {
    constructor() {
        this.db = SimpleDatabase;
        this.PRECIO_NORMAL = 3500;
        this.PRECIO_OFERTA_2 = 6000;
    }

    async init() {
        return await this.db.init();
    }

    // ===== CÓCTELES =====
    async obtenerCocktails() {
        try {
            const cocktails = await this.db.getCocktails();
            return cocktails.map(cocktail => ({
                ...cocktail,
                precio1: cocktail.precio1 || cocktail.precio || 3500,
                precio2: cocktail.precio2 || cocktail.precio || 3500,
                activar_precio2: cocktail.activar_precio2 !== undefined ? cocktail.activar_precio2 : false
            }));
        } catch (error) {
            console.error('Error obteniendo cócteles:', error);
            return [];
        }
    }

    async obtenerCocktailPorId(id) {
        try {
            const cocktail = await this.db.getCocktailById(id);
            if (cocktail) {
                return {
                    ...cocktail,
                    precio1: cocktail.precio1 || cocktail.precio || 3500,
                    precio2: cocktail.precio2 || cocktail.precio || 3500,
                    activar_precio2: cocktail.activar_precio2 !== undefined ? cocktail.activar_precio2 : false
                };
            }
            return null;
        } catch (error) {
            console.error('Error obteniendo cóctel:', error);
            return null;
        }
    }

    async actualizarPreciosCocktail(id, datos) {
        try {
            return await this.db.updateCocktail(id, {
                precio1: datos.precio1,
                precio2: datos.precio2,
                activar_precio2: datos.activar_precio2
            });
        } catch (error) {
            console.error('Error actualizando precios:', error);
            return false;
        }
    }

    // ===== CÁLCULO DE PRECIOS CON SISTEMA DUAL =====
    async calcularPrecioConSistemaDual(cocktailId, cantidad, usarPrecio2 = false) {
        try {
            const cocktail = await this.obtenerCocktailPorId(cocktailId);
            if (!cocktail) {
                throw new Error('Cóctel no encontrado');
            }

            let precioBase;
            let usandoPrecio2 = false;
            
            if (usarPrecio2 && cocktail.activar_precio2) {
                precioBase = cocktail.precio2;
                usandoPrecio2 = true;
            } else {
                precioBase = cocktail.precio1;
            }

            const precioNormal = precioBase * cantidad;

            // Calcular promociones
            const promociones = await this.obtenerPromocionesParaCocktail(cocktailId);
            const calculoPromocion = await this.db.calcularPrecioConPromocion(cocktailId, cantidad, precioBase);

            return {
                cocktail_id: cocktailId,
                cocktail_nombre: cocktail.nombre,
                cantidad: cantidad,
                
                // Precios base
                precio_base_1: cocktail.precio1,
                precio_base_2: cocktail.precio2,
                precio_base_usado: precioBase,
                
                // Resultados
                precio_total_normal: precioNormal,
                precio_final: calculoPromocion.precio_con_promocion,
                descuento_aplicado: calculoPromocion.descuento_aplicado,
                
                // Información del sistema usado
                usando_precio2: usandoPrecio2,
                usando_promocion: !!calculoPromocion.promocion_aplicada,
                promocion_aplicada: calculoPromocion.promocion_aplicada,
                
                // Desglose
                precio_unitario_final: calculoPromocion.precio_con_promocion / cantidad,
                ahorro_porcentaje: calculoPromocion.ahorro_porcentaje,
                
                // Para mostrar en UI
                etiqueta_precio: usandoPrecio2 ? 'Precio 2' : 'Precio 1',
                tiene_precio2: cocktail.activar_precio2,
                puede_usar_precio2: cocktail.activar_precio2
            };
            
        } catch (error) {
            console.error('Error calculando precio dual:', error);
            throw error;
        }
    }

    // ===== FUNCIONES PARA VENTAS CON SISTEMA DUAL =====
    async calcularTotalesVentaConSistemaDual(itemsVenta) {
        try {
            let totalPrecio1 = 0;
            let totalPrecio2 = 0;
            let totalFinal = 0;
            let descuentoTotal = 0;
            let itemsDetallados = [];
            let usandoPrecio2Count = 0;

            for (const item of itemsVenta) {
                const cocktail = await this.obtenerCocktailPorId(item.cocktailId);
                if (!cocktail) continue;

                const usarPrecio2 = item.usarPrecio2 && cocktail.activar_precio2;
                const calculo = await this.calcularPrecioConSistemaDual(
                    item.cocktailId, 
                    item.cantidad, 
                    usarPrecio2
                );

                itemsDetallados.push(calculo);

                if (usarPrecio2) {
                    totalPrecio2 += calculo.precio_final;
                    usandoPrecio2Count++;
                } else {
                    totalPrecio1 += calculo.precio_final;
                }

                totalFinal += calculo.precio_final;
                descuentoTotal += calculo.descuento_aplicado;
            }

            return {
                // Totales por tipo de precio
                total_precio1: totalPrecio1,
                total_precio2: totalPrecio2,
                total_final: totalFinal,
                descuento_total: descuentoTotal,
                
                // Estadísticas
                cantidad_items: itemsVenta.length,
                usando_precio2_count: usandoPrecio2Count,
                porcentaje_precio2: itemsVenta.length > 0 ? 
                    (usandoPrecio2Count / itemsVenta.length * 100).toFixed(1) : 0,
                
                // Desglose para facturación
                subtotal: totalFinal + descuentoTotal,
                total_con_descuento: totalFinal,
                
                // Items detallados
                items: itemsDetallados
            };
            
        } catch (error) {
            console.error('Error calculando totales:', error);
            throw error;
        }
    }

    // ===== GESTIÓN DE PRECIOS DUALES =====
    async activarPrecio2ParaTodos(activar = true) {
        try {
            const cocktails = await this.obtenerCocktails();
            let actualizados = 0;
            
            for (const cocktail of cocktails) {
                await this.db.updateCocktail(cocktail.id, {
                    activar_precio2: activar
                });
                actualizados++;
            }
            
            return actualizados;
        } catch (error) {
            console.error('Error activando precio 2:', error);
            throw error;
        }
    }

    async copiarPrecio1aPrecio2() {
        try {
            const cocktails = await this.obtenerCocktails();
            let actualizados = 0;
            
            for (const cocktail of cocktails) {
                await this.db.updateCocktail(cocktail.id, {
                    precio2: cocktail.precio1 || cocktail.precio
                });
                actualizados++;
            }
            
            return actualizados;
        } catch (error) {
            console.error('Error copiando precios:', error);
            throw error;
        }
    }

    async aplicarPorcentajePrecio2(porcentaje) {
        try {
            const cocktails = await this.obtenerCocktails();
            let actualizados = 0;
            const factor = 1 + (porcentaje / 100);
            
            for (const cocktail of cocktails) {
                const precioActual = cocktail.precio1 || cocktail.precio || 3500;
                const nuevoPrecio2 = Math.round(precioActual * factor);
                
                await this.db.updateCocktail(cocktail.id, {
                    precio2: nuevoPrecio2,
                    activar_precio2: true
                });
                actualizados++;
            }
            
            return {
                actualizados,
                porcentaje,
                mensaje: `Precio 2 actualizado a ${porcentaje > 0 ? '+' : ''}${porcentaje}% del Precio 1`
            };
        } catch (error) {
            console.error('Error aplicando porcentaje:', error);
            throw error;
        }
    }

    // ===== VENTAS =====
    async registrarVentaCocktail(venta) {
        try {
            return await this.db.registrarVenta(venta);
        } catch (error) {
            console.error('Error registrando venta:', error);
            throw error;
        }
    }

    async obtenerVentasPorFecha(inicio, fin) {
        try {
            return await this.db.getVentasPorFecha(inicio, fin);
        } catch (error) {
            console.error('Error obteniendo ventas:', error);
            return [];
        }
    }

    // ===== PROMOCIONES =====
    async obtenerPromocionesActivas() {
        try {
            return await this.db.getPromocionesActivas();
        } catch (error) {
            console.error('Error obteniendo promociones:', error);
            return [];
        }
    }

    async obtenerPromocionesParaCocktail(cocktailId) {
        try {
            return await this.db.getPromocionesForCocktail(cocktailId);
        } catch (error) {
            console.error('Error obteniendo promociones para cóctel:', error);
            return [];
        }
    }

    async calcularPrecioConPromocion(cocktailId, cantidad, precioNormal) {
        try {
            return await this.db.calcularPrecioConPromocion(cocktailId, cantidad, precioNormal);
        } catch (error) {
            console.error('Error calculando precio:', error);
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

    async crearPromocion2porPrecio(cocktailId, precioPromocional, datos) {
        try {
            const nuevaPromo = {
                cocktailId: cocktailId,
                nombre: datos.nombre || `2 por $${precioPromocional}`,
                tipo: '2por_precio',
                precio_promocional: precioPromocional,
                cantidad_requerida: 2,
                fecha_inicio: datos.fecha_inicio || new Date().toISOString(),
                fecha_fin: datos.fecha_fin || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                activa: true
            };

            return await this.db.addPromocion(nuevaPromo);
        } catch (error) {
            console.error('Error creando promoción:', error);
            throw error;
        }
    }

    async crearPromocion2x1(cocktailId, datos) {
        try {
            const nuevaPromo = {
                cocktailId: cocktailId,
                nombre: datos.nombre || 'Promoción 2x1',
                tipo: '2x1',
                cantidad_requerida: 2,
                cantidad_pagada: 1,
                fecha_inicio: datos.fecha_inicio || new Date().toISOString(),
                fecha_fin: datos.fecha_fin || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                activa: true
            };

            return await this.db.addPromocion(nuevaPromo);
        } catch (error) {
            console.error('Error creando promoción 2x1:', error);
            throw error;
        }
    }

    async crearPromocionDescuentoPorcentaje(cocktailId, porcentaje, datos) {
        try {
            const nuevaPromo = {
                cocktailId: cocktailId,
                nombre: datos.nombre || `${porcentaje}% de descuento`,
                tipo: 'descuento_porcentaje',
                descuento_porcentaje: porcentaje,
                fecha_inicio: datos.fecha_inicio || new Date().toISOString(),
                fecha_fin: datos.fecha_fin || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                activa: true
            };

            return await this.db.addPromocion(nuevaPromo);
        } catch (error) {
            console.error('Error creando descuento:', error);
            throw error;
        }
    }

    // ===== CAJA =====
    async obtenerCajaAbierta() {
        try {
            const estado = await this.db.getEstadoCaja();
            return estado.abierta ? estado : null;
        } catch (error) {
            console.error('Error obteniendo caja:', error);
            return null;
        }
    }

    async abrirCajaDia(montoApertura) {
        try {
            await this.db.abrirCaja(montoApertura);
            return true;
        } catch (error) {
            console.error('Error abriendo caja:', error);
            throw error;
        }
    }

    async cerrarCajaDia(datosCierre) {
        try {
            await this.db.cerrarCaja(
                datosCierre.monto_cierre,
                datosCierre.observaciones
            );
            return true;
        } catch (error) {
            console.error('Error cerrando caja:', error);
            throw error;
        }
    }

    async obtenerHistorialCaja() {
        try {
            return await this.db.getHistorialCaja();
        } catch (error) {
            console.error('Error obteniendo historial de caja:', error);
            return [];
        }
    }

    async registrarExtraccion(extraccion) {
        try {
            return await this.db.registrarExtraccion(extraccion);
        } catch (error) {
            console.error('Error registrando extracción:', error);
            throw error;
        }
    }

    async obtenerExtracciones() {
        try {
            return await this.db.getExtracciones();
        } catch (error) {
            console.error('Error obteniendo extracciones:', error);
            return [];
        }
    }

    // ===== ESTADÍSTICAS =====
    async obtenerEstadisticas() {
        try {
            return await this.db.getEstadisticas();
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return {
                total_cocktails: 0,
                ventas_hoy: 0,
                monto_hoy: 0,
                caja_abierta: false,
                promociones_activas: 0
            };
        }
    }

    async obtenerEstadisticasVentas() {
        try {
            return await this.db.getEstadisticasVentas();
        } catch (error) {
            console.error('Error obteniendo estadísticas de ventas:', error);
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

    // ===== CONFIGURACIÓN =====
    async getConfiguracionPrecios() {
        return {
            precio_normal: this.PRECIO_NORMAL,
            precio_oferta_2: this.PRECIO_OFERTA_2,
            descripcion_oferta: "2 cócteles por $6000",
            ahorro_oferta: (this.PRECIO_NORMAL * 2 - this.PRECIO_OFERTA_2),
            porcentaje_ahorro: (((this.PRECIO_NORMAL * 2 - this.PRECIO_OFERTA_2) / (this.PRECIO_NORMAL * 2)) * 100).toFixed(1) + "%"
        };
    }

    async resetDatabase() {
        try {
            return await this.db.resetDatabase();
        } catch (error) {
            console.error('Error reseteando base de datos:', error);
            throw error;
        }
    }

    // ===== MÉTODOS DE COMPATIBILIDAD =====
    async calcularPrecioConOferta(cocktailId, cantidad, precioNormal) {
        if (cantidad < 2) {
            return {
                precio_normal: precioNormal,
                cantidad: cantidad,
                precio_total_normal: precioNormal * cantidad,
                precio_con_oferta: precioNormal * cantidad,
                oferta_aplicada: null,
                descuento_aplicado: 0,
                ahorro: 0
            };
        }

        const pares = Math.floor(cantidad / 2);
        const individuales = cantidad % 2;
        
        const precioConOferta = (pares * this.PRECIO_OFERTA_2) + (individuales * precioNormal);
        const precioNormalTotal = precioNormal * cantidad;
        const descuento = precioNormalTotal - precioConOferta;
        
        return {
            precio_normal: precioNormal,
            cantidad: cantidad,
            precio_total_normal: precioNormalTotal,
            precio_con_oferta: precioConOferta,
            oferta_aplicada: cantidad >= 2 ? '2x6000' : null,
            descuento_aplicado: descuento,
            ahorro: descuento,
            ahorro_porcentaje: cantidad >= 2 ? ((descuento / precioNormalTotal) * 100).toFixed(1) : 0,
            pares: pares,
            individuales: individuales,
            precio_por_par: this.PRECIO_OFERTA_2,
            mensaje: cantidad >= 2 ? 
                `Oferta aplicada: ${pares} par(es) x $${this.PRECIO_OFERTA_2} + ${individuales} individual(es) x $${precioNormal}` : 
                'Sin oferta'
        };
    }
}

export default new SimpleOperations();