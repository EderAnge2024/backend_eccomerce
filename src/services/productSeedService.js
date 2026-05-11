import pool from "../../db.js";
import { initializeSuperAdmin } from "./superadminService.js";

/**
 * Productos iniciales para poblar la base de datos
 * Solo se ejecuta si no hay productos existentes
 */
const SEED_PRODUCTS = [
  {
    title: "Laptop Gaming Pro 15.6\"",
    price: 1299.99,
    description: "Potente laptop para gaming con RTX 4060, 16GB RAM, 512GB SSD",
    category: "Electrónica",
    image: "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg",
    rating_rate: 4.8,
    rating_count: 125
  },
  {
    title: "Smartphone Ultra X Pro",
    price: 899.99,
    description: "Último modelo con cámara triple de 108MP, 5G, 256GB almacenamiento",
    category: "Electrónica",
    image: "https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_.jpg",
    rating_rate: 4.6,
    rating_count: 234
  },
  {
    title: "Auriculares Inalámbricos Premium",
    price: 199.99,
    description: "Cancelación activa de ruido, 30h batería, calidad studio",
    category: "Electrónica",
    image: "https://fakestoreapi.com/img/71YAIFU48IL._AC_UL640_QL65_ML3_.jpg",
    rating_rate: 4.7,
    rating_count: 89
  },
  {
    title: "Smart Watch Series 5",
    price: 349.99,
    description: "Monitor de salud completo, GPS, resistente al agua, 7 días batería",
    category: "Electrónica",
    image: "https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_.jpg",
    rating_rate: 4.5,
    rating_count: 156
  },
  {
    title: "Tablet Profesional 11\"",
    price: 649.99,
    description: "Pantalla retina, lápiz óptico incluido, ideal para diseño y trabajo",
    category: "Electrónica",
    image: "https://fakestoreapi.com/img/71knw24rSZL._AC_SX679_.jpg",
    rating_rate: 4.4,
    rating_count: 67
  },
  {
    title: "Cámara DSLR Profesional 4K",
    price: 1899.99,
    description: "Sensor full frame, grabación 4K60, lentes intercambiables incluidos",
    category: "Electrónica",
    image: "https://fakestoreapi.com/img/71HblAHs5xL._AC_UY879_.jpg",
    rating_rate: 4.9,
    rating_count: 45
  },
  {
    title: "Monitor Gaming 27\" 4K",
    price: 599.99,
    description: "144Hz, 1ms respuesta, HDR, G-Sync compatible",
    category: "Electrónica",
    image: "https://fakestoreapi.com/img/71-61cFqGRbL._AC_UL320_QL65_ML3_.jpg",
    rating_rate: 4.6,
    rating_count: 78
  },
  {
    title: "Teclado Mecánico RGB",
    price: 149.99,
    description: "Switches Cherry MX, iluminación personalizable, construcción premium",
    category: "Electrónica",
    image: "https://fakestoreapi.com/img/71YHjVXRxwL._AC_UL640_QL65_ML3_.jpg",
    rating_rate: 4.5,
    rating_count: 112
  }
];

/**
 * Poblar productos iniciales asignados al superadmin
 * Solo se ejecuta si no hay productos en la base de datos
 */
export async function seedInitialProducts() {
  try {
    console.log("🔍 Verificando productos existentes...");

    // Verificar si ya existen productos
    const productCount = await pool.query(
      "SELECT COUNT(*) as count FROM productos"
    );

    const existingCount = parseInt(productCount.rows[0].count);
    
    if (existingCount > 0) {
      console.log(`✅ Ya existen ${existingCount} productos en la base de datos`);
      console.log("⚠️  No se poblarán productos adicionales");
      return { populated: false, count: existingCount };
    }

    // Obtener el superadmin
    const superAdmin = await pool.query(
      "SELECT id_usuario FROM usuarios WHERE es_super_admin = true LIMIT 1"
    );

    if (superAdmin.rows.length === 0) {
      console.warn("⚠️  No se encontró superadmin, buscando usuario 'superadmin'...");
      const fallback = await pool.query(
        "SELECT id_usuario FROM usuarios WHERE usuario = 'superadmin' LIMIT 1"
      );
      if (fallback.rows.length === 0) {
        console.error("❌ No se puede poblar productos sin superadmin");
        return { populated: false, count: 0 };
      }
    }

    const adminId = superAdmin.rows.length > 0 
      ? superAdmin.rows[0].id_usuario 
      : (await pool.query("SELECT id_usuario FROM usuarios WHERE usuario = 'superadmin' LIMIT 1")).rows[0].id_usuario;

    console.log(`👤 Asignando productos al superadmin (ID: ${adminId})`);
    console.log(`📦 Poblando ${SEED_PRODUCTS.length} productos iniciales...`);

    // Insertar cada producto
    const insertedProducts = [];
    for (const product of SEED_PRODUCTS) {
      const result = await pool.query(
        `INSERT INTO productos 
         (id_usuario, title, price, description, category, image, rating_rate, rating_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id_producto, title, price, category`,
        [
          adminId,
          product.title,
          product.price,
          product.description,
          product.category,
          product.image,
          product.rating_rate,
          product.rating_count
        ]
      );
      insertedProducts.push(result.rows[0]);
    }

    console.log("\n🎉 ===== PRODUCTOS POBLADOS EXITOSAMENTE =====");
    console.log(`📦 Total: ${insertedProducts.length} productos creados`);
    console.log(`👤 Administrador: Super Admin (ID: ${adminId})`);
    console.log("\n📋 Productos:");
    insertedProducts.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title} - S/ ${p.price}`);
    });
    console.log("==========================================\n");

    return { populated: true, count: insertedProducts.length, products: insertedProducts };

  } catch (error) {
    console.error("❌ Error poblando productos:", error.message);
    return { populated: false, count: 0, error: error.message };
  }
}

/**
 * Verificar estado de la base de datos
 */
export async function checkDatabaseStatus() {
  try {
    const userCount = await pool.query("SELECT COUNT(*) as count FROM usuarios");
    const productCount = await pool.query("SELECT COUNT(*) as count FROM productos");
    const superAdminCount = await pool.query("SELECT COUNT(*) as count FROM usuarios WHERE es_super_admin = true");

    return {
      usuarios: parseInt(userCount.rows[0].count),
      productos: parseInt(productCount.rows[0].count),
      super_admins: parseInt(superAdminCount.rows[0].count)
    };
  } catch (error) {
    console.error("❌ Error verificando estado:", error.message);
    return null;
  }
}
