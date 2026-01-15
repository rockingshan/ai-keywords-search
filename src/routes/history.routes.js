import { Router } from 'express';
import { query, param, validationResult } from 'express-validator';
import { prisma } from '../db/prisma.js';
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
 * GET /api/history/keywords/:keyword
 * Get historical analysis data for a keyword
 */
router.get(
  '/keywords/:keyword',
  [
    param('keyword').trim().notEmpty().withMessage('Keyword is required'),
    query('country').optional().isLength({ min: 2, max: 2 }).withMessage('Country must be 2 characters'),
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1-365'),
  ],
  validate,
  async (req, res) => {
    try {
      const { keyword } = req.params;
      const { country = 'us', days = 30 } = req.query;

      const history = await prisma.keywordAnalysis.findMany({
        where: {
          keyword: {
            equals: keyword,
            mode: 'insensitive',
          },
          country,
          analyzedAt: {
            gte: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { analyzedAt: 'desc' },
        take: 100,
      });

      // Calculate trends
      const trend = calculateTrend(history);

      res.json({
        keyword,
        country,
        totalDataPoints: history.length,
        history: history.map((h) => ({
          ...h,
          topApps: JSON.parse(h.topApps),
          relatedTerms: JSON.parse(h.relatedTerms),
        })),
        trend,
      });
    } catch (error) {
      logger.error('History fetch error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/history/rankings/:appId
 * Get ranking history for an app
 */
router.get(
  '/rankings/:appId',
  [
    param('appId').isNumeric().withMessage('App ID must be numeric'),
    query('keyword').optional().trim(),
    query('country').optional().isLength({ min: 2, max: 2 }),
    query('days').optional().isInt({ min: 1, max: 365 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { appId } = req.params;
      const { keyword, country = 'us', days = 30 } = req.query;

      const where = {
        appId,
        country,
        trackedAt: {
          gte: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000),
        },
      };

      if (keyword) {
        where.keyword = {
          equals: keyword,
          mode: 'insensitive',
        };
      }

      const history = await prisma.rankingHistory.findMany({
        where,
        orderBy: { trackedAt: 'desc' },
        take: 100,
      });

      res.json({
        appId,
        keyword: keyword || 'all',
        country,
        history: history.map((h) => ({
          ...h,
          topCompetitors: JSON.parse(h.topCompetitors),
        })),
      });
    } catch (error) {
      logger.error('Ranking history error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/history/trending
 * Get trending keywords based on search frequency
 */
router.get(
  '/trending',
  [
    query('country').optional().isLength({ min: 2, max: 2 }),
    query('hours').optional().isInt({ min: 1, max: 168 }).withMessage('Hours must be between 1-168'),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { country = 'us', hours = 24, limit = 20 } = req.query;

      // Aggregate searches by keyword in the last N hours
      const trending = await prisma.keywordAnalysis.groupBy({
        by: ['keyword'],
        where: {
          country,
          analyzedAt: {
            gte: new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000),
          },
        },
        _count: {
          keyword: true,
        },
        _avg: {
          popularity: true,
          difficulty: true,
        },
        orderBy: {
          _count: {
            keyword: 'desc',
          },
        },
        take: parseInt(limit),
      });

      res.json({
        country,
        period: `${hours} hours`,
        trending: trending.map((t) => ({
          keyword: t.keyword,
          searchCount: t._count.keyword,
          avgPopularity: Math.round(t._avg.popularity || 0),
          avgDifficulty: Math.round(t._avg.difficulty || 0),
        })),
      });
    } catch (error) {
      logger.error('Trending keywords error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/history/ai-generations
 * Get past AI generations
 */
router.get(
  '/ai-generations',
  [
    query('type').optional().isIn(['keywords', 'competitors', 'metadata', 'intent']),
    query('days').optional().isInt({ min: 1, max: 90 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { type = 'keywords', days = 7, limit = 20 } = req.query;

      const dateFilter = {
        gte: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000),
      };

      let generations = [];

      switch (type) {
        case 'keywords':
          generations = await prisma.aIKeywordSuggestion.findMany({
            where: { generatedAt: dateFilter },
            orderBy: { generatedAt: 'desc' },
            take: parseInt(limit),
          });
          generations = generations.map((g) => ({
            ...g,
            suggestions: JSON.parse(g.suggestions),
          }));
          break;

        case 'competitors':
          generations = await prisma.aICompetitorAnalysis.findMany({
            where: { analyzedAt: dateFilter },
            orderBy: { analyzedAt: 'desc' },
            take: parseInt(limit),
          });
          generations = generations.map((g) => ({
            ...g,
            competitorIds: JSON.parse(g.competitorIds),
            missingKeywords: JSON.parse(g.missingKeywords),
            keywordGaps: JSON.parse(g.keywordGaps),
            keywordsToAvoid: JSON.parse(g.keywordsToAvoid),
            recommendations: JSON.parse(g.recommendations),
          }));
          break;

        case 'metadata':
          generations = await prisma.aIMetadataOptimization.findMany({
            where: { generatedAt: dateFilter },
            orderBy: { generatedAt: 'desc' },
            take: parseInt(limit),
          });
          generations = generations.map((g) => ({
            ...g,
            targetKeywords: JSON.parse(g.targetKeywords),
          }));
          break;

        case 'intent':
          generations = await prisma.aIIntentAnalysis.findMany({
            where: { analyzedAt: dateFilter },
            orderBy: { analyzedAt: 'desc' },
            take: parseInt(limit),
          });
          generations = generations.map((g) => ({
            ...g,
            keywords: JSON.parse(g.keywords),
            analysis: JSON.parse(g.analysis),
          }));
          break;
      }

      res.json({
        type,
        count: generations.length,
        generations,
      });
    } catch (error) {
      logger.error('AI generations history error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Helper function to calculate trend
 */
function calculateTrend(history) {
  if (history.length < 2) {
    return { direction: 'stable', change: 0 };
  }

  // Compare first and last data points
  const latest = history[0];
  const oldest = history[history.length - 1];

  const popularityChange = latest.popularity - oldest.popularity;
  const difficultyChange = latest.difficulty - oldest.difficulty;

  return {
    direction:
      popularityChange > 5
        ? 'rising'
        : popularityChange < -5
        ? 'falling'
        : 'stable',
    popularityChange,
    difficultyChange,
    dataPoints: history.length,
  };
}

export default router;
