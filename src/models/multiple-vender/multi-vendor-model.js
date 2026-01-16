import pool from "../../../db.js";
import { getProductoById, checkStockDisponible, reservarStock } from "../productos/model.js";

// ============ FUNCIONES PARA PEDIDOS MULTI-VENDEDOR ============

/**
 * Obtener información del vendedor de un producto por su ID
 * @param {string|number} id_producto - ID del producto (puede ser de API externa o BD local)
 * @returns {Object|null} Información del vendedor o null si es producto externo
 */
export async function getVendedorByProducto(id_producto) {
  try {
    // Intentar buscar en la base de datos local primero
    const producto = await getProductoById(id_producto);
    
    if (producto && producto.id_usuario) {
      // Es un producto de la BD local, obtener info del vendedor
      const result = await pool.query(
        `SELECT id_usuario, nombre, apellido, correo, rol 
         FROM usuarios 
         WHERE id_usuario = $1`,
        [producto.id_usuario]
      );
      
      return result.rows[0] || null;
    }
    
    // Si no se encuentra en BD local, es un producto de API externa
    // En este caso, asignamos al administrador general como vendedor por defecto
    const adminResult = await pool.query(
      `SELECT id_usuario, nombre, apellido, correo, rol 
       FROM usuarios 
       WHERE rol = 'administrador' AND es_super_admin = true 
       LIMIT 1`
    );
    
    return adminResult.rows[0] || null;
  } catch (error) {
    console.error('Error obteniendo vendedor por producto:', error);
    return null;
  }
}

/**
 * Agrupar productos del carrito por vendedor
 * @param {Array} productosCarrito - Array de productos del carrito
 * @returns {Object} Objeto agrupado por vendedor
 */
export async function agruparProductosPorVendedor(productosCarrito) {
  const gruposPorVendedor = {};
  
  for (const producto of productosCarrito) {
    const vendedor = await getVendedorByProducto(producto.id);
    
    if (!vendedor) {
      console.warn(`No se pudo determinar vendedor para producto ${producto.id}`);
      continue;
    }
    
    const vendedorId = vendedor.id_usuario;
    
    if (!gruposPorVendedor[vendedorId]) {
      gruposPorVendedor[vendedorId] = {
        vendedor: vendedor,
        productos: [],
        total: 0
      };
    }
    
    gruposPorVendedor[vendedorId].productos.push(producto);
    gruposPorVendedor[vendedorId].total += producto.precio * (producto.cantidad || 1);
  }
  
  return gruposPorVendedor;
}

/**
 * Crear pedido maestro (contenedor de sub-pedidos)
 * @param {number} id_usuario - ID del cliente
 * @param {number} total_general - Total de todos los sub-pedidos
 * @param {number} id_ubicacion - ID de la ubicación de envío
 * @param {boolean} es_compartido - Si tiene productos de múltiples vendedores
 * @returns {Object} Pedido maestro creado
 */
export async function createPedidoMaestro(id_usuario, total_general, id_ubicacion, es_compartido) {
  const result = await pool.query(
    `INSERT INTO pedidos (id_usuario, total, id_ubicacion, tipo_pedido, es_pedido_compartido) 
     VALUES ($1, $2, $3, 'maestro', $4) RETURNING *`,
    [id_usuario, total_general, id_ubicacion, es_compartido]
  );
  return result.rows[0];
}

/**
 * Crear sub-pedido para un vendedor específico
 * @param {number} id_usuario - ID del cliente
 * @param {number} id_vendedor - ID del vendedor
 * @param {number} total - Total del sub-pedido
 * @param {number} id_ubicacion - ID de la ubicación de envío
 * @param {number} id_pedido_maestro - ID del pedido maestro
 * @returns {Object} Sub-pedido creado
 */
export async function createSubPedido(id_usuario, id_vendedor, total, id_ubicacion, id_pedido_maestro) {
  const result = await pool.query(
    `INSERT INTO pedidos (id_usuario, id_vendedor, total, id_ubicacion, id_pedido_maestro, tipo_pedido) 
     VALUES ($1, $2, $3, $4, $5, 'sub_pedido') RETURNING *`,
    [id_usuario, id_vendedor, total, id_ubicacion, id_pedido_maestro]
  );
  return result.rows[0];
}

/**
 * Crear pedido simple (un solo vendedor)
 * @param {number} id_usuario - ID del cliente
 * @param {number} id_vendedor - ID del vendedor
 * @param {number} total - Total del pedido
 * @param {number} id_ubicacion - ID de la ubicación de envío
 * @returns {Object} Pedido simple creado
 */
export async function createPedidoSimple(id_usuario, id_vendedor, total, id_ubicacion) {
  const result = await pool.query(
    `INSERT INTO pedidos (id_usuario, id_vendedor, total, id_ubicacion, tipo_pedido) 
     VALUES ($1, $2, $3, $4, 'simple') RETURNING *`,
    [id_usuario, id_vendedor, total, id_ubicacion]
  );
  return result.rows[0];
}

/**
 * Crear notificación de pedido
 * @param {number} id_pedido - ID del pedido
 * @param {number} id_usuario_destinatario - ID del usuario que recibe la notificación
 * @param {string} tipo_notificacion - Tipo de notificación
 * @param {string} mensaje - Mensaje de la notificación
 * @returns {Object} Notificación creada
 */
export async function createNotificacionPedido(id_pedido, id_usuario_destinatario, tipo_notificacion, mensaje) {
  const result = await pool.query(
    `INSERT INTO pedido_notificaciones (id_pedido, id_usuario_destinatario, tipo_notificacion, mensaje) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [id_pedido, id_usuario_destinatario, tipo_notificacion, mensaje]
  );
  return result.rows[0];
}

/**
 * Obtener pedidos por vendedor (incluyendo sub-pedidos)
 * @param {number} id_vendedor - ID del vendedor
 * @returns {Array} Lista de pedidos del vendedor
 */
export async function getPedidosByVendedor(id_vendedor) {
  const result = await pool.query(`
    SELECT 
      p.*,
      u_cliente.nombre as cliente_nombre,
      u_cliente.apellido as cliente_apellido,
      u_cliente.correo as cliente_correo,
      ub.nombre as ubicacion_nombre,
      ub.direccion as ubicacion_direccion,
      ub.ciudad as ubicacion_ciudad,
      -- Información del pedido maestro si existe
      pm.id_pedido as pedido_maestro_id,
      pm.total as pedido_maestro_total,
      pm.es_pedido_compartido
    FROM pedidos p
    LEFT JOIN usuarios u_cliente ON p.id_usuario = u_cliente.id_usuario
    LEFT JOIN ubicacion ub ON p.id_ubicacion = ub.id_ubicacion
    LEFT JOIN pedidos pm ON p.id_pedido_maestro = pm.id_pedido
    WHERE p.id_vendedor = $1 
       OR (p.tipo_pedido = 'simple' AND p.id_vendedor = $1)
    ORDER BY p.fecha_pedido DESC
  `, [id_vendedor]);
  
  return result.rows;
}

/**
 * Obtener resumen de pedido maestro con sus sub-pedidos
 * @param {number} id_pedido_maestro - ID del pedido maestro
 * @returns {Object} Resumen completo del pedido
 */
export async function getResumenPedidoMaestro(id_pedido_maestro) {
  // Obtener pedido maestro
  const maestroResult = await pool.query(`
    SELECT p.*, u.nombre, u.apellido, u.correo,
           ub.nombre as ubicacion_nombre, ub.direccion as ubicacion_direccion
    FROM pedidos p
    LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
    LEFT JOIN ubicacion ub ON p.id_ubicacion = ub.id_ubicacion
    WHERE p.id_pedido = $1 AND p.tipo_pedido = 'maestro'
  `, [id_pedido_maestro]);
  
  if (maestroResult.rows.length === 0) {
    return null;
  }
  
  const pedidoMaestro = maestroResult.rows[0];
  
  // Obtener sub-pedidos
  const subPedidosResult = await pool.query(`
    SELECT p.*, 
           u_vendedor.nombre as vendedor_nombre,
           u_vendedor.apellido as vendedor_apellido,
           u_vendedor.correo as vendedor_correo
    FROM pedidos p
    LEFT JOIN usuarios u_vendedor ON p.id_vendedor = u_vendedor.id_usuario
    WHERE p.id_pedido_maestro = $1
    ORDER BY p.fecha_pedido ASC
  `, [id_pedido_maestro]);
  
  return {
    pedido_maestro: pedidoMaestro,
    sub_pedidos: subPedidosResult.rows
  };
}

/**
 * Procesar compra multi-vendedor
 * Esta es la función principal que maneja toda la lógica de división de pedidos
 * @param {number} id_usuario - ID del cliente
 * @param {Array} productosCarrito - Productos del carrito
 * @param {number} id_ubicacion - ID de la ubicación de envío
 * @returns {Object} Resultado del procesamiento
 */
export async function procesarCompraMultiVendedor(id_usuario, productosCarrito, id_ubicacion) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. VALIDAR STOCK DISPONIBLE ANTES DE PROCESAR
    console.log('🔍 Validando stock disponible de productos...');
    const stockErrors = [];
    
    for (const producto of productosCarrito) {
      const cantidad = producto.cantidad || 1;
      const stockCheck = await checkStockDisponible(producto.id, cantidad);
      
      if (!stockCheck.available) {
        stockErrors.push({
          producto_id: producto.id,
          producto_nombre: producto.nombre || `Producto ${producto.id}`,
          cantidad_solicitada: cantidad,
          stock_disponible: stockCheck.stock_disponible,
          stock_reservado: stockCheck.stock_reservado,
          mensaje: stockCheck.message
        });
      }
    }
    
    // Si hay errores de stock, abortar la transacción
    if (stockErrors.length > 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: 'stock_insuficiente',
        message: 'Stock disponible insuficiente para algunos productos',
        productos_sin_stock: stockErrors
      };
    }
    
    console.log('✅ Stock disponible validado correctamente');
    
    // 2. Agrupar productos por vendedor
    const gruposPorVendedor = await agruparProductosPorVendedor(productosCarrito);
    const vendedores = Object.keys(gruposPorVendedor);
    
    console.log(`🛒 Procesando compra para ${vendedores.length} vendedor(es)`);
    
    // 3. Calcular total general
    const totalGeneral = Object.values(gruposPorVendedor)
      .reduce((sum, grupo) => sum + grupo.total, 0);
    
    let pedidoMaestro = null;
    let subPedidos = [];
    let pedidoSimple = null;
    
    if (vendedores.length === 1) {
      // 4a. Un solo vendedor - crear pedido simple
      const vendedorId = vendedores[0];
      const grupo = gruposPorVendedor[vendedorId];
      
      pedidoSimple = await createPedidoSimple(
        id_usuario, 
        parseInt(vendedorId), 
        grupo.total, 
        id_ubicacion
      );
      
      // Crear productos del pedido (SIN reducir stock aún - estado Pendiente)
      for (const producto of grupo.productos) {
        const cantidad = producto.cantidad || 1;
        
        // Crear registro en pedido_producto
        await client.query(
          `INSERT INTO pedido_producto (id_pedido, id_producto, cantidad, precio) 
           VALUES ($1, $2, $3, $4)`,
          [pedidoSimple.id_pedido, producto.id, cantidad, producto.precio]
        );
        
        console.log(`📝 Producto agregado al pedido: ${producto.id}, cantidad: ${cantidad} (stock NO reducido - estado Pendiente)`);
      }
      
      // Notificar al vendedor
      await createNotificacionPedido(
        pedidoSimple.id_pedido,
        parseInt(vendedorId),
        'nuevo_pedido',
        `Nuevo pedido #${pedidoSimple.id_pedido} por $${grupo.total.toFixed(2)}`
      );
      
    } else {
      // 4b. Múltiples vendedores - crear pedido maestro y sub-pedidos
      pedidoMaestro = await createPedidoMaestro(
        id_usuario, 
        totalGeneral, 
        id_ubicacion, 
        true
      );
      
      // Crear sub-pedido para cada vendedor
      for (const vendedorId of vendedores) {
        const grupo = gruposPorVendedor[vendedorId];
        
        const subPedido = await createSubPedido(
          id_usuario,
          parseInt(vendedorId),
          grupo.total,
          id_ubicacion,
          pedidoMaestro.id_pedido
        );
        
        subPedidos.push({
          pedido: subPedido,
          vendedor: grupo.vendedor,
          productos: grupo.productos
        });
        
        // Crear productos del sub-pedido (SIN reducir stock aún - estado Pendiente)
        for (const producto of grupo.productos) {
          const cantidad = producto.cantidad || 1;
          
          // Crear registro en pedido_producto
          await client.query(
            `INSERT INTO pedido_producto (id_pedido, id_producto, cantidad, precio) 
             VALUES ($1, $2, $3, $4)`,
            [subPedido.id_pedido, producto.id, cantidad, producto.precio]
          );
          
          console.log(`📝 Producto agregado al sub-pedido: ${producto.id}, cantidad: ${cantidad} (stock NO reducido - estado Pendiente)`);
        }
        
        // Notificar al vendedor
        await createNotificacionPedido(
          subPedido.id_pedido,
          parseInt(vendedorId),
          'nuevo_pedido',
          `Nuevo pedido #${subPedido.id_pedido} por $${grupo.total.toFixed(2)} (parte del pedido compartido #${pedidoMaestro.id_pedido})`
        );
      }
      
      // Notificar al super admin sobre el pedido compartido
      const superAdminResult = await client.query(
        `SELECT id_usuario FROM usuarios WHERE es_super_admin = true LIMIT 1`
      );
      
      if (superAdminResult.rows.length > 0) {
        const vendedoresNombres = Object.values(gruposPorVendedor)
          .map(g => `${g.vendedor.nombre} ${g.vendedor.apellido}`)
          .join(', ');
          
        await createNotificacionPedido(
          pedidoMaestro.id_pedido,
          superAdminResult.rows[0].id_usuario,
          'pedido_compartido',
          `Pedido compartido #${pedidoMaestro.id_pedido} por $${totalGeneral.toFixed(2)} - Vendedores: ${vendedoresNombres}`
        );
      }
    }
    
    await client.query('COMMIT');
    
    return {
      success: true,
      message: vendedores.length === 1 ? 'Pedido creado exitosamente' : 'Pedido compartido creado exitosamente',
      pedido_maestro: pedidoMaestro,
      pedido_simple: pedidoSimple,
      sub_pedidos: subPedidos,
      total_general: totalGeneral,
      vendedores_involucrados: vendedores.length
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error procesando compra multi-vendedor:', error);
    throw error;
  } finally {
    client.release();
  }
}