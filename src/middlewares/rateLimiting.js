// Middleware de rate limiting para prevenir ataques de fuerza bruta

import rateLimit from 'express-rate-limit';
import { ENV_CONFIG } from '../../config/env.js';

// Rate limiter general para toda la API
export const generalLimiter = rateLimit({
  windowMs: ENV_CONFIG.RATE_LIMIT.WINDOW_MS,
  max: ENV_CONFIG.RATE_LIMIT.MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    retryAfter: Math.ceil(ENV_CONFIG.RATE_LIMIT.WINDOW_MS / 1000 / 60) + ' minutes',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`⚠️  Rate limit exceeded for IP: ${req.ip} on ${req.method} ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later',
      retryAfter: Math.ceil(ENV_CONFIG.RATE_LIMIT.WINDOW_MS / 1000 / 60) + ' minutes',
      timestamp: new Date().toISOString()
    });
  }
});

// Rate limiter estricto para login
export const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: ENV_CONFIG.RATE_LIMIT.LOGIN_MAX_ATTEMPTS,
  skipSuccessfulRequests: true, // No contar requests exitosos
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again later',
    retryAfter: '1 minute',
    timestamp: new Date().toISOString()
  },
  handler: (req, res) => {
    console.warn(`🚨 Login rate limit exceeded for IP: ${req.ip}, body: ${JSON.stringify(req.body)}`);
    res.status(429).json({
      success: false,
      message: 'Too many login attempts from this IP, please try again later',
      retryAfter: '1 minute',
      timestamp: new Date().toISOString()
    });
  }
});

// Rate limiter para registro de usuarios
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // Máximo 5 registros por hora por IP
  message: {
    success: false,
    message: 'Too many registration attempts from this IP, please try again later',
    retryAfter: '1 hour',
    timestamp: new Date().toISOString()
  },
  handler: (req, res) => {
    console.warn(`🚨 Registration rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many registration attempts from this IP, please try again later',
      retryAfter: '1 hour',
      timestamp: new Date().toISOString()
    });
  }
});

// Rate limiter para códigos de verificación
export const verificationCodeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Máximo 3 códigos por hora por IP
  message: {
    success: false,
    message: 'Too many verification code requests from this IP, please try again later',
    retryAfter: '1 hour',
    timestamp: new Date().toISOString()
  },
  handler: (req, res) => {
    console.warn(`🚨 Verification code rate limit exceeded for IP: ${req.ip}, email: ${req.body?.correo}`);
    res.status(429).json({
      success: false,
      message: 'Too many verification code requests from this IP, please try again later',
      retryAfter: '1 hour',
      timestamp: new Date().toISOString()
    });
  }
});

// Rate limiter para operaciones de administrador
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // Máximo 30 operaciones por minuto
  message: {
    success: false,
    message: 'Too many admin operations from this IP, please slow down',
    retryAfter: '1 minute',
    timestamp: new Date().toISOString()
  }
});

// Rate limiter para creación de recursos (productos, pedidos, etc.)
export const createResourceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // Máximo 10 creaciones por minuto
  message: {
    success: false,
    message: 'Too many resource creation attempts, please slow down',
    retryAfter: '1 minute',
    timestamp: new Date().toISOString()
  }
});