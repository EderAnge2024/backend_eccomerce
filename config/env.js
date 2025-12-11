import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración centralizada de variables de entorno
export const ENV_CONFIG = {
  // Server Configuration
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: process.env.DB_PORT || 5432,
    USER: process.env.DB_USER || 'postgres',
    PASSWORD: process.env.DB_PASSWORD || 'edichogenial',
    NAME: process.env.DB_NAME || 'ecomerce',
  },
  
  // Email Configuration
  EMAIL: {
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
    VERIFICATION_CODE_EXPIRATION: parseInt(process.env.VERIFICATION_CODE_EXPIRATION, 10) || 600,
  },
  
  // CORS Configuration
  CORS: {
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:3000', 'http://localhost:8081'],
  },
  
  // Helper functions
  isDevelopment: () => ENV_CONFIG.NODE_ENV === 'development',
  isProduction: () => ENV_CONFIG.NODE_ENV === 'production',
  
  // Validation functions
  validateEmailConfig: () => {
    if (!ENV_CONFIG.EMAIL.GMAIL_USER || !ENV_CONFIG.EMAIL.GMAIL_APP_PASSWORD) {
      console.warn('⚠️  Email configuration incomplete. Email features may not work.');
      return false;
    }
    return true;
  },
  
  // Log configuration (only in development)
  logConfig: () => {
    if (ENV_CONFIG.isDevelopment()) {
      console.log('🔧 Backend Configuration:');
      console.log(`  - Environment: ${ENV_CONFIG.NODE_ENV}`);
      console.log(`  - Server: http://${ENV_CONFIG.HOST}:${ENV_CONFIG.PORT}`);
      console.log(`  - Database: ${ENV_CONFIG.DB.HOST}:${ENV_CONFIG.DB.PORT}/${ENV_CONFIG.DB.NAME}`);
      console.log(`  - Email configured: ${ENV_CONFIG.validateEmailConfig() ? '✅' : '❌'}`);
      console.log(`  - CORS origins: ${ENV_CONFIG.CORS.ALLOWED_ORIGINS.join(', ')}`);
    }
  }
};

// Validate configuration on import
ENV_CONFIG.validateEmailConfig();

export default ENV_CONFIG;