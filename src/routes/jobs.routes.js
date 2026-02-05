import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { jobRunnerService } from '../services/jobRunner.service.js';
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
 * @route   POST /api/jobs
 * @desc    Create a new keyword search job
 * @body    name, searchesPerBatch, intervalMinutes, totalCycles, country, strategy, seedCategory
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Job name is required'),
    body('searchesPerBatch').optional().isInt({ min: 1, max: 10 }).withMessage('Searches per batch must be 1-10'),
    body('intervalMinutes').optional().isInt({ min: 1, max: 1440 }).withMessage('Interval must be 1-1440 minutes'),
    body('totalCycles').optional().isInt({ min: 1, max: 1000 }).withMessage('Total cycles must be 1-1000'),
    body('country').optional().isLength({ min: 2, max: 2 }).toLowerCase(),
    body('strategy').optional().isIn(['random', 'category', 'trending']).withMessage('Strategy must be random, category, or trending'),
    body('seedCategory').optional().trim(),
    body('sessionId').optional().trim(),
    body('notes').optional().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const job = await jobRunnerService.createJob(req.body);
      res.status(201).json(job);
    } catch (error) {
      logger.error('Error creating job:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route   GET /api/jobs
 * @desc    List all keyword search jobs
 * @query   sessionId (optional)
 */
router.get('/', async (req, res) => {
  try {
    const { sessionId } = req.query;
    const jobs = await jobRunnerService.listJobs(sessionId);
    res.json(jobs);
  } catch (error) {
    logger.error('Error listing jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/jobs/:id
 * @desc    Get job details with results
 */
router.get('/:id', async (req, res) => {
  try {
    const job = await jobRunnerService.getJobDetails(req.params.id);
    res.json(job);
  } catch (error) {
    if (error.message === 'Job not found') {
      res.status(404).json({ error: error.message });
    } else {
      logger.error('Error getting job details:', error);
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * @route   POST /api/jobs/:id/start
 * @desc    Start a job
 */
router.post('/:id/start', async (req, res) => {
  try {
    const result = await jobRunnerService.startJob(req.params.id);
    res.json(result);
  } catch (error) {
    if (error.message === 'Job not found') {
      res.status(404).json({ error: error.message });
    } else if (error.message === 'Job is already running') {
      res.status(400).json({ error: error.message });
    } else {
      logger.error('Error starting job:', error);
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * @route   POST /api/jobs/:id/stop
 * @desc    Stop a running job
 */
router.post('/:id/stop', async (req, res) => {
  try {
    const result = await jobRunnerService.stopJob(req.params.id);
    res.json(result);
  } catch (error) {
    if (error.message === 'Job not found') {
      res.status(404).json({ error: error.message });
    } else if (error.message === 'Job is not running') {
      res.status(400).json({ error: error.message });
    } else {
      logger.error('Error stopping job:', error);
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Delete a job
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await jobRunnerService.deleteJob(req.params.id);
    res.json(result);
  } catch (error) {
    logger.error('Error deleting job:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/jobs/:id/track-keywords
 * @desc    Add keywords from job results to tracked keywords
 * @body    resultIds[] (array of result IDs to track)
 */
router.post(
  '/:id/track-keywords',
  [
    body('resultIds').isArray({ min: 1 }).withMessage('resultIds must be an array'),
    body('sessionId').optional().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { resultIds, sessionId = 'default' } = req.body;
      const result = await jobRunnerService.addToTrackedKeywords(req.params.id, resultIds, sessionId);
      res.json(result);
    } catch (error) {
      logger.error('Error adding keywords to tracked:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
