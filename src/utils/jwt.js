// Utilidades para manejo de JWT

import jwt from 'jsonwebtoken';
import { ENV_CONFIG } from '../../config/env.js';

// Generar token de acceso
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, ENV_CONFIG.JWT_SECRET, {
    expiresIn: ENV_CONFIG.JWT_EXPIRES_IN,
    issuer: 'ecommerce-api',
    audience: 'ecommerce-client'
  });
};

// Generar token de refresh
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, ENV_CONFIG.JWT_SECRET, {
    expiresIn: ENV_CONFIG.JWT_REFRESH_EXPIRES_IN,
    issuer: 'ecommerce-api',
    audience: 'ecommerce-client'
  });
};

// Verificar token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, ENV_CONFIG.JWT_SECRET, {
      issuer: 'ecommerce-api',
      audience: 'ecommerce-client'
    });
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Decodificar token sin verificar (para debugging)
export const decodeToken = (token) => {
  return jwt.decode(token);
};

// Generar payload estándar para usuario
export const createUserPayload = (user) => {
  return {
    userId: user.id_usuario,
    username: user.usuario,
    email: user.correo,
    role: user.rol,
    isSuperAdmin: user.es_super_admin || false,
    iat: Math.floor(Date.now() / 1000)
  };
};

// Verificar si el token está próximo a expirar (menos de 15 minutos)
export const isTokenExpiringSoon = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;
    
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    
    return timeUntilExpiry < 900; // 15 minutos
  } catch (error) {
    return true;
  }
};