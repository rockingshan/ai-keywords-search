import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../db/prisma.js';

const router = Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ========== TRACKED KEYWORDS ==========

// Get all tracked keywords
router.get('/keywords', [
  query('sessionId').optional().trim(),
  query('limit').optional().isInt({ min: 1, max: 500 }),
], validate, async (req, res) => {
  try {
    const { sessionId, limit = 100 } = req.query;
    const effectiveSessionId = sessionId || 'default';

    const keywords = await prisma.trackedKeyword.findMany({
      where: { sessionId: effectiveSessionId },
      orderBy: { trackedAt: 'desc' },
      take: parseInt(limit),
    });

    res.json({ keywords, total: keywords.length });
  } catch (error) {
    console.error('Error fetching tracked keywords:', error);
    res.status(500).json({ error: 'Failed to fetch tracked keywords' });
  }
});

// Track new keyword(s) - bulk support
router.post('/keywords', [
  body('keywords').isArray({ min: 1, max: 50 }),
  body('keywords.*.keyword').trim().notEmpty(),
  body('keywords.*.country').optional({ values: 'null' }).isLength({ min: 2, max: 2 }),
  body('keywords.*.popularity').optional({ values: 'null' }).isInt({ min: 0, max: 100 }),
  body('keywords.*.difficulty').optional({ values: 'null' }).isInt({ min: 0, max: 100 }),
  body('keywords.*.opportunityScore').optional({ values: 'null' }).isInt({ min: 0, max: 100 }),
  body('keywords.*.competitorCount').optional({ values: 'null' }).isInt({ min: 0 }),
  body('sessionId').optional({ values: 'null' }).trim(),
], validate, async (req, res) => {
  try {
    const { keywords, sessionId } = req.body;
    console.log('Tracking keywords request:', { count: keywords.length, sessionId });

    // Use upsert to avoid duplicates
    const created = [];
    const effectiveSessionId = sessionId || 'default';

    for (const kw of keywords) {
      console.log('Tracking keyword:', kw.keyword);
      const tracked = await prisma.trackedKeyword.upsert({
        where: {
          keyword_country_sessionId: {
            keyword: kw.keyword,
            country: kw.country || 'us',
            sessionId: effectiveSessionId,
          },
        },
        update: {
          popularity: kw.popularity,
          difficulty: kw.difficulty,
          opportunityScore: kw.opportunityScore,
          competitorCount: kw.competitorCount,
        },
        create: {
          keyword: kw.keyword,
          country: kw.country || 'us',
          popularity: kw.popularity,
          difficulty: kw.difficulty,
          opportunityScore: kw.opportunityScore,
          competitorCount: kw.competitorCount,
          sessionId: effectiveSessionId,
        },
      });
      created.push(tracked);
    }

    res.json({
      success: true,
      tracked: created.length,
      keywords: created,
    });
  } catch (error) {
    console.error('Error tracking keywords:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      error: 'Failed to track keywords',
      details: error.message,
      code: error.code
    });
  }
});

// Remove tracked keyword
router.delete('/keywords/:id', [
  param('id').trim().notEmpty(),
], validate, async (req, res) => {
  try {
    await prisma.trackedKeyword.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tracked keyword:', error);
    res.status(500).json({ error: 'Failed to delete tracked keyword' });
  }
});

// ========== SAVED APP IDEAS ==========

// Get all saved app ideas
router.get('/app-ideas', [
  query('sessionId').optional().trim(),
  query('category').optional().trim(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], validate, async (req, res) => {
  try {
    const { sessionId, category, limit = 50 } = req.query;

    const where = {};
    if (sessionId) where.sessionId = sessionId;
    if (category) where.category = category;

    const ideas = await prisma.savedAppIdea.findMany({
      where,
      orderBy: { savedAt: 'desc' },
      take: parseInt(limit),
    });

    // Parse JSON fields
    const parsed = ideas.map(idea => ({
      ...idea,
      targetKeywords: JSON.parse(idea.targetKeywords),
      uniqueSellingPoints: JSON.parse(idea.uniqueSellingPoints),
      keyFeatures: JSON.parse(idea.keyFeatures),
    }));

    res.json({ ideas: parsed, total: parsed.length });
  } catch (error) {
    console.error('Error fetching saved app ideas:', error);
    res.status(500).json({ error: 'Failed to fetch saved app ideas' });
  }
});

// Save app idea
router.post('/app-ideas', [
  body('name').trim().notEmpty(),
  body('elevatorPitch').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('targetKeywords').isArray(),
  body('uniqueSellingPoints').isArray(),
  body('keyFeatures').isArray(),
  body('targetAudience').trim().notEmpty(),
  body('estimatedDifficulty').isIn(['Easy', 'Moderate', 'Hard']),
  body('category').trim().notEmpty(),
  body('sessionId').optional().trim(),
  body('notes').optional().trim(),
], validate, async (req, res) => {
  try {
    const { sessionId, notes, ...ideaData } = req.body;

    const saved = await prisma.savedAppIdea.create({
      data: {
        ...ideaData,
        targetKeywords: JSON.stringify(ideaData.targetKeywords),
        uniqueSellingPoints: JSON.stringify(ideaData.uniqueSellingPoints),
        keyFeatures: JSON.stringify(ideaData.keyFeatures),
        sessionId: sessionId || null,
        notes: notes || null,
      },
    });

    res.json({ success: true, idea: saved });
  } catch (error) {
    console.error('Error saving app idea:', error);
    res.status(500).json({ error: 'Failed to save app idea' });
  }
});

// Delete saved app idea
router.delete('/app-ideas/:id', [
  param('id').trim().notEmpty(),
], validate, async (req, res) => {
  try {
    await prisma.savedAppIdea.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting saved app idea:', error);
    res.status(500).json({ error: 'Failed to delete saved app idea' });
  }
});

export default router;
