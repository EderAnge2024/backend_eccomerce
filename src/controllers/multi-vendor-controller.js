import pool from "../../db.js";
import { 
  procesarCompraMultiVendedor, 
  getPedidosByVendedor, 
  getResumenPedidoMaestro,
  agruparProductosPorVendedor 
} from "../models/multiple-vender/multi-vendor-model.js";

// ============ CONTROLADORES PARA PEDIDOS MULTI-VENDEDOR ============

/**
 * Procesar compra con división automática por vendedor
 * POST /api/pedidos/multi-vendor
 * Body: { id_usuario, productos, id_ubicacion }
 */
export async function procesarCompraMultiVendedorController(req, res) {
  const { id_usuario, productos, id_ubicacion } = req.body;
  
  console.log('🛒 Procesando compra multi-vendedor:', { 
    id_usuario, 
    productos: productos?.length, 
    id_ubicacion 
  });
  
  if (!id_usuario || !productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: "id_usuario y productos (array no vacío) son obligatorios" 
    });
  }

  try {
    const resultado = await procesarCompraMultiVendedor(id_usuario, productos, id_ubicacion);
    
    console.log('✅ Compra procesada exitosamente:', {
      vendedores: resultado.vendedores_involucrados,
      total: resultado.total_general
    });
    
    res.json(resultado);
  } catch (err) {
    console.error('❌ Error procesando compra multi-vendedor:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      message: 'Error al procesar la compra'
    });
  }
}

/**
 * Obtener pedidos de un vendedor específico
 * GET /api/pedidos/vendedor/:id_vendedor
 */
export async function getPedidosByVendedorController(req, res) {
  const { id_vendedor } = req.params;
  
  console.log(`📦 Obteniendo pedidos para vendedor ID: ${id_vendedor}`);
  
  try {
    const pedidos = await getPedidosByVendedor(id_vendedor);
    
    console.log(`✅ Pedidos encontrados para vendedor: ${pedidos.length}`);
    
    res.json({ 
      success: true, 
      pedidos,
      total_pedidos: pedidos.length
    });
  } catch (err) {
    console.error('❌ Error obteniendo pedidos por vendedor:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
}

/**
 * Obtener resumen completo de un pedido maestro
 * GET /api/pedidos/maestro/:id_pedido_maestro
 */
export async function getResumenPedidoMaestroController(req, res) {
  const { id_pedido_maestro } = req.params;
  
  console.log(`📋 Obteniendo resumen de pedido maestro ID: ${id_pedido_maestro}`);
  
  try {
    const resumen = await getResumenPedidoMaestro(id_pedido_maestro);
    
    if (!resumen) {
      return res.status(404).json({ 
        success: false, 
        message: "Pedido maestro no encontrado" 
      });
    }
    
    console.log(`✅ Resumen obtenido - Sub-pedidos: ${resumen.sub_pedidos.length}`);
    
    res.json({ 
      success: true, 
      resumen 
    });
  } catch (err) {
    console.error('❌ Error obteniendo resumen de pedido maestro:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
}

/**
 * Preview de cómo se dividirá un carrito por vendedores (sin crear pedidos)
 * POST /api/pedidos/preview-division
 * Body: { productos }
 */
export async function previewDivisionPorVendedorController(req, res) {
  const { productos } = req.body;
  
  if (!productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: "productos (array no vacío) es obligatorio" 
    });
  }

  try {
    const gruposPorVendedor = await agruparProductosPorVendedor(productos);
    const vendedores = Object.keys(gruposPorVendedor);
    
    const preview = {
      total_vendedores: vendedores.length,
      es_pedido_compartido: vendedores.length > 1,
      total_general: Object.values(gruposPorVendedor)
        .reduce((sum, grupo) => sum + grupo.total, 0),
      division_por_vendedor: Object.entries(gruposPorVendedor).map(([vendedorId, grupo]) => ({
        vendedor_id: parseInt(vendedorId),
        vendedor_nombre: `${grupo.vendedor.nombre} ${grupo.vendedor.apellido}`,
        vendedor_correo: grupo.vendedor.correo,
        productos_count: grupo.productos.length,
        productos: grupo.productos.map(p => ({
          id: p.id,
          nombre: p.nombre,
          cantidad: p.cantidad || 1,
          precio_unitario: p.precio,
          subtotal: p.precio * (p.cantidad || 1)
        })),
        total_vendedor: grupo.total
      }))
    };
    
    res.json({ 
      success: true, 
      preview 
    });
  } catch (err) {
    console.error('❌ Error generando preview de división:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
}

/**
 * Obtener notificaciones de pedidos para un usuario
 * GET /api/pedidos/notificaciones/:id_usuario
 */
export async function getNotificacionesPedidosController(req, res) {
  const { id_usuario } = req.params;
  const { solo_no_leidas } = req.query;
  
  try {
    let query = `
      SELECT n.*, p.total, p.estado, p.fecha_pedido,
             u_cliente.nombre as cliente_nombre,
             u_cliente.apellido as cliente_apellido
      FROM pedido_notificaciones n
      LEFT JOIN pedidos p ON n.id_pedido = p.id_pedido
      LEFT JOIN usuarios u_cliente ON p.id_usuario = u_cliente.id_usuario
      WHERE n.id_usuario_destinatario = $1
    `;
    
    const params = [id_usuario];
    
    if (solo_no_leidas === 'true') {
      query += ' AND n.leida = false';
    }
    
    query += ' ORDER BY n.fecha_creacion DESC';
    
    const result = await pool.query(query, params);
    
    res.json({ 
      success: true, 
      notificaciones: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    console.error('❌ Error obteniendo notificaciones:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
}

/**
 * Marcar notificación como leída
 * PUT /api/pedidos/notificaciones/:id_notificacion/leer
 */
export async function marcarNotificacionLeidaController(req, res) {
  const { id_notificacion } = req.params;
  
  try {
    const result = await pool.query(
      `UPDATE pedido_notificaciones 
       SET leida = true 
       WHERE id_notificacion = $1 
       RETURNING *`,
      [id_notificacion]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Notificación no encontrada" 
      });
    }
    
    res.json({ 
      success: true, 
      notificacion: result.rows[0] 
    });
  } catch (err) {
    console.error('❌ Error marcando notificación como leída:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
}