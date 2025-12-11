import pool from "../../db.js";

// ============ CRUD UBICACIONES ============

// Crear ubicación
export async function createUbicacion(id_usuario, nombre, direccion, ciudad, codigo_postal, telefono, es_principal) {
  // Si es principal, desmarcar otras ubicaciones principales del usuario
  if (es_principal) {
    await pool.query(
      "UPDATE ubicacion SET es_principal = false WHERE id_usuario = $1",
      [id_usuario]
    );
  }
  
  const result = await pool.query(
    `INSERT INTO ubicacion (id_usuario, nombre, direccion, ciudad, codigo_postal, telefono, es_principal) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [id_usuario, nombre, direccion, ciudad, codigo_postal, telefono, es_principal || false]
  );
  return result.rows[0];
}

// Obtener todas las ubicaciones
export async function getAllUbicaciones() {
  const result = await pool.query("SELECT * FROM ubicacion ORDER BY fecha_creacion DESC");
  return result.rows;
}

// Obtener ubicación por ID
export async function getUbicacionById(id_ubicacion) {
  const result = await pool.query(
    "SELECT * FROM ubicacion WHERE id_ubicacion = $1",
    [id_ubicacion]
  );
  return result.rows[0] || null;
}

// Obtener ubicaciones por usuario
export async function getUbicacionesByUser(id_usuario) {
  const result = await pool.query(
    "SELECT * FROM ubicacion WHERE id_usuario = $1 ORDER BY es_principal DESC, fecha_creacion DESC",
    [id_usuario]
  );
  return result.rows;
}

// Actualizar ubicación
export async function updateUbicacion(id_ubicacion, nombre, direccion, ciudad, codigo_postal, telefono, es_principal) {
  // Si es principal, desmarcar otras ubicaciones principales del usuario
  if (es_principal) {
    const ubicacion = await getUbicacionById(id_ubicacion);
    if (ubicacion) {
      await pool.query(
        "UPDATE ubicacion SET es_principal = false WHERE id_usuario = $1 AND id_ubicacion != $2",
        [ubicacion.id_usuario, id_ubicacion]
      );
    }
  }
  
  const result = await pool.query(
    `UPDATE ubicacion SET nombre = $1, direccion = $2, ciudad = $3, codigo_postal = $4, telefono = $5, es_principal = $6 
     WHERE id_ubicacion = $7 RETURNING *`,
    [nombre, direccion, ciudad, codigo_postal, telefono, es_principal, id_ubicacion]
  );
  return result.rows[0];
}

// Eliminar ubicación
export async function deleteUbicacion(id_ubicacion) {
  const result = await pool.query("DELETE FROM ubicacion WHERE id_ubicacion = $1 RETURNING *", [id_ubicacion]);
  return result.rows[0];
}
