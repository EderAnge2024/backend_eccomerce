import pool from "../../db.js";

// ============ CRUD PRODUCTOS ============

// Crear producto
export async function createProducto(id_usuario, title, price, description, category, image, rating_rate, rating_count) {
  const result = await pool.query(
    `INSERT INTO productos (id_usuario, title, price, description, category, image, rating_rate, rating_count) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [id_usuario, title, price, description, category, image, rating_rate, rating_count]
  );
  return result.rows[0];
}

// Obtener todos los productos
export async function getAllProductos() {
  const result = await pool.query("SELECT * FROM productos ORDER BY fecha_creacion DESC");
  return result.rows;
}

// Obtener producto por ID
export async function getProductoById(id_producto) {
  const result = await pool.query(
    "SELECT * FROM productos WHERE id_producto = $1",
    [id_producto]
  );
  return result.rows[0] || null;
}

// Obtener productos por usuario
export async function getProductosByUser(id_usuario) {
  const result = await pool.query(
    "SELECT * FROM productos WHERE id_usuario = $1 ORDER BY fecha_creacion DESC",
    [id_usuario]
  );
  return result.rows;
}

// Obtener productos por categoría
export async function getProductosByCategory(category) {
  const result = await pool.query(
    "SELECT * FROM productos WHERE category = $1 ORDER BY fecha_creacion DESC",
    [category]
  );
  return result.rows;
}

// Actualizar producto
export async function updateProducto(id_producto, title, price, description, category, image, rating_rate, rating_count) {
  const result = await pool.query(
    `UPDATE productos SET title = $1, price = $2, description = $3, category = $4, image = $5, rating_rate = $6, rating_count = $7 
     WHERE id_producto = $8 RETURNING *`,
    [title, price, description, category, image, rating_rate, rating_count, id_producto]
  );
  return result.rows[0];
}

// Eliminar producto
export async function deleteProducto(id_producto) {
  const result = await pool.query("DELETE FROM productos WHERE id_producto = $1 RETURNING *", [id_producto]);
  return result.rows[0];
}
