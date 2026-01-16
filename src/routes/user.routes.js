import express from "express";
import { 
  register, login, verifyEmail, requestCode, 
  verifyCodeAndResetPassword, verifyCodeOnly,
  getUsers, getUser, updateUserController, deleteUserController,
  updateUserInfo, updateCredentials,
  createAdmin, promoteToAdmin, demoteAdmin, updateSuperAdminStatus
} from "../controllers/usersController.js";
import { validateUserRegistration, validateUserLogin, validateCredentialsUpdate } from "../middlewares/validation.js";
import { requireAuth, requireAdmin, requireOwnership, requireSuperAdmin } from "../middlewares/auth.js";
import { loginLimiter, registerLimiter, verificationCodeLimiter, adminLimiter } from "../middlewares/rateLimiting.js";

const router = express.Router();

// ============ RUTAS DE AUTENTICACIÓN (CON RATE LIMITING) ============
router.post("/register", registerLimiter, validateUserRegistration, register);
router.post("/login", loginLimiter, validateUserLogin, login);

// ============ RUTAS DE RECUPERACIÓN DE CONTRASEÑA (CON RATE LIMITING) ============
router.post("/verify-email", verificationCodeLimiter, verifyEmail);
router.post("/request-code", verificationCodeLimiter, requestCode);
router.post("/verify-code-reset", verificationCodeLimiter, verifyCodeAndResetPassword);
router.post("/verify-code", verificationCodeLimiter, verifyCodeOnly);

// ============ RUTAS CRUD DE USUARIOS (CON AUTENTICACIÓN) ============
// Solo super administradores pueden ver todos los usuarios
router.get("/", requireAuth, requireSuperAdmin, adminLimiter, getUsers);

// Los usuarios pueden ver su propio perfil, los admins pueden ver cualquiera
router.get("/:id", requireAuth, requireOwnership('id'), getUser);

// Solo administradores pueden actualizar cualquier usuario, usuarios solo el suyo
router.put("/:id", requireAuth, requireOwnership('id'), updateUserController);

// Solo super administradores pueden eliminar usuarios
router.delete("/:id", requireAuth, requireSuperAdmin, adminLimiter, deleteUserController);

// ============ RUTAS ESPECIALES (CON AUTENTICACIÓN) ============
// Ruta para actualizar información del perfil (DEBE IR ANTES de la ruta genérica /:id)
router.put("/update-info/:id", requireAuth, requireOwnership('id'), updateUserInfo);

// Ruta para actualizar credenciales (usuario y contraseña)
router.put("/update-credentials/:id", requireAuth, requireOwnership('id'), validateCredentialsUpdate, updateCredentials);

// ============ RUTAS DE GESTIÓN DE ADMINISTRADORES (SOLO SUPERADMIN) ============
// Solo el super administrador puede crear otros administradores
router.post("/create-admin", requireAuth, requireSuperAdmin, adminLimiter, createAdmin);

// Solo el super administrador puede promover usuarios a administradores
router.put("/promote-admin/:id", requireAuth, requireSuperAdmin, adminLimiter, promoteToAdmin);

// Solo el super administrador puede degradar administradores a clientes
router.put("/demote-admin/:id", requireAuth, requireSuperAdmin, adminLimiter, demoteAdmin);

// Ruta para actualizar estado de super administrador (temporal para desarrollo)
router.post("/update-super-admin", updateSuperAdminStatus);

export default router;