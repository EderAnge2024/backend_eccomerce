import pool from "../../../db.js";

// ============ CRUD TOKEN ============

// Crear token
export async function createToken(id_usuario, code_recuperacion, fecha_expiracion) {
  const result = await pool.query(
    `INSERT INTO token (id_usuario, code_recuperacion, fecha_expiracion) 
     VALUES ($1, $2, $3) RETURNING *`,
    [id_usuario, code_recuperacion, fecha_expiracion]
  );
  return result.rows[0];
}

// Obtener todos los tokens
export async function getAllTokens() {
  const result = await pool.query(`
    SELECT t.*, u.nombre, u.apellido, u.correo 
    FROM token t
    LEFT JOIN usuarios u ON t.id_usuario = u.id_usuario
    ORDER BY t.fecha_expiracion DESC
  `);
  return result.rows;
}

// Obtener token por ID
export async function getTokenById(id_token) {
  const result = await pool.query(
    `SELECT t.*, u.nombre, u.apellido, u.correo 
     FROM token t
     LEFT JOIN usuarios u ON t.id_usuario = u.id_usuario
     WHERE t.id_token = $1`,
    [id_token]
  );
  return result.rows[0] || null;
}

// Obtener tokens por usuario
export async function getTokensByUser(id_usuario) {
  const result = await pool.query(
    `SELECT * FROM token WHERE id_usuario = $1 ORDER BY fecha_expiracion DESC`,
    [id_usuario]
  );
  return result.rows;
}

// Actualizar token
export async function updateToken(id_token, code_recuperacion, fecha_expiracion) {
  const result = await pool.query(
    `UPDATE token SET code_recuperacion = $1, fecha_expiracion = $2 
     WHERE id_token = $3 RETURNING *`,
    [code_recuperacion, fecha_expiracion, id_token]
  );
  return result.rows[0];
}

// Eliminar token
export async function deleteToken(id_token) {
  const result = await pool.query("DELETE FROM token WHERE id_token = $1 RETURNING *", [id_token]);
  return result.rows[0];
}

// Limpiar tokens expirados
export async function cleanExpiredTokens() {
  const result = await pool.query("DELETE FROM token WHERE fecha_expiracion < NOW() RETURNING *");
  return result.rows;
}
