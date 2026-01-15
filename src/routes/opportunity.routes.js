import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { opportunityService } from '../services/opportunity.service.js';
import { aiService } from '../services/ai.service.js';
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
 * @route   POST /api/opportunities/discover
 * @desc    Discover keyword opportunities for a category
 * @body    category (required), targetAudience (optional), country (optional), filters (optional), referenceKeyword (optional)
 */
router.post(
  '/discover',
  [
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('targetAudience').optional().trim(),
    body('country').optional().isLength({ min: 2, max: 2 }).toLowerCase(),
    body('filters').optional().isObject(),
    body('filters.minPopularity').optional().isInt({ min: 0, max: 100 }),
    body('filters.maxPopularity').optional().isInt({ min: 0, max: 100 }),
    body('filters.minDifficulty').optional().isInt({ min: 0, max: 100 }),
    body('filters.maxDifficulty').optional().isInt({ min: 0, max: 100 }),
    body('filters.minOpportunityScore').optional().isInt({ min: 0, max: 100 }),
    body('filters.maxCompetitors').optional().isInt({ min: 0 }),
    body('referenceKeyword').optional().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { category, targetAudience, country = 'us', filters = {}, referenceKeyword } = req.body;

      logger.info(`Opportunity discovery request: category=${category}, audience=${targetAudience || 'none'}, country=${country}${referenceKeyword ? `, ref=${referenceKeyword}` : ''}`);

      const results = await opportunityService.discoverCategoryOpportunities(
        category,
        targetAudience,
        country,
        filters,
        referenceKeyword
      );

      res.json(results);
    } catch (error) {
      logger.error('Opportunity discovery error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route   POST /api/opportunities/app-ideas
 * @desc    Generate app concept ideas based on keywords
 * @body    keywords[] (required), category (required), count (optional)
 */
router.post(
  '/app-ideas',
  [
    body('keywords').isArray({ min: 1, max: 50 }).withMessage('Keywords array required (1-50)'),
    body('keywords.*').trim().notEmpty(),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('count').optional().isInt({ min: 1, max: 10 }).withMessage('Count must be 1-10'),
  ],
  validate,
  async (req, res) => {
    try {
      const { keywords, category, count = 5 } = req.body;

      logger.info(`Generating ${count} app ideas for category: ${category}`);

      const ideas = await aiService.generateAppConcepts(keywords, category, count);

      res.json({
        ideas,
        count: ideas.length,
        category,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('App ideas generation error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
