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
  getPedidosByUserController, updatePedidoController, deletePedidoController
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
router.put("/pedidos/:id", updatePedidoController);
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

export default router;
