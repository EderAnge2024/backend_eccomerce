// Middleware de autenticación con JWT

import { errorResponse } from '../helpers/response.js';
import { verifyToken, isTokenExpiringSoon } from '../utils/jwt.js';

// Middleware para verificar si el usuario está autenticado
export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access token required. Format: Bearer <token>', 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return errorResponse(res, 'Access token required', 401);
    }
    
    // Verificar token
    const decoded = verifyToken(token);
    
    // Agregar información del usuario al request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      es_super_admin: decoded.isSuperAdmin || false // Mapear de vuelta al nombre original
    };
    
    // Advertir si el token está próximo a expirar
    if (isTokenExpiringSoon(token)) {
      res.setHeader('X-Token-Expiring', 'true');
    }
    
    next();
  } catch (error) {
    console.error('❌ Error en autenticación:', error.message);
    return errorResponse(res, 'Invalid or expired token', 401);
  }
};

// Middleware para verificar roles específicos
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }
    
    // Convertir a array si es string
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, `Access denied. Required role: ${roles.join(' or ')}`, 403);
    }
    
    next();
  };
};

// Middleware para verificar si es administrador
export const requireAdmin = requireRole(['administrador']);

// Middleware para verificar si es super administrador
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Authentication required', 401);
  }
  
  if (!req.user.es_super_admin) {
    return errorResponse(res, 'Super administrator access required', 403);
  }
  
  next();
};

// Middleware para verificar propiedad de recurso
export const requireOwnership = (resourceIdParam = 'id', userIdField = 'id_usuario') => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }
    
    const resourceId = req.params[resourceIdParam];
    const userId = req.user.userId;
    
    // Los administradores pueden acceder a cualquier recurso
    if (req.user.role === 'administrador') {
      return next();
    }
    
    // Para clientes, verificar que el recurso les pertenece
    if (resourceId && parseInt(resourceId) !== userId) {
      return errorResponse(res, 'Access denied. You can only access your own resources', 403);
    }
    
    next();
  };
};

// Middleware opcional de autenticación (no falla si no hay token)
export const optionalAuth = (req, res, next) => {
  try {
    let token = null;
    
    // Primero intentar obtener token del header Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // Si no hay token en el header, intentar obtenerlo del query parameter
    if (!token && req.query.token) {
      token = req.query.token;
    }
    
    if (token) {
      const decoded = verifyToken(token);
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        es_super_admin: decoded.isSuperAdmin || false
      };
    }
  } catch (error) {
    // En modo opcional, no fallar si el token es inválido
    console.warn('⚠️  Token inválido en modo opcional:', error.message);
  }
  
  next();
};