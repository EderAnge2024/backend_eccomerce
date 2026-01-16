import { 
  createProducto, getAllProductos, getProductoById, 
  getProductosByUser, getProductosByCategory, updateProducto, deleteProducto,
  reduceStock, increaseStock, checkStock, getProductosStockBajo,
  reservarStock, liberarStockReservado, confirmarDescuentoStock, 
  checkStockDisponible, getVistaStockCompleta
} from "../models/productos/model.js";

// ============ CRUD PRODUCTOS ============

export async function createProductoController(req, res) {
  const { id_usuario, title, price, description, category, image, rating_rate, rating_count, stock } = req.body;
  
  if (!id_usuario || !title || !price) {
    return res.status(400).json({ success: false, message: "Campos obligatorios: id_usuario, title, price" });
  }

  try {
    const stockValue = stock !== undefined ? parseInt(stock) : 0;
    const newProducto = await createProducto(id_usuario, title, price, description, category, image, rating_rate, rating_count, stockValue);
    res.json({ success: true, producto: newProducto });
  } catch (err) {
    console.error('Error en createProductoController:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getProductos(req, res) {
  try {
    const productos = await getAllProductos();
    res.json({ success: true, productos });
  } catch (err) {
    console.error('Error en getProductos:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getProducto(req, res) {
  const { id } = req.params;
  try {
    const producto = await getProductoById(id);
    if (!producto) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }
    res.json({ success: true, producto });
  } catch (err) {
    console.error('Error en getProducto:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getProductosByUserController(req, res) {
  const { id_usuario } = req.params;
  try {
    const productos = await getProductosByUser(id_usuario);
    res.json({ success: true, productos });
  } catch (err) {
    console.error('Error en getProductosByUserController:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getProductosByCategoryController(req, res) {
  const { category } = req.params;
  try {
    const productos = await getProductosByCategory(category);
    res.json({ success: true, productos });
  } catch (err) {
    console.error('Error en getProductosByCategoryController:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateProductoController(req, res) {
  const { id } = req.params;
  const { title, price, description, category, image, rating_rate, rating_count, stock } = req.body;
  
  if (!title || !price) {
    return res.status(400).json({ success: false, message: "Campos obligatorios: title, price" });
  }

  try {
    const stockValue = stock !== undefined ? parseInt(stock) : 0;
    const updatedProducto = await updateProducto(id, title, price, description, category, image, rating_rate, rating_count, stockValue);
    if (!updatedProducto) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }
    res.json({ success: true, producto: updatedProducto });
  } catch (err) {
    console.error('Error en updateProductoController:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteProductoController(req, res) {
  const { id } = req.params;
  try {
    const deletedProducto = await deleteProducto(id);
    if (!deletedProducto) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }
    res.json({ success: true, message: "Producto eliminado", producto: deletedProducto });
  } catch (err) {
    console.error('Error en deleteProductoController:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// ============ GESTIÓN DE STOCK ============

export async function checkStockController(req, res) {
  const { id } = req.params;
  const { cantidad } = req.query;
  
  try {
    const cantidadNum = parseInt(cantidad) || 1;
    const stockCheck = await checkStock(id, cantidadNum);
    res.json({ success: true, ...stockCheck });
  } catch (err) {
    console.error('Error en checkStockController:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function reduceStockController(req, res) {
  const { id } = req.params;
  const { cantidad } = req.body;
  
  if (!cantidad || cantidad <= 0) {
    return res.status(400).json({ success: false, message: "Cantidad debe ser mayor a 0" });
  }

  try {
    // Verificar stock antes de reducir
    const stockCheck = await checkStock(id, cantidad);
    if (!stockCheck.available) {
      return res.status(400).json({ success: false, message: stockCheck.message });
    }

    const updatedProducto = await reduceStock(id, cantidad);
    if (!updatedProducto) {
      return res.status(400).json({ success: false, message: "No se pudo reducir el stock. Stock insuficiente." });
    }
    
    res.json({ 
      success: true, 
      message: `Stock reducido en ${cantidad} unidades`, 
      producto: updatedProducto 
    });
  } catch (err) {
    console.error('Error en reduceStockController:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function increaseStockController(req, res) {
  const { id } = req.params;
  const { cantidad } = req.body;
  
  if (!cantidad || cantidad <= 0) {
    return res.status(400).json({ success: false, message: "Cantidad debe ser mayor a 0" });
  }

  try {
    const updatedProducto = await increaseStock(id, cantidad);
    if (!updatedProducto) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }
    
    res.json({ 
      success: true, 
      message: `Stock aumentado en ${cantidad} unidades`, 
      producto: updatedProducto 
    });
  } catch (err) {
    console.error('Error en increaseStockController:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getProductosStockBajoController(req, res) {
  const { limite } = req.query;
  
  try {
    const limiteNum = parseInt(limite) || 5;
    const productos = await getProductosStockBajo(limiteNum);
    res.json({ success: true, productos, limite: limiteNum });
  } catch (err) {
    console.error('Error en getProductosStockBajoController:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// ============ GESTIÓN DE STOCK RESERVADO ============

export async function reservarStockController(req, res) {
  const { id } = req.params;
  const { cantidad } = req.body;
  
  if (!cantidad || cantidad <= 0) {
    return res.status(400).json({ success: false, message: "Cantidad debe ser mayor a 0" });
  }

  try {
    // Verificar stock disponible antes de reservar
    const stockCheck = await checkStockDisponible(id, cantidad);
    if (!stockCheck.available) {
      return res.status(400).json({ success: false, message: stockCheck.message });
    }

    const updatedProducto = await reservarStock(id, cantidad);
    if (!updatedProducto) {
      return res.status(400).json({ success: false, message: "No se pudo reservar el stock. Stock insuficiente." });
    }
    
    res.json({ 
      success: true, 
      message: `Stock reservado: ${cantidad} unidades`, 
      producto: updatedProducto 
    });
  } catch (err) {
    console.error('Error en reservarStockController:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function liberarStockReservadoController(req, res) {
  const { id } = req.params;
  const { cantidad } = req.body;
  
  if (!cantidad || cantidad <= 0) {
    return res.status(400).json({ success: false, message: "Cantidad debe ser mayor a 0" });
  }

  try {
    const updatedProducto = await liberarStockReservado(id, cantidad);
    if (!updatedProducto) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }
    
    res.json({ 
      success: true, 
      message: `Stock liberado: ${cantidad} unidades`, 
      producto: updatedProducto 
    });
  } catch (err) {
    console.error('Error en liberarStockReservadoController:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function confirmarDescuentoStockController(req, res) {
  const { id } = req.params;
  const { cantidad } = req.body;
  
  if (!cantidad || cantidad <= 0) {
    return res.status(400).json({ success: false, message: "Cantidad debe ser mayor a 0" });
  }

  try {
    const updatedProducto = await confirmarDescuentoStock(id, cantidad);
    if (!updatedProducto) {
      return res.status(400).json({ success: false, message: "No se pudo confirmar el descuento. Stock insuficiente." });
    }
    
    res.json({ 
      success: true, 
      message: `Stock descontado definitivamente: ${cantidad} unidades`, 
      producto: updatedProducto 
    });
  } catch (err) {
    console.error('Error en confirmarDescuentoStockController:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function checkStockDisponibleController(req, res) {
  const { id } = req.params;
  const { cantidad } = req.query;
  
  try {
    const cantidadNum = parseInt(cantidad) || 1;
    const stockCheck = await checkStockDisponible(id, cantidadNum);
    res.json({ success: true, ...stockCheck });
  } catch (err) {
    console.error('Error en checkStockDisponibleController:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getVistaStockCompletaController(req, res) {
  try {
    const productos = await getVistaStockCompleta();
    res.json({ success: true, productos });
  } catch (err) {
    console.error('Error en getVistaStockCompletaController:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
