import express from "express";
import userRoutes from "./user.routes.js";
import productRoutes from "./product.routes.js";
import orderRoutes from "./order.routes.js";
import orderProductRoutes from "./orderProduct.routes.js";
import locationRoutes from "./location.routes.js";
import tokenRoutes from "./token.routes.js";
import comprobanteRoutes from "./comprobante.routes.js";
import ventaPresencialRoutes from "./ventaPresencial.routes.js";

const router = express.Router();

// ============ CONFIGURAR RUTAS ============
router.use("/usuarios", userRoutes);
router.use("/productos", productRoutes);
router.use("/pedidos", orderRoutes);
router.use("/pedido-productos", orderProductRoutes);
router.use("/ubicaciones", locationRoutes);
router.use("/tokens", tokenRoutes);
router.use("/comprobantes", comprobanteRoutes);
router.use("/venta-presencial", ventaPresencialRoutes);

// ============ RUTA DE SALUD ============
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API funcionando correctamente",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// ============ RUTA 404 ============
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.method} ${req.originalUrl} no encontrada`,
    timestamp: new Date().toISOString()
  });
});

export default router;