import { createUser, findUserByEmail } from "../models/user.model.js";
import pool from "../../db.js";

export async function initializeSuperAdmin() {
  try {
    console.log("🔍 Verificando super administrador...");

    const superAdminCheck = await pool.query(
      "SELECT id_usuario, usuario, correo FROM usuarios WHERE es_super_admin = true LIMIT 1"
    );

    if (superAdminCheck.rows.length > 0) {
      const admin = superAdminCheck.rows[0];
      console.log("✅ Super administrador ya existe:", admin.usuario);
      return admin;
    }

    const existingUser = await pool.query(
      "SELECT id_usuario, usuario FROM usuarios WHERE usuario = 'superadmin' LIMIT 1"
    );

    if (existingUser.rows.length > 0) {
      await pool.query(
        "UPDATE usuarios SET es_super_admin = true, rol = 'administrador' WHERE id_usuario = $1",
        [existingUser.rows[0].id_usuario]
      );
      console.log("✅ Super admin configurado:", existingUser.rows[0].usuario);
      return existingUser.rows[0];
    }

    console.log("👤 Creando super administrador...");

    const nuevo = await createUser(
      "Super",
      "Administrador",
      "superadmin@ecommerce.com",
      "999999999",
      "Oficina Central",
      "administrador",
      "superadmin",
      "admin123"
    );

    await pool.query(
      "UPDATE usuarios SET es_super_admin = true WHERE id_usuario = $1",
      [nuevo.id_usuario]
    );

    const final = await pool.query(
      "SELECT id_usuario, usuario, correo, es_super_admin FROM usuarios WHERE id_usuario = $1",
      [nuevo.id_usuario]
    );

    console.log("\n🎉 SUPER ADMINISTRADOR CREADO");
    console.log("   Usuario: superadmin");
    console.log("   Contraseña: admin123");
    console.log("====================================\n");

    return final.rows[0];

  } catch (error) {
    console.error("❌ Error super admin:", error.message);
    return null;
  }
}
