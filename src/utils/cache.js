import NodeCache from 'node-cache';
import { config } from '../config/index.js';

export const cache = new NodeCache({
  stdTTL: config.cacheTtl,
  checkperiod: 120,
  useClones: false,
});

export const cacheMiddleware = (keyPrefix, ttl = config.cacheTtl) => {
  return (req, res, next) => {
    const key = `${keyPrefix}:${JSON.stringify(req.query)}:${JSON.stringify(req.params)}`;
    const cached = cache.get(key);
    
    if (cached) {
      return res.json(cached);
    }
    
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to cache response
    res.json = (data) => {
      cache.set(key, data, ttl);
      return originalJson(data);
    };
    
    next();
  };
};
