import express from "express";
import {
  createPedidoController, getPedidos, getPedido, 
  getPedidosByUserController, updatePedidoController, 
  updatePedidoEstadoController, deletePedidoController,
  getPedidosByAdminController
} from "../controllers/pedidoController.js";
import {
  procesarCompraMultiVendedorController,
  getPedidosByVendedorController,
  getResumenPedidoMaestroController,
  previewDivisionPorVendedorController,
  getNotificacionesPedidosController,
  marcarNotificacionLeidaController
} from "../controllers/multi-vendor-controller.js";
import { 
  cambiarEstadoPedidoConStock, 
  getResumenStockPedido 
} from "../controllers/stockPedidoController.js";
import { requireAuth, requireAdmin, requireOwnership } from "../middlewares/auth.js";
import { createResourceLimiter, adminLimiter } from "../middlewares/rateLimiting.js";

const router = express.Router();

// ============ RUTAS MULTI-VENDEDOR (CON AUTENTICACIÓN) ============
router.post("/multi-vendor", requireAuth, createResourceLimiter, procesarCompraMultiVendedorController);
router.post("/preview-division", requireAuth, previewDivisionPorVendedorController);
router.get("/vendedor/:id_vendedor", requireAuth, requireAdmin, getPedidosByVendedorController);
router.get("/maestro/:id_pedido_maestro", requireAuth, getResumenPedidoMaestroController);
router.get("/notificaciones/:id_usuario", requireAuth, requireOwnership('id_usuario'), getNotificacionesPedidosController);
router.put("/notificaciones/:id_notificacion/leer", requireAuth, marcarNotificacionLeidaController);

// ============ RUTAS TRADICIONALES (CON AUTENTICACIÓN) ============
router.post("/", requireAuth, createResourceLimiter, createPedidoController);
router.get("/", requireAuth, requireAdmin, adminLimiter, getPedidos);
router.get("/:id", requireAuth, getPedido);
router.get("/usuario/:id_usuario", requireAuth, requireOwnership('id_usuario'), getPedidosByUserController);
router.get("/admin/:id_admin", requireAuth, requireAdmin, getPedidosByAdminController);
router.put("/:id", requireAuth, updatePedidoController);
router.put("/:id/estado", requireAuth, requireAdmin, updatePedidoEstadoController);
router.delete("/:id", requireAuth, requireAdmin, adminLimiter, deletePedidoController);

// ============ GESTIÓN DE STOCK EN PEDIDOS ============
// Cambiar estado de pedido con gestión automática de stock
router.put("/:id_pedido/estado-con-stock", requireAuth, requireAdmin, cambiarEstadoPedidoConStock);

// Obtener resumen de stock de un pedido
router.get("/:id_pedido/resumen-stock", requireAuth, requireAdmin, getResumenStockPedido);

export default router;