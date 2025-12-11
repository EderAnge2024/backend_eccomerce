import { 
  createProducto, getAllProductos, getProductoById, 
  getProductosByUser, getProductosByCategory, updateProducto, deleteProducto 
} from "./model.js";

// ============ CRUD PRODUCTOS ============

export async function createProductoController(req, res) {
  const { id_usuario, title, price, description, category, image, rating_rate, rating_count } = req.body;
  
  if (!id_usuario || !title || !price) {
    return res.status(400).json({ success: false, message: "Campos obligatorios: id_usuario, title, price" });
  }

  try {
    const newProducto = await createProducto(id_usuario, title, price, description, category, image, rating_rate, rating_count);
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
  const { title, price, description, category, image, rating_rate, rating_count } = req.body;
  
  if (!title || !price) {
    return res.status(400).json({ success: false, message: "Campos obligatorios: title, price" });
  }

  try {
    const updatedProducto = await updateProducto(id, title, price, description, category, image, rating_rate, rating_count);
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
