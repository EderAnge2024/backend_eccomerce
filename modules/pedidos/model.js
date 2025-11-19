import pool from "../../db.js";

// ============ CRUD PEDIDOS ============

// Crear pedido
export async function createPedido(id_usuario, total) {
  const result = await pool.query(
    `INSERT INTO pedidos (id_usuario, total) VALUES ($1, $2) RETURNING *`,
    [id_usuario, total]
  );
  return result.rows[0];
}

// Obtener todos los pedidos
export async function getAllPedidos() {
  const result = await pool.query(`
    SELECT p.*, u.nombre, u.apellido, u.correo 
    FROM pedidos p 
    LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
    ORDER BY p.fecha_pedido DESC
  `);
  return result.rows;
}

// Obtener pedido por ID
export async function getPedidoById(id_pedido) {
  const result = await pool.query(
    `SELECT p.*, u.nombre, u.apellido, u.correo 
     FROM pedidos p 
     LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
     WHERE p.id_pedido = $1`,
    [id_pedido]
  );
  return result.rows[0] || null;
}

// Obtener pedidos por usuario
export async function getPedidosByUser(id_usuario) {
  const result = await pool.query(
    `SELECT * FROM pedidos WHERE id_usuario = $1 ORDER BY fecha_pedido DESC`,
    [id_usuario]
  );
  return result.rows;
}

// Actualizar pedido
export async function updatePedido(id_pedido, total) {
  const result = await pool.query(
    `UPDATE pedidos SET total = $1 WHERE id_pedido = $2 RETURNING *`,
    [total, id_pedido]
  );
  return result.rows[0];
}

// Eliminar pedido
export async function deletePedido(id_pedido) {
  const result = await pool.query("DELETE FROM pedidos WHERE id_pedido = $1 RETURNING *", [id_pedido]);
  return result.rows[0];
}
