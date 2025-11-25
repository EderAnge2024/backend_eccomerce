import express from "express";

// Importar controladores de usuarios
import { 
  register, login, verifyEmail, requestCode, 
  verifyCodeAndResetPassword, verifyCodeOnly,
  getUsers, getUser, updateUserController, deleteUserController,
  updateUserInfo
} from "./users/controller.js";

// Importar controladores de pedidos
import {
  createPedidoController, getPedidos, getPedido, 
  getPedidosByUserController, updatePedidoController, 
  updatePedidoEstadoController, deletePedidoController,
  getPedidosByAdminController
} from "./pedidos/controller.js";

// Importar controladores de pedido_producto
import {
  createPedidoProductoController, getPedidoProductos, getPedidoProducto,
  getProductosByPedidoController, updatePedidoProductoController, deletePedidoProductoController
} from "./pedidosProductos/controller.js";

// Importar controladores de token
import {
  createTokenController, getTokens, getToken, getTokensByUserController,
  updateTokenController, deleteTokenController, cleanExpiredTokensController
} from "./token/controller.js";

// Importar controladores de ubicación
import {
  createUbicacionController, getUbicaciones, getUbicacion,
  getUbicacionesByUserController, updateUbicacionController, deleteUbicacionController
} from "./ubicacion/controller.js";

// Importar controladores de productos
import {
  createProductoController, getProductos, getProducto,
  getProductosByUserController, getProductosByCategoryController,
  updateProductoController, deleteProductoController
} from "./productos/controller.js";

// Importar controladores de productos combinados
import {
  getProductosCombinados, getProductosDB
} from "./productos/combined-controller.js";

const router = express.Router();

// ============ RUTAS DE USUARIOS ============
router.post("/usuarios/register", register);
router.post("/usuarios/login", login);
router.get("/usuarios", getUsers);

// Ruta para actualizar información del perfil (DEBE IR ANTES de la ruta genérica /:id)
router.put("/usuarios/update-info/:id", updateUserInfo);

router.get("/usuarios/:id", getUser);
router.put("/usuarios/:id", updateUserController);
router.delete("/usuarios/:id", deleteUserController);

// Rutas de recuperación de contraseña
router.post("/usuarios/verify-email", verifyEmail);
router.post("/usuarios/request-code", requestCode);
router.post("/usuarios/verify-code-reset", verifyCodeAndResetPassword);
router.post("/usuarios/verify-code", verifyCodeOnly);

// ============ RUTAS DE PEDIDOS ============
router.post("/pedidos", createPedidoController);
router.get("/pedidos", getPedidos);
router.get("/pedidos/:id", getPedido);
router.get("/pedidos/usuario/:id_usuario", getPedidosByUserController);
router.get("/pedidos/admin/:id_admin", getPedidosByAdminController); // Pedidos con productos del admin
router.put("/pedidos/:id", updatePedidoController);
router.put("/pedidos/:id/estado", updatePedidoEstadoController);
router.delete("/pedidos/:id", deletePedidoController);

// ============ RUTAS DE PEDIDO_PRODUCTO ============
router.post("/pedido-productos", createPedidoProductoController);
router.get("/pedido-productos", getPedidoProductos);
router.get("/pedido-productos/:id", getPedidoProducto);
router.get("/pedido-productos/pedido/:id_pedido", getProductosByPedidoController);
router.put("/pedido-productos/:id", updatePedidoProductoController);
router.delete("/pedido-productos/:id", deletePedidoProductoController);

// ============ RUTAS DE TOKEN ============
router.post("/tokens", createTokenController);
router.get("/tokens", getTokens);
router.get("/tokens/:id", getToken);
router.get("/tokens/usuario/:id_usuario", getTokensByUserController);
router.put("/tokens/:id", updateTokenController);
router.delete("/tokens/:id", deleteTokenController);
router.delete("/tokens/clean/expired", cleanExpiredTokensController);

// ============ RUTAS DE UBICACIÓN ============
router.post("/ubicaciones", createUbicacionController);
router.get("/ubicaciones", getUbicaciones);
router.get("/ubicaciones/:id", getUbicacion);
router.get("/ubicaciones/usuario/:id_usuario", getUbicacionesByUserController);
router.put("/ubicaciones/:id", updateUbicacionController);
router.delete("/ubicaciones/:id", deleteUbicacionController);

// ============ RUTAS DE PRODUCTOS ============
// Rutas especiales (deben ir primero)
router.get("/productos/combinados", getProductosCombinados); // BD + API
router.get("/productos/database", getProductosDB); // Solo BD
router.get("/productos/usuario/:id_usuario", getProductosByUserController);
router.get("/productos/categoria/:category", getProductosByCategoryController);

// Rutas CRUD normales
router.post("/productos", createProductoController);
router.get("/productos", getProductos); // Solo BD
router.get("/productos/:id", getProducto);
router.put("/productos/:id", updateProductoController);
router.delete("/productos/:id", deleteProductoController);

export default router;
