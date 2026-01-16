import express from "express";
import cors from "cors";
import router from "./src/routes/index.js";
import "./src/models/database.js";
import { ENV_CONFIG } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./src/middlewares/errorHandler.js";
import { generalLimiter } from "./src/middlewares/rateLimiting.js";
import { 
  helmetConfig, 
  sanitizeInput, 
  securityLogger, 
  validateContentType,
  validatePayloadSize 
} from "./src/middlewares/security.js";

const app = express();

// ============ MIDDLEWARES DE SEGURIDAD (ORDEN IMPORTANTE) ============

// 1. Helmet para headers de seguridad
app.use(helmetConfig);

// 2. Rate limiting general
app.use(generalLimiter);

// 3. Validación de tamaño de payload
app.use(validatePayloadSize(5 * 1024 * 1024)); // 5MB máximo

// 4. CORS configurado
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, Postman, etc.)
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

// 5. Parsing de JSON con límite de tamaño
app.use(express.json({ 
  limit: '5mb',
  strict: true,
  type: 'application/json'
}));

// 6. Validación de Content-Type
app.use(validateContentType);

// 7. Sanitización de entrada
app.use(sanitizeInput);

// 8. Logging de seguridad
app.use(securityLogger);

// ============ MIDDLEWARE DE LOGGING PARA DEBUGGING ============
app.use((req, res, next) => {
  if (ENV_CONFIG.isDevelopment()) {
    console.log(`\n📨 ${req.method} ${req.url} - IP: ${req.ip}`);
    
    // Log de headers de autenticación (sin mostrar el token completo)
    if (req.headers.authorization) {
      const authType = req.headers.authorization.split(' ')[0];
      console.log(`🔑 Auth: ${authType} [token present]`);
    }
    
    if (req.body && Object.keys(req.body).length > 0) {
      // No logear contraseñas
      const safeBody = { ...req.body };
      if (safeBody.contrasena) safeBody.contrasena = '[HIDDEN]';
      if (safeBody.password) safeBody.password = '[HIDDEN]';
      if (safeBody.nuevaContrasena) safeBody.nuevaContrasena = '[HIDDEN]';
      
      console.log('📦 Body:', JSON.stringify(safeBody, null, 2));
    }
  }
  next();
});

// ============ RUTAS DE LA API ============
app.use("/api", router);

// ============ MIDDLEWARE DE MANEJO DE ERRORES ============
app.use(notFoundHandler);
app.use(errorHandler);

// ============ INICIAR SERVIDOR ============
const server = app.listen(ENV_CONFIG.PORT, ENV_CONFIG.HOST, () => {
  console.log(`\n🚀 ===== SERVIDOR INICIADO =====`);
  console.log(`✅ Servidor corriendo en http://${ENV_CONFIG.HOST}:${ENV_CONFIG.PORT}`);
  console.log(`📡 API disponible en http://${ENV_CONFIG.HOST}:${ENV_CONFIG.PORT}/api`);
  console.log(`🏥 Health check: http://${ENV_CONFIG.HOST}:${ENV_CONFIG.PORT}/api/health`);
  
  // Log de configuración de seguridad
  console.log(`\n🛡️  ===== CONFIGURACIÓN DE SEGURIDAD =====`);
  console.log(`🔒 Helmet: Activado`);
  console.log(`⏱️  Rate Limiting: ${ENV_CONFIG.RATE_LIMIT.MAX_REQUESTS} requests/${ENV_CONFIG.RATE_LIMIT.WINDOW_MS/1000/60}min`);
  console.log(`🔑 JWT: Configurado (expires: ${ENV_CONFIG.JWT_EXPIRES_IN})`);
  console.log(`🌐 CORS: ${ENV_CONFIG.CORS.ALLOWED_ORIGINS.length} orígenes permitidos`);
  console.log(`📏 Max payload: 5MB`);
  console.log(`🧹 Input sanitization: Activado`);
  
  if (ENV_CONFIG.isProduction()) {
    console.log(`🔐 Modo producción: Headers de seguridad estrictos`);
  } else {
    console.log(`🔧 Modo desarrollo: Logging detallado activado`);
  }
  
  // Log configuration in development
  ENV_CONFIG.logConfig();
  
  console.log(`\n⚠️  IMPORTANTE: Cambia las credenciales por defecto antes de producción`);
  console.log(`=======================================\n`);
});

// Manejo graceful de cierre del servidor
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;
