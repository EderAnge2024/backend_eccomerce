import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import router from "./src/routes/index.js";
import "./src/models/database.js";
import { ENV_CONFIG } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./src/middlewares/errorHandler.js";
import { 
  generalLimiter,
  loginLimiter,
  registerLimiter,
  verificationCodeLimiter,
  adminLimiter,
  initRateLimiting,
  applyTrustProxy,
  rateLimitLogger
} from "./src/middlewares/rateLimiting.js";
import { 
  helmetConfig, 
  sanitizeInput, 
  securityLogger, 
  validateContentType,
  validatePayloadSize 
} from "./src/middlewares/security.js";

const app = express();

// ============ INICIALIZACIÓN DE RATE LIMITING (Redis) ============
// Debe hacerse antes de configurar los middlewares
initRateLimiting().catch(err => {
  console.error('🔴 Error crítico inicializando rate limiting:', err);
  if (ENV_CONFIG.isProduction()) {
    console.error('🔴 En producción, Redis es requerido. Deteniendo servidor.');
    process.exit(1);
  }
});

// ============ MIDDLEWARES DE SEGURIDAD (ORDEN IMPORTANTE) ============

// 0. Trust Proxy - Detectar IP real detrás de proxies/load balancers
applyTrustProxy(app);

// 0.1 Cookie Parser para manejar JWT en httpOnly cookies
app.use(cookieParser());

// 1. Helmet para headers de seguridad HTTP
app.use(helmetConfig);

// 2. Logger de rate limiting (opcional, para debugging)
app.use(rateLimitLogger);

// 3. Rate limiting general para toda la API
app.use(generalLimiter);

// 4. Validación de tamaño de payload
app.use(validatePayloadSize(5 * 1024 * 1024)); // 5MB máximo

// 5. CORS configurado
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (ENV_CONFIG.CORS.ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚨 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Token-Expiring']
}));

// 6. Parsing de JSON con límite de tamaño
app.use(express.json({ 
  limit: '5mb',
  strict: true,
  type: 'application/json'
}));

// 7. Validación de Content-Type
app.use(validateContentType);

// 8. Sanitización de entrada
app.use(sanitizeInput);

// 9. Logging de seguridad
app.use(securityLogger);

// ============ RUTAS ESPECÍFICAS CON RATE LIMITING ADICIONAL ============

// Login - Protegido contra fuerza bruta
const protectedLoginRoute = express.Router();
protectedLoginRoute.use(loginLimiter);

// Registro - Protegido contra spam
const protectedRegisterRoute = express.Router();
protectedRegisterRoute.use(registerLimiter);

// Código de verificación - Protegido contra spam
const protectedVerificationRoute = express.Router();
protectedVerificationRoute.use(verificationCodeLimiter);

// Admin - Protegido contra abuso
const protectedAdminRoute = express.Router();
protectedAdminRoute.use(adminLimiter);

// ============ RUTAS DE LA API ============
app.use("/api", router);

// ============ MIDDLEWARE DE MANEJO DE ERRORES ============
app.use(notFoundHandler);
app.use(errorHandler);

// ============ INICIAR SERVIDOR ============
const server = app.listen(ENV_CONFIG.PORT, ENV_CONFIG.HOST, () => {
  console.log(`\n✅ ===== SERVIDOR INICIADO =====`);
  console.log(`🌐 Servidor corriendo en http://${ENV_CONFIG.HOST}:${ENV_CONFIG.PORT}`);
  console.log(`📡 API disponible en http://${ENV_CONFIG.HOST}:${ENV_CONFIG.PORT}/api`);
  console.log(`🩺 Health check: http://${ENV_CONFIG.HOST}:${ENV_CONFIG.PORT}/api/health`);
  
  // Log de configuración de seguridad
  console.log(`\n🛡️  ===== CONFIGURACIÓN DE SEGURIDAD =====`);
  console.log(`🔒 Helmet: ✅ Activado`);
  console.log(`⏱️  Rate Limiting: ✅ ${ENV_CONFIG.RATE_LIMIT.MAX_REQUESTS} requests/${ENV_CONFIG.RATE_LIMIT.WINDOW_MS/1000/60}min`);
  console.log(`🔑 JWT: ✅ Configurado (${ENV_CONFIG.JWT_EXPIRES_IN} expiración)`);
  console.log(`🌐 CORS: ✅ ${ENV_CONFIG.CORS.ALLOWED_ORIGINS.length} orígenes permitidos`);
  console.log(`📦 Max payload: 5MB`);
  console.log(`🧼 Input sanitization: ✅ Activado`);
  console.log(`🔒 Trust Proxy: ✅ ${app.get('trust proxy') ? 'Configurado' : 'No configurado'}`);
  
  // Detalles específicos de rate limiting
  console.log(`\n📊 ===== RATE LIMITING DETALLE =====`);
  console.log(`🔐 Login: ${ENV_CONFIG.RATE_LIMIT.LOGIN_MAX_REQUESTS} intentos/15min (anti-fuerza bruta)`);
  console.log(`📝 Registro: ${ENV_CONFIG.RATE_LIMIT.REGISTER_MAX_REQUESTS} registros/1hora (anti-spam)`);
  console.log(`📧 Verificación: ${ENV_CONFIG.RATE_LIMIT.VERIFICATION_MAX_REQUESTS} códigos/1hora`);
  console.log(`🔧 Admin: ${ENV_CONFIG.RATE_LIMIT.ADMIN_MAX_REQUESTS} operaciones/1minuto`);
  console.log(`🔑 Password Reset: 3 intentos/1hora (crítico)`);
  
  if (ENV_CONFIG.isProduction()) {
    console.log(`\n🎯 Modo PRODUCCIÓN: Seguridad estricta activada`);
    console.log(`🔒 Headers de seguridad: Estrictos`);
    console.log(`🥷 Rate limiting distribuido: Redis`);
  } else {
    console.log(`\n🌍 Modo DESARROLLO: Logging detallado activado`);
    console.log(`ℹ️  Rate limiting: Redis (o memoria local si no disponible)`);
  }
  
  // Log configuration
  ENV_CONFIG.logConfig();
  
  console.log(`\n⚠️  IMPORTANTE: Cambiar credenciales por defecto antes de producción`);
  console.log(`=======================================\n`);
});

// Manejo graceful de cierre del servidor
const shutdown = () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  
  // Forzar cierre después de 10s
  setTimeout(() => {
    console.error('❌ Forzado shutdown después de timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;