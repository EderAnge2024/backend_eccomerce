// Script simple para actualizar el usuario admin a super administrador
import pool from "./db.js";

async function updateAdminToSuperAdmin() {
  console.log('👑 ACTUALIZANDO ADMIN A SUPER ADMINISTRADOR');
  console.log('='.repeat(45));
  
  try {
    // Actualizar el usuario admin para que sea super administrador
    const result = await pool.query(
      'UPDATE usuarios SET es_super_admin = true WHERE usuario = $1 RETURNING id_usuario, nombre, usuario, rol, es_super_admin',
      ['admin']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Usuario admin no encontrado');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ Usuario actualizado exitosamente:');
    console.log(`   ID: ${user.id_usuario}`);
    console.log(`   Nombre: ${user.nombre}`);
    console.log(`   Usuario: ${user.usuario}`);
    console.log(`   Rol: ${user.rol}`);
    console.log(`   Super Admin: ${user.es_super_admin ? '✅ SÍ' : '❌ NO'}`);
    
    console.log('');
    console.log('🎉 ¡Actualización completada!');
    console.log('🔍 Ahora el AuthStateDebug será visible para este usuario');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Cerrar la conexión
    await pool.end();
  }
}

// Ejecutar el script
updateAdminToSuperAdmin();