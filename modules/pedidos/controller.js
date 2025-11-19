import { 
  createPedido, getAllPedidos, getPedidoById, getPedidosByUser, 
  updatePedido, deletePedido 
} from "./model.js";

// Crear pedido
export async function createPedidoController(req, res) {
  const { id_usuario, total } = req.body;
  
  if (!id_usuario || !total) {
    return res.status(400).json({ success: false, message: "id_usuario y total son obligatorios" });
  }

  try {
    const newPedido = await createPedido(id_usuario, total);
    res.json({ success: true, pedido: newPedido });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Obtener todos los pedidos
export async function getPedidos(req, res) {
  try {
    const pedidos = await getAllPedidos();
    res.json({ success: true, pedidos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Obtener pedido por ID
export async function getPedido(req, res) {
  const { id } = req.params;
  try {
    const pedido = await getPedidoById(id);
    if (!pedido) {
      return res.status(404).json({ success: false, message: "Pedido no encontrado" });
    }
    res.json({ success: true, pedido });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Obtener pedidos por usuario
export async function getPedidosByUserController(req, res) {
  const { id_usuario } = req.params;
  try {
    const pedidos = await getPedidosByUser(id_usuario);
    res.json({ success: true, pedidos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Actualizar pedido
export async function updatePedidoController(req, res) {
  const { id } = req.params;
  const { total } = req.body;
  
  if (!total) {
    return res.status(400).json({ success: false, message: "El total es obligatorio" });
  }

  try {
    const updatedPedido = await updatePedido(id, total);
    if (!updatedPedido) {
      return res.status(404).json({ success: false, message: "Pedido no encontrado" });
    }
    res.json({ success: true, pedido: updatedPedido });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Eliminar pedido
export async function deletePedidoController(req, res) {
  const { id } = req.params;
  try {
    const deletedPedido = await deletePedido(id);
    if (!deletedPedido) {
      return res.status(404).json({ success: false, message: "Pedido no encontrado" });
    }
    res.json({ success: true, message: "Pedido eliminado", pedido: deletedPedido });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
