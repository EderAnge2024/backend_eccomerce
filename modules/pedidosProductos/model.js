import pool from "../../db.js";

// ============ CRUD PEDIDO_PRODUCTO ============

// Crear pedido_producto
export async function createPedidoProducto(id_pedido, id_producto, cantidad, precio) {
  const result = await pool.query(
    `INSERT INTO pedido_producto (id_pedido, id_producto, cantidad, precio) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [id_pedido, id_producto, cantidad, precio]
  );
  return result.rows[0];
}

// Obtener todos los pedido_producto
export async function getAllPedidoProductos() {
  const result = await pool.query(`
    SELECT pp.*, p.id_usuario, p.fecha_pedido, p.total as total_pedido
    FROM pedido_producto pp
    LEFT JOIN pedidos p ON pp.id_pedido = p.id_pedido
    ORDER BY pp.id_proPedido DESC
  `);
  return result.rows;
}

// Obtener pedido_producto por ID
export async function getPedidoProductoById(id_proPedido) {
  const result = await pool.query(
    `SELECT pp.*, p.id_usuario, p.fecha_pedido, p.total as total_pedido
     FROM pedido_producto pp
     LEFT JOIN pedidos p ON pp.id_pedido = p.id_pedido
     WHERE pp.id_proPedido = $1`,
    [id_proPedido]
  );
  return result.rows[0] || null;
}

// Obtener productos por pedido
export async function getProductosByPedido(id_pedido) {
  const result = await pool.query(
    `SELECT * FROM pedido_producto WHERE id_pedido = $1`,
    [id_pedido]
  );
  return result.rows;
}

// Actualizar pedido_producto
export async function updatePedidoProducto(id_proPedido, cantidad, precio) {
  const result = await pool.query(
    `UPDATE pedido_producto SET cantidad = $1, precio = $2 
     WHERE id_proPedido = $3 RETURNING *`,
    [cantidad, precio, id_proPedido]
  );
  return result.rows[0];
}

// Eliminar pedido_producto
export async function deletePedidoProducto(id_proPedido) {
  const result = await pool.query(
    "DELETE FROM pedido_producto WHERE id_proPedido = $1 RETURNING *", 
    [id_proPedido]
  );
  return result.rows[0];
}
