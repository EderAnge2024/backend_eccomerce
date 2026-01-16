// Configuración de variables de entorno

import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración centralizada
export const ENV_CONFIG = {
  // Configuración del servidor
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3000,
  HOST: process.env.HOST || 'localhost',

  // Configuración de la base de datos
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    USER: process.env.DB_USER || 'postgres',
    PASSWORD: process.env.DB_PASSWORD || 'admin',
    NAME: process.env.DB_NAME || 'ecommerce_db',
    PORT: parseInt(process.env.DB_PORT) || 5432,
  },

  // Configuración JWT
  JWT_SECRET: process.env.JWT_SECRET || 'tu_jwt_secret_super_seguro_aqui_2024',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Configuración de Email
  EMAIL: {
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
    VERIFICATION_CODE_EXPIRATION: parseInt(process.env.VERIFICATION_CODE_EXPIRATION) || 600, // 10 minutos
  },

  // Configuración CORS
  CORS: {
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : [
          'http://localhost:3000',
          'http://localhost:3001', 
          'http://localhost:8081',
          'http://192.168.43.132:8081'
        ]
  },

  // Configuración de Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    LOGIN_MAX_REQUESTS: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS) || 5,
    REGISTER_MAX_REQUESTS: parseInt(process.env.REGISTER_RATE_LIMIT_MAX_REQUESTS) || 3,
    VERIFICATION_MAX_REQUESTS: parseInt(process.env.VERIFICATION_RATE_LIMIT_MAX_REQUESTS) || 10,
    ADMIN_MAX_REQUESTS: parseInt(process.env.ADMIN_RATE_LIMIT_MAX_REQUESTS) || 50,
  },

  // Funciones de utilidad
  isDevelopment: () => ENV_CONFIG.NODE_ENV === 'development',
  isProduction: () => ENV_CONFIG.NODE_ENV === 'production',

  // Función para logging de configuración
  logConfig: () => {
    if (ENV_CONFIG.isDevelopment()) {
      console.log('\n🔧 ===== CONFIGURACIÓN DE DESARROLLO =====');
      console.log(`📊 Base de datos: ${ENV_CONFIG.DB.HOST}:${ENV_CONFIG.DB.PORT}/${ENV_CONFIG.DB.NAME}`);
      console.log(`🔑 JWT Secret: ${ENV_CONFIG.JWT_SECRET.substring(0, 10)}...`);
      console.log(`📧 Email configurado: ${!!ENV_CONFIG.EMAIL.GMAIL_USER}`);
      console.log(`🌐 CORS Origins: ${ENV_CONFIG.CORS.ALLOWED_ORIGINS.length} configurados`);
      console.log('==========================================\n');
    }
  }
};

export default ENV_CONFIG;