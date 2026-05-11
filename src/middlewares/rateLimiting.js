/**
 * Rate Limiting Middleware - Producción Ready
 * 
 * Cambios importantes:
 * - Redis como store principal
 * - Key generator por usuario/IP
 * - Trust proxy configurado
 * - Límites optimizados y escalables
 * - Seguridad reforzada en login
 */

import { 
  initializeRateLimiting,
  generalLimiter,
  loginLimiter,
  registerLimiter,
  verificationCodeLimiter,
  adminLimiter,
  passwordResetLimiter,
  resourceIntensiveLimiter,
  applyTrustProxy,
  getClientIP,
  rateLimitHealthCheck,
  createResourceLimiter
} from './rateLimitingProduction.js';

// Inicializar rate limiting con Redis
export const initRateLimiting = initializeRateLimiting;

// Re-exportar todos los limiters
export {
  generalLimiter,
  loginLimiter,
  registerLimiter,
  verificationCodeLimiter,
  adminLimiter,
  passwordResetLimiter,
  resourceIntensiveLimiter,
  createResourceLimiter,
  applyTrustProxy,
  getClientIP,
  rateLimitHealthCheck
};

// Health check simplificado
export const checkRateLimitHealth = rateLimitHealthCheck;

/**
 * Middleware para logging de rate limiting
 */
export const rateLimitLogger = (req, res, next) => {
  const rateLimitInfo = {
    ip: getClientIP(req),
    method: req.method,
    path: req.path,
    user: req.user?.id_usuario || 'anonymous'
  };
  
  req.rateLimitInfo = rateLimitInfo;
  next();
};

/**
 * Skip rate limiting para rutas específicas
 */
export const skipRateLimit = (req) => {
  const skipPaths = [
    '/api/health',
    '/api/',
    '/api/docs',
    '/api/openapi.json'
  ];
  
  return skipPaths.some(path => req.path.startsWith(path));
};

/**
 * Configuración dinámica de límites basada en entorno
 */
export const getRateLimitConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const configs = {
    production: {
      windowMs: 15 * 60 * 1000,
      max: 100,
      loginMax: 5,
      registerMax: 3,
      adminMax: 50
    },
    development: {
      windowMs: 60 * 60 * 1000,
      max: 1000,
      loginMax: 20,
      registerMax: 10,
      adminMax: 200
    },
    test: {
      windowMs: 60 * 60 * 1000,
      max: Infinity,
      loginMax: Infinity,
      registerMax: Infinity,
      adminMax: Infinity
    }
  };
  
  return configs[env] || configs.development;
};

export default {
  initRateLimiting,
  generalLimiter,
  loginLimiter,
  registerLimiter,
  verificationCodeLimiter,
  adminLimiter,
  passwordResetLimiter,
  resourceIntensiveLimiter,
  createResourceLimiter,
  applyTrustProxy,
  getClientIP,
  rateLimitHealthCheck,
  rateLimitLogger,
  skipRateLimit,
  getRateLimitConfig
};