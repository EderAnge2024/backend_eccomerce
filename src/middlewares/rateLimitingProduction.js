import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient, connectRedis, redisAvailable } from '../../config/redis.js';
import { ENV_CONFIG } from '../../config/env.js';

let redisStore = null;

export const initializeRateLimiting = async () => {
  try {
    await connectRedis();
    if (redisAvailable()) {
      redisStore = new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: 'rl:',
      });
      console.log('Redis Rate Limiting: Initialized');
      return true;
    }
  } catch (error) {
    console.warn('Rate Limiting: Redis not available, using memory store');
  }
  redisStore = null;
  return false;
};

const keyGenerator = (req) => {
  if (req.user && req.user.id_usuario) return `user:${req.user.id_usuario}`;
  if (req.headers['x-forwarded-for']) {
    return `ip:${req.headers['x-forwarded-for'].split(',')[0].trim()}`;
  }
  return `ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
};

const skipHandler = (req) => {
  return req.path === '/api/health' || req.path === '/api/' || req.path.startsWith('/api/docs');
};

const customHandler = (req, res, options) => {
  const retryAfter = Math.ceil(options.msBeforeNext / 1000);
  console.warn(`Rate limit: ${req.method} ${req.path} IP=${req.ip} Retry=${retryAfter}s`);
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      retryAfter: retryAfter,
      timestamp: new Date().toISOString()
    }
  });
};

const getRateLimitOptions = (overrides = {}) => ({
  store: redisStore,
  keyGenerator,
  skip: skipHandler,
  handler: customHandler,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: true },
  ...overrides
});

export const generalLimiter = rateLimit(getRateLimitOptions({
  windowMs: ENV_CONFIG.RATE_LIMIT.WINDOW_MS,
  max: ENV_CONFIG.RATE_LIMIT.MAX_REQUESTS
}));

export const loginLimiter = rateLimit(getRateLimitOptions({
  windowMs: 15 * 60 * 1000,
  max: ENV_CONFIG.RATE_LIMIT.LOGIN_MAX_REQUESTS,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
    return `login:ip:${ip}`;
  }
}));

export const registerLimiter = rateLimit(getRateLimitOptions({
  windowMs: 60 * 60 * 1000,
  max: ENV_CONFIG.RATE_LIMIT.REGISTER_MAX_REQUESTS,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = req.body?.correo || req.body?.email || 'no-email';
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
    return `register:ip:${ip}:email:${email}`;
  }
}));

export const verificationCodeLimiter = rateLimit(getRateLimitOptions({
  windowMs: 60 * 60 * 1000,
  max: ENV_CONFIG.RATE_LIMIT.VERIFICATION_MAX_REQUESTS,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = req.body?.correo || req.body?.email || 'no-email';
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
    return `verify:ip:${ip}:email:${email}`;
  }
}));

export const adminLimiter = rateLimit(getRateLimitOptions({
  windowMs: 60 * 1000,
  max: ENV_CONFIG.RATE_LIMIT.ADMIN_MAX_REQUESTS,
  keyGenerator: (req) => {
    if (req.user && req.user.id_usuario) return `admin:user:${req.user.id_usuario}`;
    return `admin:ip:${req.ip}`;
  }
}));

export const passwordResetLimiter = rateLimit(getRateLimitOptions({
  windowMs: 60 * 60 * 1000,
  max: 3,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = req.body?.correo || req.body?.email || 'no-email';
    return `reset:email:${email}`;
  }
}));

export const resourceIntensiveLimiter = rateLimit(getRateLimitOptions({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Resource limit exceeded'
}));

export const createResourceLimiter = rateLimit(getRateLimitOptions({
  windowMs: 10 * 60 * 1000,
  max: 30,
  skipSuccessfulRequests: true
}));

export const dynamicRateLimiter = (maxRequests = 50, windowMinutes = 15) => {
  return rateLimit(getRateLimitOptions({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests
  }));
};

export const trustProxyConfig = {
  enabled: true,
  trustProxy: true
};

export const applyTrustProxy = (app) => {
  if (trustProxyConfig.enabled) app.set('trust proxy', trustProxyConfig.trustProxy);
};

export const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || req.socket?.remoteAddress || 'unknown';
};

export const redisHealthCheck = async () => {
  try {
    if (!redisAvailable()) return { healthy: false, message: 'Redis not connected' };
    await redisClient.ping();
    return { healthy: true, message: 'Redis operational' };
  } catch (error) {
    return { healthy: false, message: error.message };
  }
};

export const rateLimitHealthCheck = async () => {
  const redisStatus = await redisHealthCheck();
  return {
    redis: redisStatus,
    rateLimiter: {
      general: { window: `${ENV_CONFIG.RATE_LIMIT.WINDOW_MS / 1000 / 60}min`, max: ENV_CONFIG.RATE_LIMIT.MAX_REQUESTS },
      login: { window: '15min', max: ENV_CONFIG.RATE_LIMIT.LOGIN_MAX_REQUESTS },
      register: { window: '1hour', max: ENV_CONFIG.RATE_LIMIT.REGISTER_MAX_REQUESTS },
      admin: { window: '1min', max: ENV_CONFIG.RATE_LIMIT.ADMIN_MAX_REQUESTS },
      passwordReset: { window: '1hour', max: 3 }
    },
    redisAvailable: redisAvailable(),
    store: redisAvailable() ? 'Redis' : 'Memory'
  };
};