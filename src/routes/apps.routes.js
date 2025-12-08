import { Router } from 'express';
import { query, param, validationResult } from 'express-validator';
import { appStoreService } from '../services/appStore.service.js';
import { cacheMiddleware } from '../utils/cache.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * @route   GET /api/apps/search
 * @desc    Search for apps in the App Store
 * @query   term (required), country (optional), limit (optional)
 */
router.get(
  '/search',
  [
    query('term').trim().notEmpty().withMessage('Search term is required'),
    query('country').optional().isLength({ min: 2, max: 2 }).toLowerCase(),
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  ],
  validate,
  cacheMiddleware('app-search', 1800),
  async (req, res) => {
    try {
      const { term, country = 'us', limit = 25 } = req.query;
      const results = await appStoreService.searchApps(term, country, limit);
      res.json({
        term,
        country,
        resultCount: results.length,
        results,
      });
    } catch (error) {
      logger.error('App search error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route   GET /api/apps/:appId
 * @desc    Get detailed app information
 * @params  appId (required)
 * @query   country (optional)
 */
router.get(
  '/:appId',
  [
    param('appId').isNumeric().withMessage('Valid app ID is required'),
    query('country').optional().isLength({ min: 2, max: 2 }).toLowerCase(),
  ],
  validate,
  cacheMiddleware('app-detail', 3600),
  async (req, res) => {
    try {
      const { appId } = req.params;
      const { country = 'us' } = req.query;
      const app = await appStoreService.getAppById(appId, country);
      res.json(app);
    } catch (error) {
      logger.error('App detail error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route   GET /api/apps/:appId/keywords
 * @desc    Extract keywords from an app's metadata
 * @params  appId (required)
 * @query   country (optional)
 */
router.get(
  '/:appId/keywords',
  [
    param('appId').isNumeric().withMessage('Valid app ID is required'),
    query('country').optional().isLength({ min: 2, max: 2 }).toLowerCase(),
  ],
  validate,
  cacheMiddleware('app-keywords', 3600),
  async (req, res) => {
    try {
      const { appId } = req.params;
      const { country = 'us' } = req.query;
      const keywords = await appStoreService.extractAppKeywords(appId, country);
      res.json(keywords);
    } catch (error) {
      logger.error('Extract keywords error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route   GET /api/apps/top/:category
 * @desc    Get top apps in a category
 * @params  category (optional, default: all)
 * @query   country (optional), limit (optional)
 */
router.get(
  '/top/:category?',
  [
    param('category').optional().isString(),
    query('country').optional().isLength({ min: 2, max: 2 }).toLowerCase(),
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  ],
  validate,
  cacheMiddleware('top-apps', 3600),
  async (req, res) => {
    try {
      const { category = 'all' } = req.params;
      const { country = 'us', limit = 100 } = req.query;
      const apps = await appStoreService.getTopApps(category, country, limit);
      res.json({
        category,
        country,
        count: apps.length,
        apps,
      });
    } catch (error) {
      logger.error('Top apps error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route   GET /api/apps/rankings/:keyword
 * @desc    Get app rankings for a specific keyword
 * @params  keyword (required)
 * @query   country (optional), limit (optional)
 */
router.get(
  '/rankings/:keyword',
  [
    param('keyword').trim().notEmpty().withMessage('Keyword is required'),
    query('country').optional().isLength({ min: 2, max: 2 }).toLowerCase(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  cacheMiddleware('keyword-rankings', 1800),
  async (req, res) => {
    try {
      const { keyword } = req.params;
      const { country = 'us', limit = 10 } = req.query;
      const rankings = await appStoreService.getKeywordRankings(keyword, country, limit);
      res.json({
        keyword,
        country,
        rankings,
      });
    } catch (error) {
      logger.error('Rankings error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route   GET /api/apps/suggestions/:term
 * @desc    Get search suggestions/autocomplete
 * @params  term (required)
 * @query   country (optional)
 */
router.get(
  '/suggestions/:term',
  [
    param('term').trim().notEmpty().withMessage('Search term is required'),
    query('country').optional().isLength({ min: 2, max: 2 }).toLowerCase(),
  ],
  validate,
  cacheMiddleware('search-suggestions', 3600),
  async (req, res) => {
    try {
      const { term } = req.params;
      const { country = 'us' } = req.query;
      const suggestions = await appStoreService.getSearchSuggestions(term, country);
      res.json({
        term,
        country,
        suggestions,
      });
    } catch (error) {
      logger.error('Suggestions error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
