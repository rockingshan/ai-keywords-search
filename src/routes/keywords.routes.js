import { Router } from 'express';
import { query, param, body, validationResult } from 'express-validator';
import { keywordService } from '../services/keyword.service.js';
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
 * @route   GET /api/keywords/analyze
 * @desc    Analyze a single keyword
 * @query   keyword (required), country (optional, default: us)
 */
router.get(
  '/analyze',
  [
    query('keyword').trim().notEmpty().withMessage('Keyword is required'),
    query('country').optional().isLength({ min: 2, max: 2 }).toLowerCase(),
  ],
  validate,
  cacheMiddleware('keyword-analyze', 1800),
  async (req, res) => {
    try {
      const { keyword, country = 'us' } = req.query;
      const result = await keywordService.analyzeKeyword(keyword, country);
      res.json(result);
    } catch (error) {
      logger.error('Keyword analyze error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route   POST /api/keywords/analyze-bulk
 * @desc    Analyze multiple keywords at once
 * @body    keywords[] (required), country (optional)
 */
router.post(
  '/analyze-bulk',
  [
    body('keywords').isArray({ min: 1, max: 50 }).withMessage('Keywords array required (max 50)'),
    body('keywords.*').trim().notEmpty(),
    body('country').optional().isLength({ min: 2, max: 2 }).toLowerCase(),
  ],
  validate,
  async (req, res) => {
    try {
      const { keywords, country = 'us' } = req.body;
      const results = await keywordService.analyzeKeywords(keywords, country);
      res.json({
        total: keywords.length,
        successful: results.filter((r) => r.success).length,
        results,
      });
    } catch (error) {
      logger.error('Bulk analyze error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route   GET /api/keywords/suggestions
 * @desc    Get keyword suggestions for a seed keyword
 * @query   keyword (required), country (optional)
 */
router.get(
  '/suggestions',
  [
    query('keyword').trim().notEmpty().withMessage('Seed keyword is required'),
    query('country').optional().isLength({ min: 2, max: 2 }).toLowerCase(),
  ],
  validate,
  cacheMiddleware('keyword-suggestions', 3600),
  async (req, res) => {
    try {
      const { keyword, country = 'us' } = req.query;
      const suggestions = await keywordService.getSuggestions(keyword, country);
      res.json({
        seedKeyword: keyword,
        country,
        suggestions,
      });
    } catch (error) {
      logger.error('Suggestions error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route   GET /api/keywords/long-tail
 * @desc    Find long-tail keyword opportunities
 * @query   keyword (required), country (optional)
 */
router.get(
  '/long-tail',
  [
    query('keyword').trim().notEmpty().withMessage('Seed keyword is required'),
    query('country').optional().isLength({ min: 2, max: 2 }).toLowerCase(),
  ],
  validate,
  cacheMiddleware('keyword-longtail', 3600),
  async (req, res) => {
    try {
      const { keyword, country = 'us' } = req.query;
      const opportunities = await keywordService.findLongTailKeywords(keyword, country);
      res.json({
        seedKeyword: keyword,
        country,
        opportunities,
      });
    } catch (error) {
      logger.error('Long-tail error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route   GET /api/keywords/track/:appId
 * @desc    Track keyword ranking for a specific app
 * @params  appId (required)
 * @query   keyword (required), country (optional)
 */
router.get(
  '/track/:appId',
  [
    param('appId').isNumeric().withMessage('Valid app ID is required'),
    query('keyword').trim().notEmpty().withMessage('Keyword is required'),
    query('country').optional().isLength({ min: 2, max: 2 }).toLowerCase(),
  ],
  validate,
  async (req, res) => {
    try {
      const { appId } = req.params;
      const { keyword, country = 'us' } = req.query;
      const ranking = await keywordService.trackKeywordRanking(appId, keyword, country);
      res.json(ranking);
    } catch (error) {
      logger.error('Track ranking error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route   GET /api/keywords/compare-countries
 * @desc    Compare keyword performance across countries
 * @query   keyword (required), countries (optional, comma-separated)
 */
router.get(
  '/compare-countries',
  [
    query('keyword').trim().notEmpty().withMessage('Keyword is required'),
    query('countries').optional().isString(),
  ],
  validate,
  cacheMiddleware('keyword-compare', 3600),
  async (req, res) => {
    try {
      const { keyword, countries } = req.query;
      const countryList = countries 
        ? countries.split(',').map((c) => c.trim().toLowerCase())
        : ['us', 'gb', 'de', 'fr', 'jp'];
      
      const comparison = await keywordService.compareKeywordAcrossCountries(keyword, countryList);
      res.json({
        keyword,
        comparison,
      });
    } catch (error) {
      logger.error('Compare countries error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
