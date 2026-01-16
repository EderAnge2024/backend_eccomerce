import pool from "../../db.js";
import { 
  reservarStock, 
  liberarStockReservado, 
  confirmarDescuentoStock,
  checkStockDisponible 
} from "../models/productos/model.js";

// ============ GESTIÓN DE STOCK POR ESTADOS DE PEDIDO ============

/**
 * Procesar cambio de estado de pedido y gestionar stock accordingly
 * @param {number} id_pedido - ID del pedido
 * @param {string} nuevo_estado - Nuevo estado del pedido
 * @param {string} estado_anterior - Estado anterior del pedido
 */
export async function procesarCambioEstadoPedido(id_pedido, nuevo_estado, estado_anterior) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log(`🔄 Procesando cambio de estado: ${estado_anterior} → ${nuevo_estado} para pedido ${id_pedido}`);
    
    // Obtener productos del pedido
    const productosResult = await client.query(`
      SELECT pp.id_producto::integer as id_producto, pp.cantidad, p.title
      FROM pedido_producto pp
      JOIN productos p ON pp.id_producto::integer = p.id_producto
      WHERE pp.id_pedido = $1
    `, [id_pedido]);
    
    const productos = productosResult.rows;
    console.log(`📦 Productos en el pedido: ${productos.length}`);
    
    // Procesar según el cambio de estado
    for (const producto of productos) {
      const { id_producto, cantidad, title } = producto;
      
      // PENDIENTE → EN PROCESO: Reservar stock
      if (estado_anterior === 'Pendiente' && nuevo_estado === 'En proceso') {
        console.log(`🔒 Reservando stock: ${title} (${cantidad} unidades)`);
        
        const stockReservado = await reservarStock(id_producto, cantidad);
        if (!stockReservado) {
          throw new Error(`No se pudo reservar stock para ${title}. Stock insuficiente.`);
        }
        
        console.log(`✅ Stock reservado para ${title}: ${cantidad} unidades`);
      }
      
      // EN PROCESO → ENTREGADO: Confirmar descuento definitivo
      else if (estado_anterior === 'En proceso' && nuevo_estado === 'Entregado') {
        console.log(`✅ Confirmando descuento definitivo: ${title} (${cantidad} unidades)`);
        
        const stockDescontado = await confirmarDescuentoStock(id_producto, cantidad);
        if (!stockDescontado) {
          throw new Error(`No se pudo confirmar descuento para ${title}. Stock insuficiente.`);
        }
        
        console.log(`✅ Stock descontado definitivamente para ${title}: ${cantidad} unidades`);
      }
      
      // EN PROCESO → PENDIENTE: Liberar stock reservado
      else if (estado_anterior === 'En proceso' && nuevo_estado === 'Pendiente') {
        console.log(`🔓 Liberando stock reservado: ${title} (${cantidad} unidades)`);
        
        const stockLiberado = await liberarStockReservado(id_producto, cantidad);
        if (!stockLiberado) {
          console.warn(`⚠️ No se pudo liberar stock para ${title}`);
        } else {
          console.log(`✅ Stock liberado para ${title}: ${cantidad} unidades`);
        }
      }
      
      // ENTREGADO → EN PROCESO: Restaurar stock y reservar
      else if (estado_anterior === 'Entregado' && nuevo_estado === 'En proceso') {
        console.log(`🔄 Restaurando y reservando stock: ${title} (${cantidad} unidades)`);
        
        // Primero restaurar el stock
        await client.query(
          `UPDATE productos SET stock = stock + $1 WHERE id_producto = $2`,
          [cantidad, id_producto]
        );
        
        // Luego reservar
        const stockReservado = await reservarStock(id_producto, cantidad);
        if (!stockReservado) {
          throw new Error(`No se pudo reservar stock restaurado para ${title}`);
        }
        
        console.log(`✅ Stock restaurado y reservado para ${title}: ${cantidad} unidades`);
      }
      
      // Otros casos: solo log
      else {
        console.log(`ℹ️ Sin cambios de stock para ${title} (${estado_anterior} → ${nuevo_estado})`);
      }
    }
    
    await client.query('COMMIT');
    
    return {
      success: true,
      message: `Stock actualizado correctamente para cambio de estado: ${estado_anterior} → ${nuevo_estado}`,
      productos_procesados: productos.length
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error procesando cambio de estado:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Controller para cambio de estado de pedido con gestión de stock
 */
export async function cambiarEstadoPedidoConStock(req, res) {
  const { id_pedido } = req.params;
  const { nuevo_estado } = req.body;
  
  const estadosValidos = ['Pendiente', 'En proceso', 'Entregado'];
  if (!estadosValidos.includes(nuevo_estado)) {
    return res.status(400).json({
      success: false,
      message: `Estado inválido. Debe ser: ${estadosValidos.join(', ')}`
    });
  }
  
  try {
    // Obtener estado actual del pedido
    const pedidoResult = await pool.query(
      'SELECT estado FROM pedidos WHERE id_pedido = $1',
      [id_pedido]
    );
    
    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }
    
    const estado_anterior = pedidoResult.rows[0].estado;
    
    if (estado_anterior === nuevo_estado) {
      return res.status(400).json({
        success: false,
        message: `El pedido ya está en estado: ${nuevo_estado}`
      });
    }
    
    // Procesar cambio de stock
    const stockResult = await procesarCambioEstadoPedido(id_pedido, nuevo_estado, estado_anterior);
    
    // Actualizar estado del pedido
    const updateResult = await pool.query(
      'UPDATE pedidos SET estado = $1 WHERE id_pedido = $2 RETURNING *',
      [nuevo_estado, id_pedido]
    );
    
    res.json({
      success: true,
      message: `Estado actualizado: ${estado_anterior} → ${nuevo_estado}`,
      pedido: updateResult.rows[0],
      stock_info: stockResult
    });
    
  } catch (error) {
    console.error('❌ Error en cambiarEstadoPedidoConStock:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error al cambiar estado del pedido'
    });
  }
}

/**
 * Obtener resumen de stock de un pedido
 */
export async function getResumenStockPedido(req, res) {
  const { id_pedido } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT 
        pp.id_producto::integer as id_producto,
        pp.cantidad,
        p.title,
        p.stock,
        p.stock_reservado,
        (p.stock - p.stock_reservado) as stock_disponible,
        ped.estado as estado_pedido
      FROM pedido_producto pp
      JOIN productos p ON pp.id_producto::integer = p.id_producto
      JOIN pedidos ped ON pp.id_pedido = ped.id_pedido
      WHERE pp.id_pedido = $1
    `, [id_pedido]);
    
    res.json({
      success: true,
      pedido_id: id_pedido,
      productos: result.rows
    });
    
  } catch (error) {
    console.error('❌ Error en getResumenStockPedido:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}