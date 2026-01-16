import { createUser, findUserByEmail } from "../models/user.model.js";
import crypto from "crypto";

export async function initializeAdmin() {
  try {
    console.log("🔍 Verificando usuario administrador...");
    
    const adminEmail = "admin@ecommerce.com";
    const existingAdmin = await findUserByEmail(adminEmail);
    
    if (existingAdmin) {
      console.log("✅ Usuario administrador ya existe");
      return existingAdmin;
    }
    
    console.log("👤 Creando usuario administrador por defecto...");
    
    // Generar credenciales seguras aleatorias
    const randomUsername = "admin_" + crypto.randomBytes(4).toString('hex');
    const randomPassword = crypto.randomBytes(12).toString('base64').replace(/[+/=]/g, '');
    
    const adminData = {
      nombre: "Administrador",
      apellido: "Sistema",
      correo: adminEmail,
      telefono: "999999999",
      direccion: "Dirección del sistema",
      rol: "administrador",
      usuario: randomUsername,
      contrasena: randomPassword
    };
    
    const newAdmin = await createUser(
      adminData.nombre,
      adminData.apellido,
      adminData.correo,
      adminData.telefono,
      adminData.direccion,
      adminData.rol,
      adminData.usuario,
      adminData.contrasena
    );
    
    console.log("\n🎉 ===== USUARIO ADMINISTRADOR CREADO =====");
    console.log("📧 Email:", adminEmail);
    console.log("👤 Usuario:", randomUsername);
    console.log("🔑 Contraseña:", randomPassword);
    console.log("⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro");
    console.log("⚠️  CAMBIA ESTAS CREDENCIALES después del primer login");
    console.log("==========================================\n");
    
    return newAdmin;
  } catch (error) {
    console.error("❌ Error inicializando administrador:", error.message);
    throw error;
  }
}