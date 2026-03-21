import { prisma } from '../db/prisma.js';
import { logger } from '../utils/logger.js';

/**
 * GlobalKeywordBank Service
 * Manages a global bank of all keywords across all sources to prevent duplicate analysis
 * and enable smarter keyword discovery
 */
export class GlobalKeywordBankService {
  /**
   * Add a keyword to the global bank (if not already exists)
   * @param {Object} keywordData - Keyword data to store
   * @param {string} source - Source of the keyword: 'job', 'opportunity_discovery', 'manual'
   * @param {string} sourceId - ID of the source (job ID, discovery ID, etc.)
   */
  async addKeyword(keywordData, source = 'manual', sourceId = null) {
    const {
      keyword,
      country = 'us',
      popularity,
      difficulty,
      competitorCount,
      opportunityScore,
      topApps,
      relatedTerms,
      sessionId,
    } = keywordData;

    try {
      // Upsert - update if exists, create if not
      const existing = await prisma.globalKeywordBank.findUnique({
        where: {
          keyword_country: {
            keyword: keyword.toLowerCase(),
            country,
          },
        },
      });

      if (existing) {
        // Update existing entry with fresh data but preserve explored status
        return await prisma.globalKeywordBank.update({
          where: { id: existing.id },
          data: {
            popularity,
            difficulty,
            competitorCount,
            opportunityScore,
            topApps: topApps ? JSON.stringify(topApps) : null,
            relatedTerms: relatedTerms ? JSON.stringify(relatedTerms) : null,
            analyzedAt: new Date(),
          },
        });
      }

      // Create new entry
      return await prisma.globalKeywordBank.create({
        data: {
          keyword: keyword.toLowerCase(),
          country,
          popularity,
          difficulty,
          competitorCount,
          opportunityScore,
          topApps: topApps ? JSON.stringify(topApps) : null,
          relatedTerms: relatedTerms ? JSON.stringify(relatedTerms) : null,
          source,
          sourceId,
          sessionId,
        },
      });
    } catch (error) {
      logger.error(`Error adding keyword to global bank: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add multiple keywords to the global bank
   */
  async addKeywords(keywords, source = 'manual', sourceId = null) {
    const results = [];
    for (const kw of keywords) {
      try {
        const result = await this.addKeyword(kw, source, sourceId);
        results.push({ success: true, keyword: kw.keyword, result });
      } catch (error) {
        results.push({ success: false, keyword: kw.keyword, error: error.message });
      }
    }
    return results;
  }

  /**
   * Get all analyzed keywords for a country
   */
  async getAllKeywords(country = 'us', options = {}) {
    const { explored = null, limit = 1000, offset = 0 } = options;

    const where = { country };
    if (explored !== null) {
      where.explored = explored;
    }

    const keywords = await prisma.globalKeywordBank.findMany({
      where,
      orderBy: { analyzedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return keywords.map(kw => ({
      ...kw,
      topApps: kw.topApps ? JSON.parse(kw.topApps) : [],
      relatedTerms: kw.relatedTerms ? JSON.parse(kw.relatedTerms) : [],
    }));
  }

  /**
   * Get unexplored keywords - these are candidates for job analysis
   */
  async getUnexploredKeywords(country = 'us', limit = 100) {
    const keywords = await prisma.globalKeywordBank.findMany({
      where: {
        country,
        explored: false,
      },
      orderBy: [
        { opportunityScore: 'desc' },  // Best opportunities first
        { analyzedAt: 'desc' },         // Recent first
      ],
      take: limit,
    });

    return keywords.map(kw => ({
      ...kw,
      topApps: kw.topApps ? JSON.parse(kw.topApps) : [],
      relatedTerms: kw.relatedTerms ? JSON.parse(kw.relatedTerms) : [],
    }));
  }

  /**
   * Get all unique keywords (lowercase) that have been analyzed
   * Used to prevent duplicate analysis
   */
  async getAnalyzedKeywordStrings(country = 'us') {
    const keywords = await prisma.globalKeywordBank.findMany({
      where: { country },
      select: { keyword: true },
    });
    return keywords.map(kw => kw.keyword.toLowerCase());
  }

  /**
   * Check if a keyword exists in the bank
   */
  async exists(keyword, country = 'us') {
    const result = await prisma.globalKeywordBank.findUnique({
      where: {
        keyword_country: {
          keyword: keyword.toLowerCase(),
          country,
        },
      },
    });
    return !!result;
  }

  /**
   * Mark a keyword as "explored" (used by a job for generating related keywords)
   */
  async markExplored(keyword, country = 'us') {
    await prisma.globalKeywordBank.updateMany({
      where: {
        keyword: keyword.toLowerCase(),
        country,
      },
      data: {
        explored: true,
      },
    });
  }

  /**
   * Mark multiple keywords as explored
   */
  async markManyExplored(keywords, country = 'us') {
    const keywordLower = keywords.map(kw => kw.toLowerCase());
    await prisma.globalKeywordBank.updateMany({
      where: {
        keyword: { in: keywordLower },
        country,
      },
      data: {
        explored: true,
      },
    });
  }

  /**
   * Get keyword count statistics
   */
  async getStats(country = 'us') {
    const [total, explored, unexplored] = await Promise.all([
      prisma.globalKeywordBank.count({ where: { country } }),
      prisma.globalKeywordBank.count({ where: { country, explored: true } }),
      prisma.globalKeywordBank.count({ where: { country, explored: false } }),
    ]);

    return {
      total,
      explored,
      unexplored,
      country,
    };
  }

  /**
   * Find keywords with high opportunity but unexplored
   * Good candidates for deeper analysis
   */
  async findHiddenOpportunities(country = 'us', minOpportunityScore = 50, limit = 20) {
    const keywords = await prisma.globalKeywordBank.findMany({
      where: {
        country,
        explored: false,
        opportunityScore: { gte: minOpportunityScore },
      },
      orderBy: { opportunityScore: 'desc' },
      take: limit,
    });

    return keywords.map(kw => ({
      ...kw,
      topApps: kw.topApps ? JSON.parse(kw.topApps) : [],
      relatedTerms: kw.relatedTerms ? JSON.parse(kw.relatedTerms) : [],
    }));
  }

  /**
   * Reset explored status for all keywords (allow re-exploration)
   */
  async resetExplored(country = 'us') {
    return await prisma.globalKeywordBank.updateMany({
      where: { country },
      data: { explored: false },
    });
  }

  /**
   * Delete keywords by source (e.g., all from a specific job)
   */
  async deleteBySource(sourceId) {
    return await prisma.globalKeywordBank.deleteMany({
      where: { sourceId },
    });
  }

  /**
   * Clean up old entries (optional maintenance)
   */
  async cleanup(daysOld = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    return await prisma.globalKeywordBank.deleteMany({
      where: {
        analyzedAt: { lt: cutoff },
        explored: true,  // Only delete already-explored ones
      },
    });
  }
}

export const globalKeywordBankService = new GlobalKeywordBankService();
