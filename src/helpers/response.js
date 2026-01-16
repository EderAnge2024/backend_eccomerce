// Helper para respuestas estandarizadas de la API

export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

export const errorResponse = (res, message = 'Error', statusCode = 500, error = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  // Solo incluir detalles del error en desarrollo
  if (process.env.NODE_ENV === 'development' && error) {
    response.error = error.message;
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
};

export const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors,
    timestamp: new Date().toISOString()
  });
};

export const notFoundResponse = (res, resource = 'Resource') => {
  return res.status(404).json({
    success: false,
    message: `${resource} not found`,
    timestamp: new Date().toISOString()
  });
};