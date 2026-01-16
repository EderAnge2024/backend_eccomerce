import pool from "../../../db.js";

// ============ CRUD PRODUCTOS ============

// Crear producto
export async function createProducto(id_usuario, title, price, description, category, image, rating_rate, rating_count, stock = 0) {
  const result = await pool.query(
    `INSERT INTO productos (id_usuario, title, price, description, category, image, rating_rate, rating_count, stock) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [id_usuario, title, price, description, category, image, rating_rate, rating_count, stock]
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
export async function updateProducto(id_producto, title, price, description, category, image, rating_rate, rating_count, stock) {
  const result = await pool.query(
    `UPDATE productos SET title = $1, price = $2, description = $3, category = $4, image = $5, rating_rate = $6, rating_count = $7, stock = $8
     WHERE id_producto = $9 RETURNING *`,
    [title, price, description, category, image, rating_rate, rating_count, stock, id_producto]
  );
  return result.rows[0];
}

// Eliminar producto
export async function deleteProducto(id_producto) {
  const result = await pool.query("DELETE FROM productos WHERE id_producto = $1 RETURNING *", [id_producto]);
  return result.rows[0];
}

// ============ GESTIÓN DE STOCK ============

// Reducir stock de un producto
export async function reduceStock(id_producto, cantidad) {
  const result = await pool.query(
    `UPDATE productos SET stock = stock - $1 
     WHERE id_producto = $2 AND stock >= $1 
     RETURNING *`,
    [cantidad, id_producto]
  );
  return result.rows[0];
}

// Aumentar stock de un producto
export async function increaseStock(id_producto, cantidad) {
  const result = await pool.query(
    `UPDATE productos SET stock = stock + $1 
     WHERE id_producto = $2 
     RETURNING *`,
    [cantidad, id_producto]
  );
  return result.rows[0];
}

// Verificar si hay stock suficiente
export async function checkStock(id_producto, cantidad) {
  const result = await pool.query(
    "SELECT stock FROM productos WHERE id_producto = $1",
    [id_producto]
  );
  
  if (!result.rows[0]) {
    return { available: false, stock: 0, message: 'Producto no encontrado' };
  }
  
  const currentStock = result.rows[0].stock;
  return {
    available: currentStock >= cantidad,
    stock: currentStock,
    message: currentStock >= cantidad ? 'Stock disponible' : `Stock insuficiente. Disponible: ${currentStock}`
  };
}

// Obtener productos con stock bajo (menos de 5 unidades)
export async function getProductosStockBajo(limite = 5) {
  const result = await pool.query(
    "SELECT * FROM productos WHERE stock < $1 ORDER BY stock ASC",
    [limite]
  );
  return result.rows;
}

// ============ GESTIÓN DE STOCK RESERVADO ============

// Reservar stock para un pedido (cuando pasa a "En proceso")
export async function reservarStock(id_producto, cantidad) {
  const result = await pool.query(
    `UPDATE productos 
     SET stock_reservado = stock_reservado + $1 
     WHERE id_producto = $2 
     AND (stock - stock_reservado) >= $1 
     RETURNING *`,
    [cantidad, id_producto]
  );
  return result.rows[0];
}

// Liberar stock reservado (cuando se cancela un pedido)
export async function liberarStockReservado(id_producto, cantidad) {
  const result = await pool.query(
    `UPDATE productos 
     SET stock_reservado = GREATEST(0, stock_reservado - $1) 
     WHERE id_producto = $2 
     RETURNING *`,
    [cantidad, id_producto]
  );
  return result.rows[0];
}

// Confirmar descuento de stock (cuando se entrega el pedido)
export async function confirmarDescuentoStock(id_producto, cantidad) {
  const result = await pool.query(
    `UPDATE productos 
     SET stock = stock - $1,
         stock_reservado = GREATEST(0, stock_reservado - $1)
     WHERE id_producto = $2 
     AND stock >= $1
     RETURNING *`,
    [cantidad, id_producto]
  );
  return result.rows[0];
}

// Verificar stock disponible (stock - stock_reservado)
export async function checkStockDisponible(id_producto, cantidad) {
  const result = await pool.query(
    `SELECT 
       stock,
       stock_reservado,
       (stock - stock_reservado) as stock_disponible,
       title
     FROM productos 
     WHERE id_producto = $1`,
    [id_producto]
  );
  
  if (!result.rows[0]) {
    return { available: false, stock_disponible: 0, message: 'Producto no encontrado' };
  }
  
  const { stock, stock_reservado, stock_disponible, title } = result.rows[0];
  return {
    available: stock_disponible >= cantidad,
    stock_total: stock,
    stock_reservado: stock_reservado,
    stock_disponible: stock_disponible,
    title: title,
    message: stock_disponible >= cantidad 
      ? 'Stock disponible' 
      : `Stock insuficiente. Disponible: ${stock_disponible} (${stock_reservado} reservado)`
  };
}

// Obtener vista completa de stock
export async function getVistaStockCompleta() {
  const result = await pool.query(`
    SELECT 
      id_producto,
      title,
      stock,
      stock_reservado,
      stock_disponible,
      estado_stock
    FROM vista_stock_disponible 
    ORDER BY stock_disponible ASC
  `);
  return result.rows;
}
