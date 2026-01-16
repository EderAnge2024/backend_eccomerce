// Middleware de validación

import { validationErrorResponse } from '../helpers/response.js';
import { validateRequired, validateEmail, validatePassword, validateUsername } from '../helpers/validation.js';

// Middleware genérico de validación
export const validate = (validationRules) => {
  return (req, res, next) => {
    const errors = [];
    
    // Ejecutar reglas de validación
    validationRules.forEach(rule => {
      const error = rule(req.body);
      if (error) {
        errors.push(error);
      }
    });
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    next();
  };
};

// Reglas de validación específicas
export const validateUserRegistration = validate([
  (data) => {
    const requiredFields = ['nombre', 'correo', 'usuario', 'contrasena'];
    const errors = validateRequired(requiredFields, data);
    return errors.length > 0 ? errors.join(', ') : null;
  },
  (data) => {
    if (data.correo && !validateEmail(data.correo)) {
      return 'Invalid email format';
    }
    return null;
  },
  (data) => {
    if (data.usuario && !validateUsername(data.usuario)) {
      return 'Username must be at least 3 characters and contain only letters, numbers, dots, hyphens, and underscores';
    }
    return null;
  },
  (data) => {
    if (data.contrasena && !validatePassword(data.contrasena)) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  }
]);

export const validateUserLogin = validate([
  (data) => {
    const requiredFields = ['usuario', 'contrasena'];
    const errors = validateRequired(requiredFields, data);
    return errors.length > 0 ? errors.join(', ') : null;
  }
]);

export const validateCredentialsUpdate = validate([
  (data) => {
    const requiredFields = ['usuario', 'contrasena'];
    const errors = validateRequired(requiredFields, data);
    return errors.length > 0 ? errors.join(', ') : null;
  },
  (data) => {
    if (data.usuario && !validateUsername(data.usuario)) {
      return 'Username must be at least 3 characters and contain only letters, numbers, dots, hyphens, and underscores';
    }
    return null;
  },
  (data) => {
    if (data.contrasena && !validatePassword(data.contrasena)) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  }
]);