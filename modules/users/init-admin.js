import pool from "../../db.js";
import bcrypt from "bcrypt";
import fetch from "node-fetch";

// Función completa de inicialización del sistema
export async function initializeAdmin() {
  console.log("🚀 Inicializando sistema de e-commerce...\n");

  try {
    // 1. Verificar conexión
    console.log("1️⃣ Verificando conexión a la base de datos...");
    await pool.query("SELECT NOW()");
    console.log("   ✅ Conexión exitosa\n");

    // 2. Agregar campo es_super_admin si no existe
    console.log("2️⃣ Verificando campo es_super_admin...");
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' AND column_name = 'es_super_admin'
    `);

    if (columnCheck.rows.length === 0) {
      console.log("   ⚠️ Campo es_super_admin no existe, agregándolo...");
      await pool.query(`
        ALTER TABLE usuarios 
        ADD COLUMN es_super_admin BOOLEAN DEFAULT false
      `);
      console.log("   ✅ Campo es_super_admin agregado\n");
    } else {
      console.log("   ✅ Campo es_super_admin ya existe\n");
    }

    // 3. Verificar/Crear usuario super admin
    console.log("3️⃣ Verificando usuario super administrador...");
    const superAdminCheck = await pool.query(
      "SELECT * FROM usuarios WHERE id_usuario = 1"
    );

    let id_super_admin;
    if (superAdminCheck.rows.length === 0) {
      console.log("   ⚠️ No existe usuario con ID 1, creando super admin...");
      const hashedPassword = await bcrypt.hash("admin123", 10);
      
      const newSuperAdmin = await pool.query(
        `INSERT INTO usuarios (nombre, apellido, correo, telefono, direccion, rol, usuario, password_hash, es_super_admin)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id_usuario`,
        ["Super", "Admin", "superadmin@ecommerce.com", "999999999", "Oficina Central", "administrador", "superadmin", hashedPassword, true]
      );
      
      id_super_admin = newSuperAdmin.rows[0].id_usuario;
      console.log(`   ✅ Super admin creado con ID: ${id_super_admin}`);
      console.log(`   📝 Usuario: superadmin`);
      console.log(`   🔑 Contraseña: admin123\n`);
    } else {
      // Actualizar el usuario existente para que sea super admin
      await pool.query(
        "UPDATE usuarios SET es_super_admin = true WHERE id_usuario = 1"
      );
      id_super_admin = 1;
      console.log(`   ✅ Usuario ID 1 marcado como super admin\n`);
    }

    // 4. Verificar productos existentes
    console.log("4️⃣ Verificando productos en la base de datos...");
    const productosCount = await pool.query("SELECT COUNT(*) FROM productos");
    const totalProductos = parseInt(productosCount.rows[0].count);
    console.log(`   📊 Productos actuales: ${totalProductos}\n`);

    if (totalProductos === 0) {
      console.log("5️⃣ Poblando base de datos con productos de FakeStore API...");
      
      try {
        // Obtener productos de FakeStore API
        const response = await fetch("https://fakestoreapi.com/products");
        const productos = await response.json();
        console.log(`   ✅ ${productos.length} productos obtenidos de la API\n`);

        // Insertar productos
        console.log("6️⃣ Insertando productos...");
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
            console.log(`   ✅ [${insertados}/${productos.length}] ${producto.title.substring(0, 50)}...`);
          } catch (error) {
            console.error(`   ❌ Error insertando: ${producto.title}`);
          }
        }

        console.log(`\n   📊 Productos insertados: ${insertados}\n`);
      } catch (error) {
        console.error("   ⚠️ Error obteniendo productos de la API:", error.message);
        console.log("   ℹ️ El sistema funcionará sin productos iniciales\n");
      }
    } else {
      console.log("   ℹ️ Ya hay productos en la base de datos, omitiendo población\n");
    }

    // 5. Resumen final
    console.log("7️⃣ Resumen del sistema:");
    
    const usuarios = await pool.query("SELECT COUNT(*) FROM usuarios");
    const admins = await pool.query("SELECT COUNT(*) FROM usuarios WHERE rol = 'administrador'");
    const superAdmins = await pool.query("SELECT COUNT(*) FROM usuarios WHERE es_super_admin = true");
    const productosFinales = await pool.query("SELECT COUNT(*) FROM productos");
    
    console.log(`   👥 Total usuarios: ${usuarios.rows[0].count}`);
    console.log(`   🛡️  Administradores: ${admins.rows[0].count}`);
    console.log(`   ⭐ Super administradores: ${superAdmins.rows[0].count}`);
    console.log(`   📦 Total productos: ${productosFinales.rows[0].count}`);

    console.log("\n✨ ¡Sistema inicializado exitosamente!");
    console.log("\n📝 Información importante:");
    console.log("   - Solo el super admin (ID 1) puede crear otros administradores");
    console.log("   - Cada admin solo ve sus propios productos");
    console.log("   - Los productos vienen de la base de datos");
    console.log("   - Usuario super admin: superadmin / admin123");

    return { success: true, id_super_admin };
  } catch (error) {
    console.error("\n❌ Error durante la inicialización:");
    console.error(error.message);
    throw error;
  }
}
