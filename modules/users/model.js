import pool from "../../db.js";
import bcrypt from "bcrypt";

// ============ CRUD USUARIOS ============

// Crear usuario
export async function createUser(nombre, apellido, correo, telefono, direccion, rol, usuario, contrasena) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(contrasena, saltRounds);
  const result = await pool.query(
    `INSERT INTO usuarios (nombre, apellido, correo, telefono, direccion, rol, usuario, password_hash) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [nombre, apellido, correo, telefono, direccion, rol || 'cliente', usuario, hashedPassword]
  );
  return result.rows[0];
}

// Obtener todos los usuarios
export async function getAllUsers() {
  const result = await pool.query("SELECT id_usuario, nombre, apellido, correo, telefono, direccion, rol, usuario, es_super_admin FROM usuarios");
  return result.rows;
}

// Obtener usuario por ID
export async function getUserById(id_usuario) {
  const result = await pool.query(
    "SELECT id_usuario, nombre, apellido, correo, telefono, direccion, rol, usuario, es_super_admin FROM usuarios WHERE id_usuario = $1",
    [id_usuario]
  );
  return result.rows[0] || null;
}

// Actualizar usuario
export async function updateUser(id_usuario, nombre, apellido, correo, telefono, direccion, rol, usuario) {
  console.log('🔧 updateUser model llamado con:', {
    id_usuario,
    nombre,
    apellido,
    correo,
    telefono,
    direccion,
    rol,
    usuario
  });
  
  const result = await pool.query(
    `UPDATE usuarios SET nombre = $1, apellido = $2, correo = $3, telefono = $4, direccion = $5, rol = $6, usuario = $7 
     WHERE id_usuario = $8 RETURNING id_usuario, nombre, apellido, correo, telefono, direccion, rol, usuario, es_super_admin`,
    [nombre, apellido, correo, telefono, direccion, rol, usuario, id_usuario]
  );
  
  console.log('✅ Query ejecutada, resultado:', result.rows[0]);
  return result.rows[0];
}

// Eliminar usuario
export async function deleteUser(id_usuario) {
  const result = await pool.query("DELETE FROM usuarios WHERE id_usuario = $1 RETURNING *", [id_usuario]);
  return result.rows[0];
}

// Buscar usuario (login)
export async function findUser(usuario, contrasena) {
  const result = await pool.query(
    "SELECT * FROM usuarios WHERE usuario = $1",
    [usuario]
  );
  const user = result.rows[0];
  if (!user) return null;
  const match = await bcrypt.compare(contrasena, user.password_hash);
  if (!match) return null;
  return user;
}

// Buscar usuario por correo (para recuperación)
export async function findUserByEmail(correo) {
  const result = await pool.query(
    "SELECT * FROM usuarios WHERE correo = $1",
    [correo]
  );
  return result.rows[0] || null;
}

// Actualizar contraseña
export async function updatePassword(correo, nuevaContrasena) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(nuevaContrasena, saltRounds);
  const result = await pool.query(
    "UPDATE usuarios SET password_hash = $1 WHERE correo = $2 RETURNING *",
    [hashedPassword, correo]
  );
  return result.rows[0];
}

// ============ CÓDIGOS DE VERIFICACIÓN ============

// Generar código de verificación
export async function createVerificationCode(correo, codigo, expirationSeconds = 10 * 60) {
  const user = await findUserByEmail(correo);
  if (!user) throw new Error("Usuario no encontrado");

  await pool.query("DELETE FROM token WHERE id_usuario = $1", [user.id_usuario]);

  const expiracion = new Date(Date.now() + expirationSeconds * 1000);
  const result = await pool.query(
    "INSERT INTO token (id_usuario, code_recuperacion, fecha_expiracion) VALUES ($1, $2, $3) RETURNING *",
    [user.id_usuario, codigo, expiracion]
  );
  return result.rows[0];
}

// Verificar código
export async function verifyCode(correo, codigo) {
  const user = await findUserByEmail(correo);
  if (!user) return null;

  const result = await pool.query(
    "SELECT * FROM token WHERE id_usuario = $1 AND code_recuperacion = $2 AND fecha_expiracion > NOW()",
    [user.id_usuario, codigo]
  );

  if (result.rows.length === 0) return null;

  await pool.query("DELETE FROM token WHERE id_token = $1", [result.rows[0].id_token]);
  return result.rows[0];
}

// Limpiar códigos expirados
export async function cleanExpiredCodes() {
  await pool.query("DELETE FROM token WHERE fecha_expiracion < NOW()");
}
