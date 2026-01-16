// Rutas para comprobantes de ventas

import express from "express";
import { generarComprobante, previsualizarComprobante } from "../controllers/comprobanteController.js";
import { requireAuth, requireAdmin, optionalAuth } from "../middlewares/auth.js";
import { adminLimiter } from "../middlewares/rateLimiting.js";

const router = express.Router();

// ============ RUTAS DE COMPROBANTES (SOLO ADMINISTRADORES) ============

// Generar comprobante PDF para descarga (requiere autenticación de administrador)
router.get("/generar/:id_pedido", requireAuth, requireAdmin, adminLimiter, generarComprobante);

// Generar comprobante con token en query (para abrir en navegador)
router.get("/generar-url/:id_pedido", optionalAuth, adminLimiter, async (req, res, next) => {
  // Verificar token en query params
  const token = req.query.token;
  if (token) {
    req.headers.authorization = `Bearer ${token}`;
  }
  
  // Aplicar middleware de autenticación manualmente
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    requireAdmin(req, res, (err) => {
      if (err) return next(err);
      generarComprobante(req, res, next);
    });
  });
});

// Previsualizar datos del comprobante (JSON)
router.get("/preview/:id_pedido", requireAuth, requireAdmin, adminLimiter, previsualizarComprobante);

export default router;