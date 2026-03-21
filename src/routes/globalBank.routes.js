import { Router } from 'express';
import { globalKeywordBankService } from '../services/globalKeywordBank.service.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * @route   GET /api/global-bank/stats
 * @desc    Get global keyword bank statistics
 * @query   country (optional, default: us)
 */
router.get('/stats', async (req, res) => {
  try {
    const { country = 'us' } = req.query;
    const stats = await globalKeywordBankService.getStats(country);
    res.json(stats);
  } catch (error) {
    logger.error('Error getting global bank stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/global-bank/keywords
 * @desc    Get all keywords in the global bank
 * @query   country (optional), explored (optional), limit, offset
 */
router.get('/keywords', async (req, res) => {
  try {
    const { country = 'us', explored, limit = 100, offset = 0 } = req.query;
    const keywords = await globalKeywordBankService.getAllKeywords(country, {
      explored: explored === 'true' ? true : explored === 'false' ? false : null,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    res.json({
      keywords,
      count: keywords.length,
      country,
    });
  } catch (error) {
    logger.error('Error getting global bank keywords:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/global-bank/unexplored
 * @desc    Get unexplored keywords (candidates for analysis)
 * @query   country (optional), limit
 */
router.get('/unexplored', async (req, res) => {
  try {
    const { country = 'us', limit = 100 } = req.query;
    const keywords = await globalKeywordBankService.getUnexploredKeywords(country, parseInt(limit));
    res.json({
      keywords,
      count: keywords.length,
      country,
    });
  } catch (error) {
    logger.error('Error getting unexplored keywords:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/global-bank/opportunities
 * @desc    Find hidden opportunities (high score but unexplored)
 * @query   country, minScore (optional, default 50), limit (optional)
 */
router.get('/opportunities', async (req, res) => {
  try {
    const { country = 'us', minScore = 50, limit = 20 } = req.query;
    const opportunities = await globalKeywordBankService.findHiddenOpportunities(
      country,
      parseInt(minScore),
      parseInt(limit)
    );
    res.json({
      opportunities,
      count: opportunities.length,
      country,
      minScore: parseInt(minScore),
    });
  } catch (error) {
    logger.error('Error finding hidden opportunities:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/global-bank/reset
 * @desc    Reset explored status for all keywords (allow re-exploration)
 * @query   country (optional, default: us)
 */
router.post('/reset', async (req, res) => {
  try {
    const { country = 'us' } = req.query;
    const result = await globalKeywordBankService.resetExplored(country);
    res.json({
      success: true,
      message: `Reset explored status for all keywords in ${country}`,
      country,
    });
  } catch (error) {
    logger.error('Error resetting global bank:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/global-bank/check/:keyword
 * @desc    Check if a keyword exists in the global bank
 * @param   keyword
 * @query   country (optional, default: us)
 */
router.get('/check/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    const { country = 'us' } = req.query;
    const exists = await globalKeywordBankService.exists(keyword, country);
    res.json({
      keyword,
      country,
      exists,
    });
  } catch (error) {
    logger.error('Error checking keyword:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
