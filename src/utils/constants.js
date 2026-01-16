// Constantes de la aplicación

export const USER_ROLES = {
  CLIENT: 'cliente',
  ADMIN: 'administrador'
};

export const ORDER_STATUS = {
  PENDING: 'Pendiente',
  PROCESSING: 'En proceso',
  DELIVERED: 'Entregado'
};

export const ORDER_TYPES = {
  MASTER: 'maestro',
  SUB_ORDER: 'sub_pedido',
  SIMPLE: 'simple'
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  USERNAME_MIN_LENGTH: 3,
  MAX_TEXT_LENGTH: 255
};

export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100
};