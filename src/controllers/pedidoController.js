import { 
  createPedido, getAllPedidos, getPedidoById, getPedidosByUser, 
  updatePedido, updatePedidoEstado, deletePedido, getPedidosByAdmin 
} from "../models/pedidos/model.js";

// ============ CONTROLADORES DE PEDIDOS ============
// Estos controladores manejan las peticiones HTTP y llaman a las funciones del modelo

/**
 * Crear un nuevo pedido
 * POST /api/pedidos
 * Body: { id_usuario, total, id_ubicacion (opcional) }
 */
export async function createPedidoController(req, res) {
  const { id_usuario, total, id_ubicacion } = req.body;
  
  console.log('📝 Crear pedido - Body recibido:', req.body);
  
  if (!id_usuario || !total) {
    return res.status(400).json({ success: false, message: "id_usuario y total son obligatorios" });
  }

  try {
    const newPedido = await createPedido(id_usuario, total, id_ubicacion);
    console.log('✅ Pedido creado:', newPedido);
    res.json({ success: true, pedido: newPedido });
  } catch (err) {
    console.error('❌ Error creando pedido:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Obtener todos los pedidos del sistema
 * GET /api/pedidos
 * Uso: Super administrador para ver todos los pedidos
 */
export async function getPedidos(req, res) {
  try {
    const pedidos = await getAllPedidos();
    res.json({ success: true, pedidos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Obtener un pedido específico por ID
 * GET /api/pedidos/:id
 */
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

/**
 * Obtener pedidos de un usuario específico (cliente)
 * GET /api/pedidos/usuario/:id_usuario
 * Uso: Cliente ve su historial de compras
 */
export async function getPedidosByUserController(req, res) {
  const { id_usuario } = req.params;
  try {
    const pedidos = await getPedidosByUser(id_usuario);
    res.json({ success: true, pedidos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Actualizar un pedido (total y/o estado)
 * PUT /api/pedidos/:id
 * Body: { total, estado }
 */
export async function updatePedidoController(req, res) {
  const { id } = req.params;
  const { total, estado } = req.body;
  
  if (!total && !estado) {
    return res.status(400).json({ success: false, message: "Debe proporcionar al menos total o estado" });
  }

  try {
    let updatedPedido;
    
    // Si solo se actualiza el estado
    if (estado && !total) {
      updatedPedido = await updatePedidoEstado(id, estado);
    } else {
      // Si se actualiza total y opcionalmente estado
      updatedPedido = await updatePedido(id, total, estado || 'Pendiente');
    }
    
    if (!updatedPedido) {
      return res.status(404).json({ success: false, message: "Pedido no encontrado" });
    }
    res.json({ success: true, pedido: updatedPedido });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Actualizar solo el estado de un pedido
 * PUT /api/pedidos/:id/estado
 * Body: { estado: 'Pendiente' | 'En proceso' | 'Entregado' }
 * Uso: Administradores cambian el estado de los pedidos
 */
export async function updatePedidoEstadoController(req, res) {
  const { id } = req.params;
  const { estado } = req.body;
  
  if (!estado) {
    return res.status(400).json({ success: false, message: "El estado es obligatorio" });
  }

  const estadosValidos = ['Pendiente', 'En proceso', 'Entregado'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ 
      success: false, 
      message: "Estado inválido. Debe ser: Pendiente, En proceso o Entregado" 
    });
  }

  try {
    const updatedPedido = await updatePedidoEstado(id, estado);
    if (!updatedPedido) {
      return res.status(404).json({ success: false, message: "Pedido no encontrado" });
    }
    res.json({ success: true, pedido: updatedPedido });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Eliminar un pedido
 * DELETE /api/pedidos/:id
 */
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

/**
 * Obtener pedidos que contienen productos de un administrador específico
 * GET /api/pedidos/admin/:id_admin
 * Uso: Administrador ve solo los pedidos que incluyen sus productos
 * 
 * Ejemplo: Si Admin A tiene productos [1,2,3] y un pedido contiene el producto 2,
 * ese pedido aparecerá en la lista del Admin A
 * 
 * IMPORTANTE: Convierte id_producto de string a integer para hacer el JOIN correctamente
 */
export async function getPedidosByAdminController(req, res) {
  const { id_admin } = req.params;
  
  console.log(`📦 Obteniendo pedidos para admin ID: ${id_admin}`);
  
  try {
    const pedidos = await getPedidosByAdmin(id_admin);
    console.log(`✅ Pedidos encontrados: ${pedidos.length}`);
    res.json({ success: true, pedidos });
  } catch (err) {
    console.error('❌ Error en getPedidosByAdminController:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
