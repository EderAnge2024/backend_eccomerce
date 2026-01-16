// Middleware de seguridad adicional

import helmet from 'helmet';
import { ENV_CONFIG } from '../../config/env.js';
import { validateSQLInput, sanitizeString } from '../helpers/validation.js';

// Configuración de Helmet para seguridad HTTP
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Deshabilitado para compatibilidad con APIs externas
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  }
});

// Middleware para sanitizar entrada de datos
export const sanitizeInput = (req, res, next) => {
  try {
    // Sanitizar body
    if (req.body && typeof req.body === 'object') {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          // Verificar patrones de SQL injection
          if (!validateSQLInput(req.body[key])) {
            console.warn(`🚨 Possible SQL injection attempt detected in ${key}: ${req.body[key]}`);
            return res.status(400).json({
              success: false,
              message: 'Invalid input detected',
              timestamp: new Date().toISOString()
            });
          }
          
          // Sanitizar string
          req.body[key] = sanitizeString(req.body[key]);
        }
      }
    }
    
    // Sanitizar query parameters
    if (req.query && typeof req.query === 'object') {
      for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
          if (!validateSQLInput(req.query[key])) {
            console.warn(`🚨 Possible SQL injection attempt detected in query ${key}: ${req.query[key]}`);
            return res.status(400).json({
              success: false,
              message: 'Invalid query parameter detected',
              timestamp: new Date().toISOString()
            });
          }
          
          req.query[key] = sanitizeString(req.query[key]);
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Error in input sanitization:', error);
    res.status(500).json({
      success: false,
      message: 'Input processing error',
      timestamp: new Date().toISOString()
    });
  }
};

// Middleware para logging de seguridad
export const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log de request
  if (ENV_CONFIG.isDevelopment()) {
    console.log(`🔒 Security Log: ${req.method} ${req.path} from ${req.ip}`);
    
    // Log de headers sospechosos
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'user-agent'];
    suspiciousHeaders.forEach(header => {
      if (req.headers[header]) {
        console.log(`  Header ${header}: ${req.headers[header]}`);
      }
    });
  }
  
  // Interceptar response para logging
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Log de responses con errores
    if (res.statusCode >= 400) {
      console.warn(`⚠️  Security Alert: ${req.method} ${req.path} - Status: ${res.statusCode} - Duration: ${duration}ms - IP: ${req.ip}`);
      
      if (res.statusCode === 401 || res.statusCode === 403) {
        console.warn(`🚨 Authentication/Authorization failure: ${req.method} ${req.path} - IP: ${req.ip} - User: ${req.user?.username || 'anonymous'}`);
      }
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Middleware para validar Content-Type en requests POST/PUT
export const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type must be application/json',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  next();
};

// Middleware para prevenir ataques de timing
export const preventTimingAttacks = (req, res, next) => {
  // Agregar delay aleatorio pequeño para prevenir timing attacks
  const delay = Math.random() * 100; // 0-100ms
  
  setTimeout(() => {
    next();
  }, delay);
};

// Middleware para validar tamaño de payload
export const validatePayloadSize = (maxSize = 1024 * 1024) => { // 1MB por defecto
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'], 10);
    
    if (contentLength && contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        message: 'Payload too large',
        maxSize: `${maxSize / 1024 / 1024}MB`,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
};