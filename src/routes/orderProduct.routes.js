import express from "express";
import {
  createPedidoProductoController, getPedidoProductos, getPedidoProducto,
  getProductosByPedidoController, updatePedidoProductoController, deletePedidoProductoController
} from "../controllers/pedidoPordController.js";

const router = express.Router();

// ============ RUTAS ESPECIALES (deben ir primero) ============
router.get("/pedido/:id_pedido", getProductosByPedidoController);

// ============ RUTAS CRUD NORMALES ============
router.post("/", createPedidoProductoController);
router.get("/", getPedidoProductos);
router.get("/:id", getPedidoProducto);
router.put("/:id", updatePedidoProductoController);
router.delete("/:id", deletePedidoProductoController);

export default router;