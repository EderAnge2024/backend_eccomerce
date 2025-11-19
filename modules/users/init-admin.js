import pool from "../../db.js";
import bcrypt from "bcrypt";

// Función para crear el usuario administrador por defecto
export async function initializeAdmin() {
  try {
    // Verificar si ya existe un administrador
    const checkAdmin = await pool.query(
      "SELECT * FROM usuarios WHERE rol = 'administrador' LIMIT 1"
    );

    if (checkAdmin.rows.length > 0) {
      console.log("✅ Ya existe un usuario administrador");
      return;
    }

    // Crear usuario administrador por defecto
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);
    
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, correo, telefono, direccion, rol, usuario, password_hash) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        'Administrador',
        'Sistema',
        'admin@ecommerce.com',
        '999999999',
        'Oficina Central',
        'administrador',
        'admin',
        hashedPassword
      ]
    );

    console.log("✅ Usuario administrador creado exitosamente");
    console.log("   Usuario: admin");
    console.log("   Contraseña: admin123");
    console.log("   ⚠️  IMPORTANTE: Cambia esta contraseña después del primer inicio de sesión");
    
    return result.rows[0];
  } catch (error) {
    console.error("❌ Error al crear usuario administrador:", error.message);
  }
}
