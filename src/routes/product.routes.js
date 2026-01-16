import express from "express";
import { 
  createProductoController, getProductos, getProducto,
  getProductosByUserController, getProductosByCategoryController,
  updateProductoController, deleteProductoController,
  checkStockController, reduceStockController, increaseStockController,
  getProductosStockBajoController, reservarStockController, 
  liberarStockReservadoController, confirmarDescuentoStockController,
  checkStockDisponibleController, getVistaStockCompletaController
} from "../controllers/productosController.js";
import { 
  getProductosCombinados, getProductosDB
} from "../controllers/porductos-combined-controller.js";
import { requireAuth, requireAdmin, optionalAuth } from "../middlewares/auth.js";
import { createResourceLimiter, adminLimiter } from "../middlewares/rateLimiting.js";

const router = express.Router();

// ============ RUTAS ESPECIALES (deben ir primero) ============
// Estas rutas pueden ser públicas para mostrar productos en el catálogo
router.get("/combinados", optionalAuth, getProductosCombinados); // BD + API externa
router.get("/database", optionalAuth, getProductosDB); // Solo BD
router.get("/usuario/:id_usuario", requireAuth, getProductosByUserController);
router.get("/categoria/:category", optionalAuth, getProductosByCategoryController);

// ============ RUTAS CRUD NORMALES ============
// Solo administradores pueden crear productos
router.post("/", requireAuth, requireAdmin, createResourceLimiter, createProductoController);

// Productos pueden ser vistos por todos (catálogo público)
router.get("/", optionalAuth, getProductos);
router.get("/:id", optionalAuth, getProducto);

// Solo administradores pueden actualizar/eliminar productos
router.put("/:id", requireAuth, requireAdmin, updateProductoController);
router.delete("/:id", requireAuth, requireAdmin, adminLimiter, deleteProductoController);

// ============ GESTIÓN DE STOCK ============
// Verificar stock disponible (público para mostrar disponibilidad)
router.get("/:id/stock", optionalAuth, checkStockController);
router.get("/:id/stock-disponible", optionalAuth, checkStockDisponibleController);

// Solo administradores pueden gestionar stock
router.post("/:id/stock/reduce", requireAuth, requireAdmin, reduceStockController);
router.post("/:id/stock/increase", requireAuth, requireAdmin, increaseStockController);

// Gestión de stock reservado (solo administradores)
router.post("/:id/stock/reservar", requireAuth, requireAdmin, reservarStockController);
router.post("/:id/stock/liberar", requireAuth, requireAdmin, liberarStockReservadoController);
router.post("/:id/stock/confirmar", requireAuth, requireAdmin, confirmarDescuentoStockController);

// Productos con stock bajo y vista completa (solo administradores)
router.get("/admin/stock-bajo", requireAuth, requireAdmin, getProductosStockBajoController);
router.get("/admin/vista-stock", requireAuth, requireAdmin, getVistaStockCompletaController);

export default router;