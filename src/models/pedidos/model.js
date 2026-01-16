import pool from "../../../db.js";

// ============ CRUD PEDIDOS ============
// Este archivo contiene todas las funciones para interactuar con la tabla 'pedidos'
// en la base de datos PostgreSQL

/**
 * Crear un nuevo pedido
 * @param {number} id_usuario - ID del usuario que realiza el pedido
 * @param {number} total - Monto total del pedido
 * @param {number|null} id_ubicacion - ID de la dirección de envío (opcional)
 * @returns {Object} El pedido creado
 */
export async function createPedido(id_usuario, total, id_ubicacion = null) {
  const result = await pool.query(
    `INSERT INTO pedidos (id_usuario, total, id_ubicacion) VALUES ($1, $2, $3) RETURNING *`,
    [id_usuario, total, id_ubicacion]
  );
  return result.rows[0];
}

/**
 * Obtener todos los pedidos del sistema
 * Incluye información del usuario y ubicación mediante JOIN
 * @returns {Array} Lista de todos los pedidos con información relacionada
 */
export async function getAllPedidos() {
  const result = await pool.query(`
    SELECT 
      p.*, 
      u.nombre, 
      u.apellido, 
      u.correo,
      u.telefono as usuario_telefono,
      ub.nombre as ubicacion_nombre,
      ub.direccion as ubicacion_direccion,
      ub.ciudad as ubicacion_ciudad,
      ub.codigo_postal as ubicacion_codigo_postal,
      ub.telefono as ubicacion_telefono
    FROM pedidos p 
    LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
    LEFT JOIN ubicacion ub ON p.id_ubicacion = ub.id_ubicacion
    ORDER BY p.fecha_pedido DESC
  `);
  return result.rows;
}

/**
 * Obtener un pedido específico por su ID
 * @param {number} id_pedido - ID del pedido a buscar
 * @returns {Object|null} El pedido encontrado o null si no existe
 */
export async function getPedidoById(id_pedido) {
  const result = await pool.query(
    `SELECT 
      p.*, 
      u.nombre, 
      u.apellido, 
      u.correo,
      u.telefono as usuario_telefono,
      ub.nombre as ubicacion_nombre,
      ub.direccion as ubicacion_direccion,
      ub.ciudad as ubicacion_ciudad,
      ub.codigo_postal as ubicacion_codigo_postal,
      ub.telefono as ubicacion_telefono
     FROM pedidos p 
     LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
     LEFT JOIN ubicacion ub ON p.id_ubicacion = ub.id_ubicacion
     WHERE p.id_pedido = $1`,
    [id_pedido]
  );
  return result.rows[0] || null;
}

/**
 * Obtener todos los pedidos de un usuario específico (cliente)
 * @param {number} id_usuario - ID del usuario
 * @returns {Array} Lista de pedidos del usuario
 */
export async function getPedidosByUser(id_usuario) {
  const result = await pool.query(
    `SELECT * FROM pedidos WHERE id_usuario = $1 ORDER BY fecha_pedido DESC`,
    [id_usuario]
  );
  return result.rows;
}

/**
 * Actualizar un pedido (total y estado)
 * @param {number} id_pedido - ID del pedido a actualizar
 * @param {number} total - Nuevo monto total
 * @param {string} estado - Nuevo estado del pedido
 * @returns {Object} El pedido actualizado
 */
export async function updatePedido(id_pedido, total, estado) {
  const result = await pool.query(
    `UPDATE pedidos SET total = $1, estado = $2 WHERE id_pedido = $3 RETURNING *`,
    [total, estado, id_pedido]
  );
  return result.rows[0];
}

/**
 * Actualizar solo el estado de un pedido
 * Estados válidos: 'Pendiente', 'En proceso', 'Entregado'
 * @param {number} id_pedido - ID del pedido
 * @param {string} estado - Nuevo estado
 * @returns {Object} El pedido actualizado
 */
export async function updatePedidoEstado(id_pedido, estado) {
  const result = await pool.query(
    `UPDATE pedidos SET estado = $1 WHERE id_pedido = $2 RETURNING *`,
    [estado, id_pedido]
  );
  return result.rows[0];
}

/**
 * Eliminar un pedido
 * @param {number} id_pedido - ID del pedido a eliminar
 * @returns {Object} El pedido eliminado
 */
export async function deletePedido(id_pedido) {
  const result = await pool.query("DELETE FROM pedidos WHERE id_pedido = $1 RETURNING *", [id_pedido]);
  return result.rows[0];
}

// Obtener pedidos que contienen productos de un administrador específico
// Filtra los pedidos para mostrar solo aquellos que incluyen al menos un producto
// creado por el administrador especificado (id_admin)
// Convierte ambos id_producto a string para hacer el JOIN
export async function getPedidosByAdmin(id_admin) {
  try {
    const result = await pool.query(
      `SELECT DISTINCT
        p.id_pedido,
        p.id_usuario,
        p.fecha_pedido,
        p.total,
        p.estado,
        p.id_ubicacion,
        u.nombre,
        u.apellido,
        u.correo,
        u.telefono as usuario_telefono,
        ub.nombre as ubicacion_nombre,
        ub.direccion as ubicacion_direccion,
        ub.ciudad as ubicacion_ciudad,
        ub.codigo_postal as ubicacion_codigo_postal,
        ub.telefono as ubicacion_telefono
      FROM pedidos p
      INNER JOIN pedido_producto pp ON p.id_pedido = pp.id_pedido
      INNER JOIN productos prod ON pp.id_producto = prod.id_producto::text
      LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
      LEFT JOIN ubicacion ub ON p.id_ubicacion = ub.id_ubicacion
      WHERE prod.id_usuario = $1
      ORDER BY p.fecha_pedido DESC`,
      [id_admin]
    );
    
    console.log(`📦 Pedidos encontrados para admin ${id_admin}:`, result.rows.length);
    return result.rows;
  } catch (error) {
    console.error('❌ Error en getPedidosByAdmin:', error);
    throw error;
  }
}
