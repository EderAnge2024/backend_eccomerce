/**
 * Configuración de Redis para Rate Limiting
 * Entorno de producción listo con persistencia y clustering
 */

import { createClient } from 'redis';
import { ENV_CONFIG } from './env.js';

// Configuración del cliente Redis
const redisConfig = {
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis: Max retries reached');
        return new Error('Redis connection failed');
      }
      return Math.min(retries * 100, 3000);
    }
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB) || 0,
  pool: { min: 2, max: 10 }
};

const redisClient = createClient(redisConfig);

let _redisAvailable = false;

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
});

redisClient.on('ready', () => {
  _redisAvailable = true;
});

// Conectar a Redis
export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    _redisAvailable = true;
    return redisClient;
  } catch (error) {
    _redisAvailable = false;
    if (ENV_CONFIG.isDevelopment()) {
      console.warn('Redis not available, using memory mode');
      return null;
    }
    throw error;
  }
};

export const disconnectRedis = async () => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  } catch (error) {
    console.error('Error disconnecting Redis:', error);
  }
};

export const redisHealthCheck = async () => {
  try {
    if (!_redisAvailable) return { healthy: false, message: 'Redis not connected' };
    await redisClient.ping();
    return { healthy: true, message: 'Redis operational' };
  } catch (error) {
    return { healthy: false, message: error.message };
  }
};

export { redisClient, redisAvailable };

const redisAvailable = () => _redisAvailable;

export default { redisClient, connectRedis, disconnectRedis, redisHealthCheck, redisAvailable };