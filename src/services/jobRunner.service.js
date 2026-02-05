import { prisma } from '../db/prisma.js';
import { keywordService } from './keyword.service.js';
import { aiService } from './ai.service.js';
import { logger } from '../utils/logger.js';

/**
 * JobRunner Service - Manages continuous keyword search jobs
 * Handles scheduling, execution, and tracking of keyword discovery jobs
 */
export class JobRunnerService {
  constructor() {
    // Map of running jobs: jobId -> { intervalId, timeoutId }
    this.runningJobs = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the service and resume any running jobs
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Find jobs that were running when server stopped
      const runningJobs = await prisma.keywordSearchJob.findMany({
        where: { status: 'running' },
      });

      if (runningJobs.length > 0) {
        logger.info(`Found ${runningJobs.length} jobs that were running. Resuming...`);

        for (const job of runningJobs) {
          // Check if job should continue or be marked as paused
          if (job.currentCycle >= job.totalCycles) {
            await this.completeJob(job.id);
          } else {
            logger.info(`Resuming job: ${job.id} (${job.name})`);
            // Resume the job
            this.executeJob(job).catch(error => {
              logger.error(`Error resuming job ${job.id}:`, error);
            });
          }
        }
      }

      this.initialized = true;
      logger.info('JobRunner service initialized successfully');
    } catch (error) {
      logger.error('Error initializing JobRunner service:', error);
    }
  }

  /**
   * Create a new keyword search job
   */
  async createJob(config) {
    const {
      name,
      searchesPerBatch = 1,
      intervalMinutes = 15,
      totalCycles = 10,
      country = 'us',
      strategy = 'random',
      seedCategory = null,
      sessionId = null,
      notes = null,
    } = config;

    const job = await prisma.keywordSearchJob.create({
      data: {
        name,
        searchesPerBatch,
        intervalMinutes,
        totalCycles,
        country,
        strategy,
        seedCategory,
        sessionId,
        notes,
        status: 'pending',
        usedKeywords: JSON.stringify([]),
      },
    });

    logger.info(`Created new keyword search job: ${job.id} (${name})`);
    return job;
  }

  /**
   * Start a job
   */
  async startJob(jobId) {
    const job = await prisma.keywordSearchJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status === 'running') {
      throw new Error('Job is already running');
    }

    // Update job status
    await prisma.keywordSearchJob.update({
      where: { id: jobId },
      data: {
        status: 'running',
        startedAt: new Date(),
        lastRunAt: new Date(),
      },
    });

    logger.info(`Starting job: ${jobId} (${job.name})`);

    // Start the job execution
    this.executeJob(job);

    return { success: true, message: 'Job started' };
  }

  /**
   * Stop a running job
   */
  async stopJob(jobId) {
    const job = await prisma.keywordSearchJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'running') {
      throw new Error('Job is not running');
    }

    // Clear timers
    const jobTimers = this.runningJobs.get(jobId);
    if (jobTimers) {
      if (jobTimers.intervalId) clearInterval(jobTimers.intervalId);
      if (jobTimers.timeoutId) clearTimeout(jobTimers.timeoutId);
      this.runningJobs.delete(jobId);
    }

    // Update job status
    await prisma.keywordSearchJob.update({
      where: { id: jobId },
      data: {
        status: 'paused',
      },
    });

    logger.info(`Stopped job: ${jobId} (${job.name})`);
    return { success: true, message: 'Job stopped' };
  }

  /**
   * Execute a job - main execution loop
   */
  async executeJob(job) {
    const { id, searchesPerBatch, intervalMinutes, totalCycles, country, strategy, seedCategory } = job;

    // Get used keywords to avoid duplicates
    const usedKeywords = JSON.parse(job.usedKeywords || '[]');

    // Determine starting cycle (for resumption)
    const startCycle = Math.max(job.currentCycle || 0, 0) + 1;

    // Execute first/next cycle immediately if starting or resuming
    if (startCycle <= totalCycles) {
      await this.executeCycle(id, startCycle, searchesPerBatch, country, strategy, seedCategory, usedKeywords);
    } else {
      // Job already completed all cycles
      await this.completeJob(id);
      return;
    }

    // Schedule subsequent cycles
    const intervalMs = intervalMinutes * 60 * 1000;
    let cycleCount = startCycle;

    const intervalId = setInterval(async () => {
      cycleCount++;

      // Check if job should stop
      const currentJob = await prisma.keywordSearchJob.findUnique({
        where: { id },
      });

      if (!currentJob || currentJob.status !== 'running') {
        clearInterval(intervalId);
        this.runningJobs.delete(id);
        logger.info(`Job ${id} stopped or deleted`);
        return;
      }

      // Check if all cycles completed
      if (cycleCount > totalCycles) {
        await this.completeJob(id);
        clearInterval(intervalId);
        this.runningJobs.delete(id);
        return;
      }

      // Execute next cycle
      try {
        await this.executeCycle(id, cycleCount, searchesPerBatch, country, strategy, seedCategory, usedKeywords);
      } catch (error) {
        logger.error(`Job ${id} error in cycle ${cycleCount}:`, error);
        // Continue to next cycle despite error
      }

    }, intervalMs);

    // Store interval ID for cleanup
    this.runningJobs.set(id, { intervalId, timeoutId: null });
  }

  /**
   * Execute a single cycle of keyword searches
   */
  async executeCycle(jobId, cycleNumber, searchesPerBatch, country, strategy, seedCategory, usedKeywords) {
    logger.info(`Job ${jobId}: Starting cycle ${cycleNumber}`);

    try {
      // Generate keywords for this cycle
      const keywords = await this.generateKeywords(strategy, seedCategory, searchesPerBatch, usedKeywords);

      if (keywords.length === 0) {
        logger.warn(`Job ${jobId}: No new keywords generated for cycle ${cycleNumber}`);
        return;
      }

      // Analyze each keyword
      for (const keyword of keywords) {
        try {
          // Skip if already used
          if (usedKeywords.includes(keyword.toLowerCase())) {
            continue;
          }

          // Analyze keyword
          const analysis = await keywordService.analyzeKeyword(keyword, country);

          // Calculate opportunity score
          const opportunityScore = analysis.difficulty > 0
            ? (analysis.popularity / analysis.difficulty) * 10
            : 0;

          // Save result
          await prisma.keywordSearchResult.create({
            data: {
              jobId,
              keyword,
              cycleNumber,
              popularity: analysis.popularity,
              difficulty: analysis.difficulty,
              competitorCount: analysis.competitorCount,
              opportunityScore: Math.round(opportunityScore * 10) / 10,
              topApps: JSON.stringify(analysis.topApps),
              relatedTerms: JSON.stringify(analysis.relatedTerms),
              status: 'success',
              searchedAt: new Date(),
            },
          });

          // Add to used keywords
          usedKeywords.push(keyword.toLowerCase());

          logger.info(`Job ${jobId}: Analyzed keyword "${keyword}" - Pop: ${analysis.popularity}, Diff: ${analysis.difficulty}, Opp: ${opportunityScore.toFixed(1)}`);

          // Small delay between searches to avoid rate limiting
          await this.sleep(2000); // 2 seconds between keywords in same batch

        } catch (error) {
          logger.error(`Job ${jobId}: Error analyzing keyword "${keyword}": ${error.message}`);

          // Save error result
          await prisma.keywordSearchResult.create({
            data: {
              jobId,
              keyword,
              cycleNumber,
              status: 'error',
              errorMessage: error.message,
              searchedAt: new Date(),
            },
          });
        }
      }

      // Update job with used keywords and progress
      await prisma.keywordSearchJob.update({
        where: { id: jobId },
        data: {
          usedKeywords: JSON.stringify(usedKeywords),
          currentCycle: cycleNumber,
          totalKeywords: usedKeywords.length,
          lastRunAt: new Date(),
        },
      });

      logger.info(`Job ${jobId}: Completed cycle ${cycleNumber} - Total keywords: ${usedKeywords.length}`);

    } catch (error) {
      logger.error(`Job ${jobId}: Error in cycle ${cycleNumber}: ${error.message}`);
    }
  }

  /**
   * Generate keywords based on strategy
   */
  async generateKeywords(strategy, seedCategory, count, usedKeywords) {
    const keywords = [];

    try {
      if (strategy === 'random') {
        // Generate random keywords from diverse categories
        // Request more categories than needed to ensure diversity after filtering
        const categoriesToTry = Math.min(count * 2, 15);
        const categories = this.getRandomCategories(categoriesToTry);

        for (const category of categories) {
          if (keywords.length >= count) break;

          try {
            const categoryKeywords = await aiService.generateCategoryKeywords(
              category,
              '',
              Math.max(3, Math.ceil(count / 2)), // Generate multiple keywords per category
              null
            );

            // Filter out used keywords and add to results
            const newKeywords = categoryKeywords
              .filter(kw => {
                const kwLower = kw.toLowerCase().trim();
                return kwLower && !usedKeywords.includes(kwLower) && !keywords.includes(kw);
              })
              .slice(0, Math.ceil(count / 3)); // Take more than 1 to ensure we reach the count

            keywords.push(...newKeywords);

            // Small delay between AI calls to avoid rate limiting
            if (keywords.length < count) {
              await this.sleep(1000);
            }
          } catch (catError) {
            logger.error(`Error generating keywords for category ${category}: ${catError.message}`);
            continue;
          }
        }
      } else if (strategy === 'category') {
        // Generate keywords from specific category with multiple attempts
        const maxAttempts = 3;
        let attempt = 0;

        while (keywords.length < count && attempt < maxAttempts) {
          try {
            const categoryKeywords = await aiService.generateCategoryKeywords(
              seedCategory || 'Health & Fitness',
              '',
              count * 2, // Request more to account for duplicates
              attempt > 0 ? keywords[0] : null // Use first keyword as reference for variations
            );

            const newKeywords = categoryKeywords.filter(kw => {
              const kwLower = kw.toLowerCase().trim();
              return kwLower && !usedKeywords.includes(kwLower) && !keywords.includes(kw);
            });

            keywords.push(...newKeywords);
            attempt++;

            if (keywords.length < count && attempt < maxAttempts) {
              await this.sleep(1000);
            }
          } catch (catError) {
            logger.error(`Error generating category keywords (attempt ${attempt + 1}): ${catError.message}`);
            attempt++;
          }
        }
      } else if (strategy === 'trending') {
        // Mix of trending categories with balanced distribution
        const trendingCategories = ['Health & Fitness', 'Productivity', 'Finance', 'Education', 'Entertainment'];
        const perCategory = Math.ceil(count / trendingCategories.length);

        for (const category of trendingCategories) {
          if (keywords.length >= count) break;

          try {
            const categoryKeywords = await aiService.generateCategoryKeywords(
              category,
              '',
              perCategory * 2, // Request more to account for filtering
              null
            );

            const newKeywords = categoryKeywords
              .filter(kw => {
                const kwLower = kw.toLowerCase().trim();
                return kwLower && !usedKeywords.includes(kwLower) && !keywords.includes(kw);
              })
              .slice(0, perCategory);

            keywords.push(...newKeywords);

            // Small delay between categories
            if (keywords.length < count) {
              await this.sleep(1000);
            }
          } catch (catError) {
            logger.error(`Error generating trending keywords for ${category}: ${catError.message}`);
            continue;
          }
        }
      }

      // Limit to requested count and ensure uniqueness
      const uniqueKeywords = [...new Set(keywords)].slice(0, count);

      if (uniqueKeywords.length < count) {
        logger.warn(`Only generated ${uniqueKeywords.length} keywords out of requested ${count}`);
      }

      return uniqueKeywords;

    } catch (error) {
      logger.error(`Error generating keywords: ${error.message}`);
      return [];
    }
  }

  /**
   * Get random categories for diverse keyword generation
   */
  getRandomCategories(count) {
    const allCategories = [
      'Health & Fitness',
      'Productivity',
      'Finance',
      'Education',
      'Entertainment',
      'Social Networking',
      'Games',
      'Travel',
      'Food & Drink',
      'Shopping',
      'Lifestyle',
      'Business',
      'Medical',
      'Sports',
      'Music',
      'News',
      'Weather',
      'Utilities',
      'Navigation',
      'Photo & Video',
      'Reference',
      'Books',
      'Magazines & Newspapers',
      'Developer Tools',
      'Graphics & Design',
      'Stickers',
      'Home & Garden',
      'Parenting',
      'Pets',
      'Dating',
      'Kids',
      'Mind & Body',
      'Self-improvement',
      'Cooking',
      'Real Estate',
      'Investment',
      'Language Learning',
      'Mental Health',
      'Meditation',
      'Sleep',
      'Water Tracking',
    ];

    // Shuffle using Fisher-Yates algorithm for better randomness
    const shuffled = [...allCategories];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, Math.min(count, allCategories.length));
  }

  /**
   * Complete a job
   */
  async completeJob(jobId) {
    await prisma.keywordSearchJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    logger.info(`Job ${jobId}: Completed successfully`);
  }

  /**
   * Get job details with results
   */
  async getJobDetails(jobId) {
    const job = await prisma.keywordSearchJob.findUnique({
      where: { id: jobId },
      include: {
        results: {
          orderBy: { opportunityScore: 'desc' },
        },
      },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return {
      ...job,
      usedKeywords: JSON.parse(job.usedKeywords || '[]'),
      results: job.results.map(r => ({
        ...r,
        topApps: r.topApps ? JSON.parse(r.topApps) : [],
        relatedTerms: r.relatedTerms ? JSON.parse(r.relatedTerms) : [],
      })),
    };
  }

  /**
   * List all jobs
   */
  async listJobs(sessionId = null) {
    const where = sessionId ? { sessionId } : {};
    const jobs = await prisma.keywordSearchJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { results: true },
        },
      },
    });

    return jobs;
  }

  /**
   * Add keywords from job results to tracked keywords
   */
  async addToTrackedKeywords(jobId, resultIds, sessionId = 'default') {
    // Get the job to retrieve its country
    const job = await prisma.keywordSearchJob.findUnique({
      where: { id: jobId },
      select: { country: true },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    const results = await prisma.keywordSearchResult.findMany({
      where: {
        id: { in: resultIds },
        jobId,
        status: 'success',
      },
    });

    const tracked = [];
    for (const result of results) {
      try {
        await prisma.trackedKeyword.upsert({
          where: {
            keyword_country_sessionId: {
              keyword: result.keyword,
              country: job.country,
              sessionId,
            },
          },
          update: {
            popularity: result.popularity,
            difficulty: result.difficulty,
            opportunityScore: result.opportunityScore,
            competitorCount: result.competitorCount,
          },
          create: {
            keyword: result.keyword,
            country: job.country,
            popularity: result.popularity,
            difficulty: result.difficulty,
            opportunityScore: result.opportunityScore,
            competitorCount: result.competitorCount,
            sessionId,
          },
        });

        // Mark result as tracked
        await prisma.keywordSearchResult.update({
          where: { id: result.id },
          data: { isTracked: true },
        });

        tracked.push(result.keyword);
      } catch (error) {
        logger.error(`Error adding keyword "${result.keyword}" to tracked: ${error.message}`);
      }
    }

    logger.info(`Added ${tracked.length} keywords to tracked from job ${jobId}`);
    return { success: true, tracked };
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId) {
    // Stop if running
    const job = await prisma.keywordSearchJob.findUnique({
      where: { id: jobId },
    });

    if (job && job.status === 'running') {
      await this.stopJob(jobId);
    }

    // Delete job (cascade will delete results)
    await prisma.keywordSearchJob.delete({
      where: { id: jobId },
    });

    logger.info(`Deleted job: ${jobId}`);
    return { success: true };
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const jobRunnerService = new JobRunnerService();
