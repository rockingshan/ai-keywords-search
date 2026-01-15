import { prisma } from '../db/prisma.js';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';

/**
 * Analytics Middleware
 * Tracks all API requests for analytics and debugging
 */
export const analyticsMiddleware = (req, res, next) => {
  // Generate or retrieve session ID
  if (!req.sessionId) {
    req.sessionId = req.headers['x-session-id'] || randomUUID();
  }

  // Set session ID in response header for client tracking
  res.setHeader('X-Session-ID', req.sessionId);

  const startTime = Date.now();

  // Store original json method
  const originalJson = res.json.bind(res);

  // Override to capture response
  res.json = function (data) {
    const duration = Date.now() - startTime;

    // Async save to DB (don't block response)
    saveToDatabase(req, res, duration, data).catch((err) => {
      logger.error('Failed to log search history:', err.message);
    });

    return originalJson(data);
  };

  next();
};

/**
 * Save request history to database
 */
async function saveToDatabase(req, res, duration, responseData) {
  // Skip health check and non-API routes
  if (req.path === '/health' || !req.path.startsWith('/api')) {
    return;
  }

  try {
    await prisma.searchHistory.create({
      data: {
        endpoint: req.path,
        method: req.method,
        query: JSON.stringify(req.query || {}),
        body: req.body ? JSON.stringify(req.body) : null,
        statusCode: res.statusCode,
        duration,
        cached: !!res.locals.cached,
        // Store response only for debugging (optional, can be null to save space)
        response: process.env.NODE_ENV === 'development' ? JSON.stringify(responseData).slice(0, 10000) : null,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        sessionId: req.sessionId,
      },
    });
  } catch (error) {
    // Don't throw - logging should never break the API
    logger.error('Database save error in analytics middleware:', error.message);
  }
}
