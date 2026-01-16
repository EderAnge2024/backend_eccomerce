// Controlador para generar comprobantes de ventas

import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../../db.js';
import { successResponse, errorResponse } from '../helpers/response.js';

const __filename = fileURLToPath(import.meta.url);

// Registrar helpers de Handlebars
handlebars.registerHelper('if', function(conditional, options) {
  if (conditional) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

handlebars.registerHelper('each', function(context, options) {
  let ret = "";
  for (let i = 0, j = context.length; i < j; i++) {
    ret = ret + options.fn(context[i]);
  }
  return ret;
});

// Función para obtener datos completos del pedido
async function obtenerDatosPedido(id_pedido) {
  try {
    // Obtener información del pedido con datos del cliente
    const pedidoQuery = `
      SELECT 
        p.id_pedido,
        p.fecha_pedido,
        p.total,
        p.estado,
        u.nombre as cliente_nombre,
        u.apellido as cliente_apellido,
        u.correo as cliente_correo,
        u.telefono as cliente_telefono,
        u.direccion as cliente_direccion,
        ub.nombre as ubicacion_nombre,
        ub.direccion as ubicacion_direccion,
        ub.ciudad as ubicacion_ciudad,
        ub.codigo_postal as ubicacion_codigo_postal,
        ub.telefono as ubicacion_telefono
      FROM pedidos p
      LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
      LEFT JOIN ubicacion ub ON p.id_ubicacion = ub.id_ubicacion
      WHERE p.id_pedido = $1
    `;
    
    const pedidoResult = await pool.query(pedidoQuery, [id_pedido]);
    
    if (pedidoResult.rows.length === 0) {
      return null;
    }
    
    const pedido = pedidoResult.rows[0];
    
    // Obtener productos del pedido
    const productosQuery = `
      SELECT 
        pp.id_producto,
        pp.cantidad,
        pp.precio,
        pr.title as producto_nombre,
        pr.description as producto_descripcion,
        pr.category as producto_categoria
      FROM pedido_producto pp
      LEFT JOIN productos pr ON pp.id_producto::integer = pr.id_producto
      WHERE pp.id_pedido = $1
      ORDER BY pp.id_propedido
    `;
    
    const productosResult = await pool.query(productosQuery, [id_pedido]);
    pedido.productos = productosResult.rows;
    
    return pedido;
  } catch (error) {
    console.error('Error obteniendo datos del pedido:', error);
    throw error;
  }
}

// Función para generar el HTML del comprobante (sin PDF)
async function generarComprobanteHTML(pedido) {
  try {
    console.log('📄 Generando HTML del comprobante...');
    
    // Leer el template HTML
    const templatePath = path.join(process.cwd(), 'templates', 'comprobante.html');
    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    
    // Compilar el template con Handlebars
    const template = handlebars.compile(templateHtml);
    
    // Preparar datos para el template
    const templateData = {
      pedido: {
        id: pedido.id_pedido,
        fecha: new Date(pedido.fecha_pedido).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        hora: new Date(pedido.fecha_pedido).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        estado: pedido.estado,
        estado_class: pedido.estado?.toLowerCase().replace(' ', '-') || 'pendiente'
      },
      cliente: {
        nombre: `${pedido.cliente_nombre} ${pedido.cliente_apellido}`,
        correo: pedido.cliente_correo,
        telefono: pedido.cliente_telefono,
        direccion: pedido.cliente_direccion
      },
      envio: {
        nombre: pedido.ubicacion_nombre,
        direccion: pedido.ubicacion_direccion,
        ciudad: pedido.ubicacion_ciudad,
        codigo_postal: pedido.ubicacion_codigo_postal,
        telefono: pedido.ubicacion_telefono
      },
      productos: pedido.productos.map(p => ({
        nombre: p.producto_nombre || `Producto #${p.id_producto}`,
        descripcion: p.producto_descripcion,
        cantidad: p.cantidad,
        precio: parseFloat(p.precio).toFixed(2),
        subtotal: (p.cantidad * parseFloat(p.precio)).toFixed(2)
      })),
      resumen: {
        subtotal: pedido.productos.reduce((sum, p) => sum + (p.cantidad * parseFloat(p.precio)), 0).toFixed(2),
        igv: (pedido.productos.reduce((sum, p) => sum + (p.cantidad * parseFloat(p.precio)), 0) * 0.18).toFixed(2),
        total: parseFloat(pedido.total).toFixed(2)
      },
      fecha_generacion: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    
    // Generar HTML final
    const html = template(templateData);
    
    console.log('✅ HTML del comprobante generado exitosamente');
    return html;
    
  } catch (error) {
    console.error('❌ Error generando HTML del comprobante:', error);
    throw error;
  }
}

// Controlador para generar comprobante HTML (para imprimir desde navegador)
export async function generarComprobante(req, res) {
  const { id_pedido } = req.params;
  
  if (!id_pedido || isNaN(parseInt(id_pedido))) {
    return errorResponse(res, 'ID de pedido inválido', 400);
  }
  
  try {
    console.log(`📄 Generando comprobante HTML para pedido #${id_pedido}`);
    console.log('👤 Usuario autenticado:', req.user.username, '- Rol:', req.user.role);
    
    // Obtener datos del pedido
    const pedido = await obtenerDatosPedido(id_pedido);
    
    if (!pedido) {
      return errorResponse(res, 'Pedido no encontrado', 404);
    }
    
    // Generar HTML
    const html = await generarComprobanteHTML(pedido);
    
    // Configurar headers para HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    
    console.log(`✅ Comprobante HTML generado para pedido #${id_pedido}`);
    
    // Enviar el HTML
    res.send(html);
    
  } catch (error) {
    console.error('❌ Error generando comprobante:', error);
    return errorResponse(res, 'Error interno del servidor', 500, error);
  }
}

// Controlador para previsualizar comprobante (devuelve datos JSON)
export async function previsualizarComprobante(req, res) {
  const { id_pedido } = req.params;
  
  console.log(`👁️ Previsualizando comprobante para pedido #${id_pedido}`);
  console.log('👤 Usuario autenticado:', req.user?.username, '- Rol:', req.user?.role);
  
  if (!id_pedido || isNaN(parseInt(id_pedido))) {
    console.error('❌ ID de pedido inválido:', id_pedido);
    return errorResponse(res, 'ID de pedido inválido', 400);
  }
  
  try {
    console.log(`🔍 Obteniendo datos del pedido #${id_pedido}`);
    
    // Obtener datos del pedido
    const pedido = await obtenerDatosPedido(id_pedido);
    
    if (!pedido) {
      console.error(`❌ Pedido #${id_pedido} no encontrado`);
      return errorResponse(res, 'Pedido no encontrado', 404);
    }
    
    console.log(`✅ Pedido encontrado:`, {
      id: pedido.id_pedido,
      cliente: `${pedido.cliente_nombre} ${pedido.cliente_apellido}`,
      productos: pedido.productos?.length || 0,
      total: pedido.total
    });
    
    // Estructura de datos para el frontend
    const datosComprobante = {
      pedido: {
        id_pedido: pedido.id_pedido,
        fecha_pedido: pedido.fecha_pedido,
        estado: pedido.estado,
        total: parseFloat(pedido.total)
      },
      cliente: {
        nombre: pedido.cliente_nombre,
        apellido: pedido.cliente_apellido,
        correo: pedido.cliente_correo,
        telefono: pedido.cliente_telefono,
        direccion: pedido.cliente_direccion
      },
      productos: pedido.productos.map(p => ({
        id_producto: p.id_producto,
        title: p.producto_nombre || `Producto #${p.id_producto}`,
        cantidad: p.cantidad,
        precio: parseFloat(p.precio)
      })),
      ubicacion: {
        nombre: pedido.ubicacion_nombre,
        direccion: pedido.ubicacion_direccion,
        ciudad: pedido.ubicacion_ciudad,
        codigo_postal: pedido.ubicacion_codigo_postal,
        telefono: pedido.ubicacion_telefono
      }
    };
    
    console.log(`✅ Datos del comprobante preparados para envío`);
    
    return successResponse(res, datosComprobante, 'Datos del comprobante obtenidos exitosamente');
    
  } catch (error) {
    console.error('❌ Error previsualizando comprobante:', error);
    return errorResponse(res, 'Error interno del servidor', 500, error);
  }
}