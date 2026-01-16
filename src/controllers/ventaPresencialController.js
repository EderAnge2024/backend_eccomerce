// Controlador para ventas presenciales (Punto de Venta)

import pool from '../../db.js';
import { successResponse, errorResponse } from '../helpers/response.js';

// Buscar productos disponibles para venta presencial
export async function buscarProductos(req, res) {
  try {
    const { search = '', categoria = '', limit = 20, offset = 0 } = req.query;
    
    console.log(`🔍 Buscando productos: "${search}", categoría: "${categoria}"`);
    
    let query = `
      SELECT 
        p.id_producto,
        p.title,
        p.description,
        p.price,
        p.category,
        p.image,
        p.stock,
        p.stock_reservado,
        (p.stock - p.stock_reservado) as stock_disponible,
        u.nombre as vendedor_nombre,
        u.apellido as vendedor_apellido
      FROM productos p
      LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
      WHERE (p.stock - p.stock_reservado) > 0
    `;
    
    const params = [];
    let paramCount = 0;
    
    // Filtro por búsqueda
    if (search.trim()) {
      paramCount++;
      query += ` AND (LOWER(p.title) LIKE LOWER($${paramCount}) OR LOWER(p.description) LIKE LOWER($${paramCount}))`;
      params.push(`%${search.trim()}%`);
    }
    
    // Filtro por categoría
    if (categoria.trim()) {
      paramCount++;
      query += ` AND LOWER(p.category) = LOWER($${paramCount})`;
      params.push(categoria.trim());
    }
    
    query += ` ORDER BY p.title ASC`;
    
    // Paginación
    if (limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit));
    }
    
    if (offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(parseInt(offset));
    }
    
    const result = await pool.query(query, params);
    
    // También obtener categorías disponibles
    const categoriasResult = await pool.query(`
      SELECT DISTINCT category 
      FROM productos 
      WHERE category IS NOT NULL AND (stock - stock_reservado) > 0
      ORDER BY category
    `);
    
    console.log(`✅ Encontrados ${result.rows.length} productos disponibles`);
    
    return successResponse(res, {
      productos: result.rows,
      categorias: categoriasResult.rows.map(row => row.category),
      total: result.rows.length
    }, 'Productos obtenidos exitosamente');
    
  } catch (error) {
    console.error('❌ Error buscando productos:', error);
    return errorResponse(res, 'Error interno del servidor', 500, error);
  }
}

// Crear pedido presencial
export async function crearVentaPresencial(req, res) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      cliente_nombre,
      cliente_apellido = '',
      cliente_correo = '',
      cliente_telefono = '',
      cliente_direccion = '',
      productos = [],
      notas = ''
    } = req.body;
    
    console.log(`🛒 Creando venta presencial para: ${cliente_nombre} ${cliente_apellido}`);
    console.log(`📦 Productos: ${productos.length} items`);
    
    // Validaciones básicas
    if (!cliente_nombre || !cliente_nombre.trim()) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'El nombre del cliente es requerido', 400);
    }
    
    if (!productos || productos.length === 0) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Debe agregar al menos un producto', 400);
    }
    
    // Validar productos y stock
    let total = 0;
    const productosValidados = [];
    
    for (const item of productos) {
      const { id_producto, cantidad, precio_unitario } = item;
      
      if (!id_producto || !cantidad || cantidad <= 0) {
        await client.query('ROLLBACK');
        return errorResponse(res, 'Datos de producto inválidos', 400);
      }
      
      // Verificar stock disponible
      const stockResult = await client.query(`
        SELECT 
          id_producto, 
          title, 
          price,
          stock,
          stock_reservado,
          (stock - stock_reservado) as stock_disponible
        FROM productos 
        WHERE id_producto = $1
      `, [id_producto]);
      
      if (stockResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return errorResponse(res, `Producto con ID ${id_producto} no encontrado`, 404);
      }
      
      const producto = stockResult.rows[0];
      
      if (producto.stock_disponible < cantidad) {
        await client.query('ROLLBACK');
        return errorResponse(res, `Stock insuficiente para ${producto.title}. Disponible: ${producto.stock_disponible}`, 400);
      }
      
      const precioFinal = precio_unitario || parseFloat(producto.price);
      const subtotal = cantidad * precioFinal;
      total += subtotal;
      
      productosValidados.push({
        id_producto,
        cantidad,
        precio: precioFinal,
        subtotal,
        titulo: producto.title
      });
    }
    
    // Crear cliente temporal si no existe
    let id_cliente = null;
    
    if (cliente_correo && cliente_correo.trim()) {
      // Buscar cliente existente por correo
      const clienteExistente = await client.query(
        'SELECT id_usuario FROM usuarios WHERE correo = $1 AND rol = $2',
        [cliente_correo.trim(), 'cliente']
      );
      
      if (clienteExistente.rows.length > 0) {
        id_cliente = clienteExistente.rows[0].id_usuario;
        console.log(`👤 Cliente existente encontrado: ID ${id_cliente}`);
      }
    }
    
    // Si no existe, crear cliente temporal
    if (!id_cliente) {
      const nuevoClienteResult = await client.query(`
        INSERT INTO usuarios (
          nombre, apellido, correo, telefono, direccion, rol, usuario, password_hash
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id_usuario
      `, [
        cliente_nombre.trim(),
        cliente_apellido.trim() || '',
        cliente_correo.trim() || `temp_${Date.now()}@presencial.local`,
        cliente_telefono.trim() || '',
        cliente_direccion.trim() || '',
        'cliente',
        `temp_${Date.now()}`,
        '$2b$10$defaulthashfortemporarycustomers' // Hash temporal
      ]);
      
      id_cliente = nuevoClienteResult.rows[0].id_usuario;
      console.log(`👤 Cliente temporal creado: ID ${id_cliente}`);
    }
    
    // Crear pedido
    const pedidoResult = await client.query(`
      INSERT INTO pedidos (
        id_usuario, total, estado, fecha_pedido, notas
      ) VALUES ($1, $2, $3, NOW(), $4)
      RETURNING id_pedido, fecha_pedido
    `, [id_cliente, total, 'Entregado', notas || 'Venta presencial']);
    
    const id_pedido = pedidoResult.rows[0].id_pedido;
    const fecha_pedido = pedidoResult.rows[0].fecha_pedido;
    
    console.log(`📋 Pedido creado: ID ${id_pedido}`);
    
    // Agregar productos al pedido y actualizar stock
    for (const producto of productosValidados) {
      // Insertar en pedido_producto
      await client.query(`
        INSERT INTO pedido_producto (
          id_pedido, id_producto, cantidad, precio
        ) VALUES ($1, $2, $3, $4)
      `, [id_pedido, producto.id_producto, producto.cantidad, producto.precio]);
      
      // Descontar stock directamente (venta presencial = entregado inmediatamente)
      await client.query(`
        UPDATE productos 
        SET stock = stock - $1 
        WHERE id_producto = $2
      `, [producto.cantidad, producto.id_producto]);
      
      console.log(`📦 Stock actualizado para producto ${producto.id_producto}: -${producto.cantidad}`);
    }
    
    await client.query('COMMIT');
    
    console.log(`✅ Venta presencial completada: Pedido #${id_pedido}, Total: S/ ${total.toFixed(2)}`);
    
    return successResponse(res, {
      pedido: {
        id_pedido,
        fecha_pedido,
        total,
        estado: 'Entregado',
        cliente: {
          id_usuario: id_cliente,
          nombre: cliente_nombre,
          apellido: cliente_apellido,
          correo: cliente_correo,
          telefono: cliente_telefono,
          direccion: cliente_direccion
        },
        productos: productosValidados
      }
    }, 'Venta presencial creada exitosamente');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creando venta presencial:', error);
    return errorResponse(res, 'Error interno del servidor', 500, error);
  } finally {
    client.release();
  }
}

// Obtener resumen de ventas del día
export async function resumenVentasDelDia(req, res) {
  try {
    const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    console.log(`📊 Obteniendo resumen para la fecha: ${hoy}`);
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as total_ventas,
        COUNT(CASE WHEN estado = 'Entregado' THEN 1 END) as pedidos_entregados,
        COUNT(CASE WHEN notas ILIKE '%presencial%' THEN 1 END) as ventas_presenciales
      FROM pedidos 
      WHERE fecha_pedido::date = $1
    `, [hoy]);
    
    const ventasDelDia = result.rows[0];
    console.log(`📈 Datos del resumen:`, ventasDelDia);
    
    // Obtener productos más vendidos del día
    const productosResult = await pool.query(`
      SELECT 
        p.title,
        SUM(pp.cantidad) as cantidad_vendida,
        SUM(pp.cantidad * pp.precio) as total_producto
      FROM pedido_producto pp
      JOIN productos p ON pp.id_producto::integer = p.id_producto
      JOIN pedidos ped ON pp.id_pedido = ped.id_pedido
      WHERE ped.fecha_pedido::date = $1
      GROUP BY p.id_producto, p.title
      ORDER BY cantidad_vendida DESC
      LIMIT 5
    `, [hoy]);
    
    console.log(`🛍️ Productos más vendidos:`, productosResult.rows);
    
    return successResponse(res, {
      fecha: hoy,
      resumen: {
        total_pedidos: parseInt(ventasDelDia.total_pedidos),
        total_ventas: parseFloat(ventasDelDia.total_ventas),
        pedidos_entregados: parseInt(ventasDelDia.pedidos_entregados),
        ventas_presenciales: parseInt(ventasDelDia.ventas_presenciales)
      },
      productos_mas_vendidos: productosResult.rows
    }, 'Resumen de ventas obtenido exitosamente');
    
  } catch (error) {
    console.error('❌ Error obteniendo resumen de ventas:', error);
    return errorResponse(res, 'Error interno del servidor', 500, error);
  }
}