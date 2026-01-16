import express from "express";
import {
  createUbicacionController, getUbicaciones, getUbicacion,
  getUbicacionesByUserController, updateUbicacionController, deleteUbicacionController
} from "../controllers/ubicacionController.js";

const router = express.Router();

// ============ RUTAS ESPECIALES (deben ir primero) ============
router.get("/usuario/:id_usuario", getUbicacionesByUserController);

// ============ RUTAS CRUD NORMALES ============
router.post("/", createUbicacionController);
router.get("/", getUbicaciones);
router.get("/:id", getUbicacion);
router.put("/:id", updateUbicacionController);
router.delete("/:id", deleteUbicacionController);

export default router;