import { getAllProductos } from "../models/productos/model.js";
import fetch from "node-fetch";

// Obtener productos (Prioriza BD, usa API solo como respaldo/poblado)
export async function getProductosCombinados(req, res) {
  try {
    console.log('🔍 Obteniendo productos...');

    // 1. Obtener productos de la BD
    let productosDB = await getAllProductos();
    console.log(`   📦 Productos encontrados en BD: ${productosDB.length}`);

    // 2. Si la BD está vacía, intentamos obtener de la API para mostrar algo (Fallback)
    let productosAPI = [];
    if (productosDB.length === 0) {
      console.log('   ⚠️ Base de datos vacía. Intentando cargar desde API externa...');
      try {
        const response = await fetch("https://fakestoreapi.com/products");
        productosAPI = await response.json();
        console.log(`   🌐 Productos obtenidos de API: ${productosAPI.length}`);
      } catch (error) {
        console.error('   ❌ Error obteniendo productos de API:', error.message);
      }
    }

    // 3. Transformar productos de BD
    const productosDBTransformados = productosDB.map(p => ({
      id: p.id_producto,
      title: p.title,
      price: parseFloat(p.price),
      description: p.description,
      category: p.category,
      image: p.image,
      rating: {
        rate: p.rating_rate ? parseFloat(p.rating_rate) : 0,
        count: p.rating_count || 0
      },
      stock: p.stock || 0,
      source: 'database'
    }));

    // 4. Transformar productos de API (solo si la BD estaba vacía)
    const productosAPITransformados = productosAPI.map(p => ({
      ...p,
      stock: 0,
      source: 'api_fallback'
    }));

    // 5. El resultado final
    const productosFinales = productosDBTransformados.length > 0 
      ? productosDBTransformados 
      : productosAPITransformados;

    console.log(`   ✅ Enviando ${productosFinales.length} productos.`);

    res.json({
      success: true,
      productos: productosFinales,
      stats: {
        database: productosDBTransformados.length,
        api_fallback: productosAPITransformados.length,
        total: productosFinales.length
      }
    });
  } catch (error) {
    console.error('❌ Error en getProductosCombinados:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Obtener solo productos de la BD
export async function getProductosDB(req, res) {
  try {
    const productos = await getAllProductos();
    
    const productosTransformados = productos.map(p => ({
      id: p.id_producto,
      title: p.title,
      price: parseFloat(p.price),
      description: p.description,
      category: p.category,
      image: p.image,
      rating: {
        rate: p.rating_rate ? parseFloat(p.rating_rate) : 0,
        count: p.rating_count || 0
      },
      stock: p.stock || 0, // ✅ AGREGADO: Campo stock
      source: 'database'
    }));

    res.json({
      success: true,
      productos: productosTransformados
    });
  } catch (error) {
    console.error('❌ Error en getProductosDB:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
