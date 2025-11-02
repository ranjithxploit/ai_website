import rateLimit from 'express-rate-limit';
import config from '../config/config';
import { logSecurityEvent } from '../utils/logger';

/**
 * Global rate limiter
 */
export const globalLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      path: req.path,
      type: 'global',
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
    });
  },
});

/**
 * Auth route rate limiter (stricter)
 */
export const authLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.authRateLimitMax,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
  handler: (req, res) => {
    logSecurityEvent('AUTH_RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      path: req.path,
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again in 15 minutes',
    });
  },
});

/**
 * Document generation rate limiter
 */
export const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.security.generationRateLimitMax,
  message: {
    success: false,
    message: 'Generation limit reached, please try again later',
  },
  keyGenerator: (req: any) => {
    // Rate limit per user
    return req.user?.userId || req.ip;
  },
  handler: (req, res) => {
    logSecurityEvent('GENERATION_RATE_LIMIT_EXCEEDED', {
      userId: (req as any).user?.userId,
      ip: req.ip,
    });
    
    res.status(429).json({
      success: false,
      message: 'Generation limit reached for this hour, please try again later',
    });
  },
});

export default { globalLimiter, authLimiter, generationLimiter };
