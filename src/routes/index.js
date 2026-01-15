import { Router } from 'express';
import keywordsRoutes from './keywords.routes.js';
import appsRoutes from './apps.routes.js';
import aiRoutes from './ai.routes.js';
import historyRoutes from './history.routes.js';
import opportunityRoutes from './opportunity.routes.js';
import trackedRoutes from './tracked.routes.js';
import { config } from '../config/index.js';

const router = Router();

// API health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Get supported countries
router.get('/countries', (req, res) => {
  res.json({
    countries: config.supportedCountries,
    total: config.supportedCountries.length,
  });
});

// Mount routes
router.use('/keywords', keywordsRoutes);
router.use('/apps', appsRoutes);
router.use('/ai', aiRoutes);
router.use('/history', historyRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/tracked', trackedRoutes);

export default router;
