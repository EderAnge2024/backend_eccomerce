import { 
  createPedidoProducto, getAllPedidoProductos, getPedidoProductoById, 
  getProductosByPedido, updatePedidoProducto, deletePedidoProducto 
} from "./model.js";

// Crear pedido_producto
export async function createPedidoProductoController(req, res) {
  const { id_pedido, id_producto, cantidad, precio } = req.body;
  
  if (!id_pedido || !id_producto || !cantidad || !precio) {
    return res.status(400).json({ 
      success: false, 
      message: "id_pedido, id_producto, cantidad y precio son obligatorios" 
    });
  }

  try {
    const newPedidoProducto = await createPedidoProducto(id_pedido, id_producto, cantidad, precio);
    res.json({ success: true, pedidoProducto: newPedidoProducto });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Obtener todos los pedido_producto
export async function getPedidoProductos(req, res) {
  try {
    const pedidoProductos = await getAllPedidoProductos();
    res.json({ success: true, pedidoProductos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Obtener pedido_producto por ID
export async function getPedidoProducto(req, res) {
  const { id } = req.params;
  try {
    const pedidoProducto = await getPedidoProductoById(id);
    if (!pedidoProducto) {
      return res.status(404).json({ success: false, message: "Pedido producto no encontrado" });
    }
    res.json({ success: true, pedidoProducto });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Obtener productos por pedido
export async function getProductosByPedidoController(req, res) {
  const { id_pedido } = req.params;
  try {
    const productos = await getProductosByPedido(id_pedido);
    res.json({ success: true, productos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Actualizar pedido_producto
export async function updatePedidoProductoController(req, res) {
  const { id } = req.params;
  const { cantidad, precio } = req.body;
  
  if (!cantidad || !precio) {
    return res.status(400).json({ success: false, message: "cantidad y precio son obligatorios" });
  }

  try {
    const updatedPedidoProducto = await updatePedidoProducto(id, cantidad, precio);
    if (!updatedPedidoProducto) {
      return res.status(404).json({ success: false, message: "Pedido producto no encontrado" });
    }
    res.json({ success: true, pedidoProducto: updatedPedidoProducto });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Eliminar pedido_producto
export async function deletePedidoProductoController(req, res) {
  const { id } = req.params;
  try {
    const deletedPedidoProducto = await deletePedidoProducto(id);
    if (!deletedPedidoProducto) {
      return res.status(404).json({ success: false, message: "Pedido producto no encontrado" });
    }
    res.json({ success: true, message: "Pedido producto eliminado", pedidoProducto: deletedPedidoProducto });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
