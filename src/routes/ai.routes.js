import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { aiService } from '../services/ai.service.js';
import { translationService } from '../services/translation.service.js';
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
 * @route   POST /api/ai/suggest-keywords
 * @desc    Generate AI-powered keyword suggestions
 * @body    description (required), category (required), targetAudience (optional), country (optional)
 */
router.post(
  '/suggest-keywords',
  [
    body('description').trim().notEmpty().withMessage('App description is required')
      .isLength({ min: 50, max: 5000 }).withMessage('Description must be 50-5000 characters'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('targetAudience').optional().trim(),
    body('country').optional().isLength({ min: 2, max: 2 }).toLowerCase(),
  ],
  validate,
  async (req, res) => {
    try {
      const { description, category, targetAudience, country = 'us' } = req.body;
      const suggestions = await aiService.generateKeywordSuggestions(
        description,
        category,
        targetAudience,
        country
      );
      res.json(suggestions);
    } catch (error) {
      logger.error('AI suggestions error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route   POST /api/ai/analyze-competitors
 * @desc    Analyze competitors and find keyword opportunities
 * @body    appId (required), competitorIds[] (required), country (optional)
 */
router.post(
  '/analyze-competitors',
  [
    body('appId').isNumeric().withMessage('Valid app ID is required'),
    body('competitorIds').isArray({ min: 1, max: 10 }).withMessage('1-10 competitor IDs required'),
    body('competitorIds.*').isNumeric(),
    body('country').optional().isLength({ min: 2, max: 2 }).toLowerCase(),
  ],
  validate,
  async (req, res) => {
    try {
      const { appId, competitorIds, country = 'us' } = req.body;
      const analysis = await aiService.analyzeCompetitors(appId, competitorIds, country);
      res.json(analysis);
    } catch (error) {
      logger.error('Competitor analysis error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route   POST /api/ai/optimize-metadata
 * @desc    Generate optimized app metadata
 * @body    description (required), currentTitle (required), currentSubtitle (optional), targetKeywords[] (required), country (optional)
 */
router.post(
  '/optimize-metadata',
  [
    body('description').trim().notEmpty().withMessage('App description is required'),
    body('currentTitle').trim().notEmpty().withMessage('Current title is required'),
    body('currentSubtitle').optional().trim(),
    body('targetKeywords').isArray({ min: 1, max: 20 }).withMessage('1-20 target keywords required'),
    body('targetKeywords.*').trim().notEmpty(),
    body('country').optional().isLength({ min: 2, max: 2 }).toLowerCase(),
  ],
  validate,
  async (req, res) => {
    try {
      const { description, currentTitle, currentSubtitle, targetKeywords, country = 'us' } = req.body;
      const optimized = await aiService.generateOptimizedMetadata(
        description,
        currentTitle,
        currentSubtitle,
        targetKeywords,
        country
      );
      res.json(optimized);
    } catch (error) {
      logger.error('Optimize metadata error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route   POST /api/ai/analyze-intent
 * @desc    Analyze keyword intent and categorize
 * @body    keywords[] (required)
 */
router.post(
  '/analyze-intent',
  [
    body('keywords').isArray({ min: 1, max: 50 }).withMessage('1-50 keywords required'),
    body('keywords.*').trim().notEmpty(),
  ],
  validate,
  async (req, res) => {
    try {
      const { keywords } = req.body;
      const analysis = await aiService.analyzeKeywordIntent(keywords);
      res.json({
        total: keywords.length,
        analysis,
      });
    } catch (error) {
      logger.error('Intent analysis error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route   POST /api/ai/localize-keywords
 * @desc    Generate localized keywords for different markets
 * @body    keywords[] (required), sourceCountry (required), targetCountries[] (required)
 */
router.post(
  '/localize-keywords',
  [
    body('keywords').isArray({ min: 1, max: 30 }).withMessage('1-30 keywords required'),
    body('keywords.*').trim().notEmpty(),
    body('sourceCountry').isLength({ min: 2, max: 2 }).toLowerCase().withMessage('Source country code required'),
    body('targetCountries').isArray({ min: 1, max: 10 }).withMessage('1-10 target countries required'),
    body('targetCountries.*').isLength({ min: 2, max: 2 }).toLowerCase(),
  ],
  validate,
  async (req, res) => {
    try {
      const { keywords, sourceCountry, targetCountries } = req.body;
      const localized = await aiService.generateLocalizedKeywords(keywords, sourceCountry, targetCountries);
      res.json(localized);
    } catch (error) {
      logger.error('Localization error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route   POST /api/ai/translate
 * @desc    Translate keywords using DeepL
 * @body    keywords[] (required), targetLang (required), sourceLang (optional)
 */
router.post(
  '/translate',
  [
    body('keywords').isArray({ min: 1, max: 50 }).withMessage('1-50 keywords required'),
    body('keywords.*').trim().notEmpty(),
    body('targetLang').trim().notEmpty().withMessage('Target language is required'),
    body('sourceLang').optional().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { keywords, targetLang, sourceLang } = req.body;
      const translations = await translationService.translateKeywords(keywords, targetLang, sourceLang);
      res.json({
        targetLang,
        sourceLang: sourceLang || 'auto-detected',
        translations,
      });
    } catch (error) {
      logger.error('Translation error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route   GET /api/ai/languages
 * @desc    Get supported languages for translation
 */
router.get('/languages', (req, res) => {
  const languages = translationService.getSupportedLanguages();
  res.json(languages);
});

export default router;
