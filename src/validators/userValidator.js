// Validadores específicos para usuarios

import { validateEmail, validatePassword, validateUsername, validateRequired } from '../helpers/validation.js';

export const validateUserData = (userData, isUpdate = false) => {
  const errors = [];

  // Campos requeridos (diferentes para creación vs actualización)
  const requiredFields = isUpdate 
    ? [] // En actualización, los campos son opcionales
    : ['nombre', 'correo', 'usuario', 'contrasena'];

  if (!isUpdate) {
    const requiredErrors = validateRequired(requiredFields, userData);
    errors.push(...requiredErrors);
  }

  // Validar email si está presente
  if (userData.correo && !validateEmail(userData.correo)) {
    errors.push('El formato del correo electrónico no es válido');
  }

  // Validar username si está presente
  if (userData.usuario && !validateUsername(userData.usuario)) {
    errors.push('El nombre de usuario debe tener al menos 3 caracteres y solo puede contener letras, números, puntos, guiones y guiones bajos');
  }

  // Validar password si está presente
  if (userData.contrasena && !validatePassword(userData.contrasena)) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }

  // Validar rol si está presente
  if (userData.rol && !['cliente', 'administrador'].includes(userData.rol)) {
    errors.push('El rol debe ser "cliente" o "administrador"');
  }

  // Validar longitud de campos de texto
  if (userData.nombre && userData.nombre.length > 100) {
    errors.push('El nombre no puede exceder 100 caracteres');
  }

  if (userData.apellido && userData.apellido.length > 100) {
    errors.push('El apellido no puede exceder 100 caracteres');
  }

  if (userData.telefono && userData.telefono.length > 15) {
    errors.push('El teléfono no puede exceder 15 caracteres');
  }

  if (userData.direccion && userData.direccion.length > 150) {
    errors.push('La dirección no puede exceder 150 caracteres');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCredentialsUpdate = (credentialsData) => {
  const errors = [];

  // Campos requeridos para actualización de credenciales
  const requiredFields = ['usuario', 'contrasena'];
  const requiredErrors = validateRequired(requiredFields, credentialsData);
  errors.push(...requiredErrors);

  // Validar username
  if (credentialsData.usuario && !validateUsername(credentialsData.usuario)) {
    errors.push('El nombre de usuario debe tener al menos 3 caracteres y solo puede contener letras, números, puntos, guiones y guiones bajos');
  }

  // Validar password
  if (credentialsData.contrasena && !validatePassword(credentialsData.contrasena)) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateLoginData = (loginData) => {
  const errors = [];

  // Campos requeridos
  const requiredFields = ['usuario', 'contrasena'];
  const requiredErrors = validateRequired(requiredFields, loginData);
  errors.push(...requiredErrors);

  return {
    isValid: errors.length === 0,
    errors
  };
};