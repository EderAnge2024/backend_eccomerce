import { getAllProductos } from "./model.js";
import fetch from "node-fetch";

// Obtener productos combinados de BD y API
export async function getProductosCombinados(req, res) {
  try {
    console.log('🔍 Obteniendo productos combinados...');

    // 1. Obtener productos de la BD
    const productosDB = await getAllProductos();
    console.log(`   📦 Productos de BD: ${productosDB.length}`);

    // 2. Obtener productos de FakeStore API
    let productosAPI = [];
    try {
      const response = await fetch("https://fakestoreapi.com/products");
      productosAPI = await response.json();
      console.log(`   🌐 Productos de API: ${productosAPI.length}`);
    } catch (error) {
      console.error('   ⚠️ Error obteniendo productos de API:', error.message);
    }

    // 3. Transformar productos de BD al formato de la API
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
      source: 'database' // Identificador de origen
    }));

    // 4. Transformar productos de API
    const productosAPITransformados = productosAPI.map(p => ({
      ...p,
      source: 'api' // Identificador de origen
    }));

    // 5. Combinar productos (BD primero, luego API)
    const productosCombinados = [...productosDBTransformados, ...productosAPITransformados];

    console.log(`   ✅ Total productos combinados: ${productosCombinados.length}`);

    res.json({
      success: true,
      productos: productosCombinados,
      stats: {
        database: productosDBTransformados.length,
        api: productosAPITransformados.length,
        total: productosCombinados.length
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
