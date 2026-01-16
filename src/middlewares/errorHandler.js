// Middleware de manejo de errores

import { ENV_CONFIG } from "../../config/env.js";

export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error capturado por middleware:', err);

  // Error de validación de base de datos
  if (err.code === '23505') { // Unique violation
    return res.status(400).json({
      success: false,
      message: 'Ya existe un registro con esos datos',
      timestamp: new Date().toISOString()
    });
  }

  // Error de referencia de clave foránea
  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      success: false,
      message: 'No se puede realizar la operación debido a referencias existentes',
      timestamp: new Date().toISOString()
    });
  }

  // Error de sintaxis JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'JSON inválido en el cuerpo de la petición',
      timestamp: new Date().toISOString()
    });
  }

  // Error por defecto
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: err.message || 'Error interno del servidor',
    timestamp: new Date().toISOString()
  };

  // Solo incluir stack trace en desarrollo
  if (ENV_CONFIG.isDevelopment()) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.method} ${req.originalUrl} no encontrada`,
    timestamp: new Date().toISOString()
  });
};