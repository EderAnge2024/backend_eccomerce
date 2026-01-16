// Helper para validaciones comunes con mejoras de seguridad

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5321 limit
};

export const validatePassword = (password) => {
  // Mejorada: Al menos 8 caracteres, una mayúscula, una minúscula, un número
  if (!password || password.length < 8) return false;
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  // Requiere al menos 3 de los 4 tipos de caracteres
  const criteriaCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  return criteriaCount >= 3;
};

export const validateUsername = (username) => {
  // Mejorada: 3-30 caracteres, solo letras, números, puntos, guiones y guiones bajos
  if (!username || username.length < 3 || username.length > 30) return false;
  const usernameRegex = /^[a-zA-Z0-9._-]+$/;
  
  // No puede empezar o terminar con puntos o guiones
  if (username.startsWith('.') || username.startsWith('-') || 
      username.endsWith('.') || username.endsWith('-')) return false;
      
  // No puede tener puntos o guiones consecutivos
  if (username.includes('..') || username.includes('--') || username.includes('.-') || username.includes('-.')) return false;
  
  return usernameRegex.test(username);
};

export const validateRequired = (fields, data) => {
  const errors = [];
  
  fields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      errors.push(`${field} is required`);
    }
  });
  
  return errors;
};

export const validateNumeric = (value, fieldName, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  if (num < min) {
    return `${fieldName} must be at least ${min}`;
  }
  if (num > max) {
    return `${fieldName} must not exceed ${max}`;
  }
  return null;
};

export const sanitizeString = (str, maxLength = 255) => {
  if (typeof str !== 'string') return str;
  
  // Remover caracteres peligrosos y limitar longitud
  return str
    .trim()
    .replace(/[<>'"&]/g, '') // Prevenir XSS básico
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remover caracteres de control
    .substring(0, maxLength);
};

export const validatePhoneNumber = (phone) => {
  if (!phone) return true; // Opcional
  
  // Formato internacional básico: +1234567890 o 1234567890
  const phoneRegex = /^(\+?[1-9]\d{1,14})$/;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, ''); // Remover espacios y caracteres comunes
  
  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 7 && cleanPhone.length <= 15;
};

export const validateRole = (role) => {
  const validRoles = ['cliente', 'administrador'];
  return validRoles.includes(role);
};

export const validateOrderStatus = (status) => {
  const validStatuses = ['Pendiente', 'En proceso', 'Entregado'];
  return validStatuses.includes(status);
};

// Validación de entrada para prevenir inyecciones
export const validateSQLInput = (input) => {
  if (typeof input !== 'string') return true;
  
  // Detectar patrones sospechosos de SQL injection
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /(--|\/\*|\*\/|;)/,
    /(\b(OR|AND)\b.*=.*)/i,
    /'.*'/
  ];
  
  return !sqlPatterns.some(pattern => pattern.test(input));
};

// Validación de ID numérico
export const validateId = (id) => {
  const numId = parseInt(id, 10);
  return !isNaN(numId) && numId > 0 && numId <= Number.MAX_SAFE_INTEGER;
};

// Validación de longitud de texto
export const validateTextLength = (text, fieldName, minLength = 0, maxLength = 255) => {
  if (!text && minLength > 0) {
    return `${fieldName} is required`;
  }
  
  if (text && text.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  
  if (text && text.length > maxLength) {
    return `${fieldName} must not exceed ${maxLength} characters`;
  }
  
  return null;
};

// Validación de precio/monto
export const validatePrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) && numPrice >= 0 && numPrice <= 999999.99;
};