import pool from "../../db.js";
import bcrypt from "bcrypt";
import fetch from "node-fetch";

// Función de inicialización del sistema con población de productos
export async function initializeAdmin() {
  try {
    console.log("🚀 Inicializando sistema de e-commerce...");

    // 1. Verificar/Crear usuario super admin
    console.log("1️⃣ Verificando usuario super administrador...");
    const superAdminCheck = await pool.query(
      "SELECT * FROM usuarios WHERE usuario = 'superadmin' OR es_super_admin = true LIMIT 1"
    );

    let id_super_admin;
    if (superAdminCheck.rows.length === 0) {
      console.log("   ⚠️ Creando super admin...");
      const hashedPassword = await bcrypt.hash("admin123", 10);
      
      const newSuperAdmin = await pool.query(
        `INSERT INTO usuarios (nombre, apellido, correo, telefono, direccion, rol, usuario, password_hash, es_super_admin)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id_usuario`,
        ["Super", "Admin", "superadmin@ecommerce.com", "999999999", "Oficina Central", "administrador", "superadmin", hashedPassword, true]
      );
      
      id_super_admin = newSuperAdmin.rows[0].id_usuario;
      console.log(`   ✅ Super admin creado (ID: ${id_super_admin})`);
      console.log(`   📝 Usuario: superadmin / Contraseña: admin123`);
    } else {
      // Asegurar que el usuario existente sea super admin
      await pool.query(
        "UPDATE usuarios SET es_super_admin = true WHERE id_usuario = $1",
        [superAdminCheck.rows[0].id_usuario]
      );
      id_super_admin = superAdminCheck.rows[0].id_usuario;
      console.log(`   ✅ Super admin verificado (ID: ${id_super_admin})`);
    }

    // 2. Verificar productos existentes
    console.log("2️⃣ Verificando productos en la base de datos...");
    const productosCount = await pool.query("SELECT COUNT(*) FROM productos");
    const totalProductos = parseInt(productosCount.rows[0].count);
    console.log(`   � vProductos actuales: ${totalProductos}`);

    if (totalProductos === 0) {
      console.log("3️⃣ Poblando base de datos con productos de FakeStore API...");
      
      try {
        // Obtener productos de FakeStore API con timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
        
        const response = await fetch("https://fakestoreapi.com/products", {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const productos = await response.json();
        console.log(`   ✅ ${productos.length} productos obtenidos de la API`);

        // Insertar productos en lotes para mejor rendimiento
        console.log("   📦 Insertando productos...");
        let insertados = 0;

        for (const producto of productos) {
          try {
            await pool.query(
              `INSERT INTO productos (id_usuario, title, price, description, category, image, rating_rate, rating_count)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                id_super_admin,
                producto.title,
                producto.price,
                producto.description,
                producto.category,
                producto.image,
                producto.rating?.rate || null,
                producto.rating?.count || null,
              ]
            );
            insertados++;
            
            // Solo mostrar progreso cada 5 productos para no saturar la consola
            if (insertados % 5 === 0 || insertados === productos.length) {
              console.log(`   ✅ Insertados: ${insertados}/${productos.length}`);
            }
          } catch (error) {
            console.error(`   ❌ Error insertando producto: ${error.message}`);
          }
        }

        console.log(`   📊 Total productos insertados: ${insertados}`);
      } catch (error) {
        if (error.name === 'AbortError') {
          console.error("   ⚠️ Timeout obteniendo productos de la API");
        } else {
          console.error("   ⚠️ Error obteniendo productos:", error.message);
        }
        console.log("   ℹ️ El sistema funcionará sin productos iniciales");
      }
    } else {
      console.log("   ℹ️ Ya hay productos en la base de datos, omitiendo población");
    }

    // 3. Resumen final
    console.log("4️⃣ Resumen del sistema:");
    const usuarios = await pool.query("SELECT COUNT(*) FROM usuarios");
    const admins = await pool.query("SELECT COUNT(*) FROM usuarios WHERE rol = 'administrador'");
    const superAdmins = await pool.query("SELECT COUNT(*) FROM usuarios WHERE es_super_admin = true");
    const productosFinales = await pool.query("SELECT COUNT(*) FROM productos");
    
    console.log(`   👥 Total usuarios: ${usuarios.rows[0].count}`);
    console.log(`   🛡️ Administradores: ${admins.rows[0].count}`);
    console.log(`   ⭐ Super administradores: ${superAdmins.rows[0].count}`);
    console.log(`   📦 Total productos: ${productosFinales.rows[0].count}`);

    console.log("✅ ¡Sistema inicializado exitosamente!");
    console.log("📝 Usuario super admin: superadmin / admin123");
    console.log("🚀 Servidor listo para recibir peticiones\n");

    return { success: true, id_super_admin };
  } catch (error) {
    console.error("❌ Error durante la inicialización:", error.message);
    return { success: false, error: error.message };
  }
}
