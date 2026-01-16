// Rutas para ventas presenciales (Punto de Venta)

import express from "express";
import { 
  buscarProductos, 
  crearVentaPresencial, 
  resumenVentasDelDia 
} from "../controllers/ventaPresencialController.js";
import { requireAuth, requireSuperAdmin } from "../middlewares/auth.js";
import { adminLimiter } from "../middlewares/rateLimiting.js";

const router = express.Router();

// ============ RUTAS DE PUNTO DE VENTA (SOLO SUPER ADMINISTRADOR) ============

// Buscar productos disponibles para venta presencial
router.get("/productos", requireAuth, requireSuperAdmin, adminLimiter, buscarProductos);

// Crear venta presencial
router.post("/crear", requireAuth, requireSuperAdmin, adminLimiter, crearVentaPresencial);

// Obtener resumen de ventas del día
router.get("/resumen-dia", requireAuth, requireSuperAdmin, adminLimiter, resumenVentasDelDia);

export default router;