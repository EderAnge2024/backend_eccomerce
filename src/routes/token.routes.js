import express from "express";
import {
  createTokenController, getTokens, getToken,
  getTokensByUserController, updateTokenController, deleteTokenController,
  cleanExpiredTokensController
} from "../controllers/tokenController.js";

const router = express.Router();

// ============ RUTAS ESPECIALES (deben ir primero) ============
router.get("/usuario/:id_usuario", getTokensByUserController);
router.delete("/expired", cleanExpiredTokensController); // Limpiar tokens expirados

// ============ RUTAS CRUD NORMALES ============
router.post("/", createTokenController);
router.get("/", getTokens);
router.get("/:id", getToken);
router.put("/:id", updateTokenController);
router.delete("/:id", deleteTokenController);

export default router;