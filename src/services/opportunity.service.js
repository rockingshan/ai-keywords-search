import { aiService } from './ai.service.js';
import { keywordService } from './keyword.service.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../db/prisma.js';

export class OpportunityService {
  /**
   * Calculate opportunity score for a keyword
   * Higher score = better opportunity (high popularity + low/moderate difficulty)
   * @param {number} popularity - 0-100
   * @param {number} difficulty - 0-100
   * @returns {number} - Opportunity score 0-100
   */
  calculateOpportunityScore(popularity, difficulty) {
    // Normalize popularity (0-100 → 0-1)
    const popScore = popularity / 100;

    // Inverse difficulty (easier = better)
    // Sweet spot: 0-30 difficulty = 1.0, 31-60 = 0.7-0.3, 61-100 = 0.3
    let diffScore;
    if (difficulty <= 30) {
      diffScore = 1.0;
    } else if (difficulty <= 60) {
      diffScore = 0.7 - ((difficulty - 30) / 30) * 0.4;
    } else {
      diffScore = 0.3;
    }

    // Weighted: 60% popularity, 40% difficulty
    const score = (popScore * 0.6 + diffScore * 0.4) * 100;
    return Math.round(score);
  }

  /**
   * Filter and sort keywords based on criteria
   * @param {Array} keywords - Array of keyword analysis results
   * @param {Object} filters - Filter criteria
   * @param {string} sortBy - Field to sort by (default: opportunityScore)
   * @returns {Array} - Filtered and sorted keywords
   */
  filterAndSortKeywords(keywords, filters = {}, sortBy = 'opportunityScore') {
    let filtered = keywords.filter((k) => {
      if (filters.minPopularity && k.popularity < filters.minPopularity) return false;
      if (filters.maxPopularity && k.popularity > filters.maxPopularity) return false;
      if (filters.minDifficulty && k.difficulty < filters.minDifficulty) return false;
      if (filters.maxDifficulty && k.difficulty > filters.maxDifficulty) return false;
      if (filters.minOpportunityScore && k.opportunityScore < filters.minOpportunityScore) return false;
      if (filters.maxCompetitors && k.competitorCount > filters.maxCompetitors) return false;
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'opportunityScore') {
        return (b.opportunityScore || 0) - (a.opportunityScore || 0);
      } else if (sortBy === 'popularity') {
        return b.popularity - a.popularity;
      } else if (sortBy === 'difficulty') {
        return a.difficulty - b.difficulty; // Ascending (easier first)
      } else if (sortBy === 'competitorCount') {
        return a.competitorCount - b.competitorCount;
      }
      return 0;
    });

    return filtered;
  }

  /**
   * Discover keyword opportunities for a category
   * Main orchestration function
   * @param {string} category - Category to explore (e.g., "Fitness")
   * @param {string} targetAudience - Target audience (optional)
   * @param {string} country - Country code (default: 'us')
   * @param {Object} filters - Filter criteria (optional)
   * @param {string} referenceKeyword - Reference keyword for related keyword generation (optional)
   * @returns {Object} - Discovery results with keywords, stats, and top opportunities
   */
  async discoverCategoryOpportunities(category, targetAudience = '', country = 'us', filters = {}, referenceKeyword = null) {
    try {
      logger.info(`Discovering opportunities for category: ${category}${referenceKeyword ? ` (related to: ${referenceKeyword})` : ''}`);

      // Step 1: Generate 10 keyword ideas using AI (rate limit protection)
      const keywordIdeas = await aiService.generateCategoryKeywords(category, targetAudience, 10, referenceKeyword);
      logger.info(`Generated ${keywordIdeas.length} keyword ideas`);

      // Step 2: Analyze keywords in batches of 50 (bulk analysis limit)
      const batchSize = 50;
      const allResults = [];

      for (let i = 0; i < keywordIdeas.length; i += batchSize) {
        const batch = keywordIdeas.slice(i, i + batchSize);
        logger.info(`Analyzing batch ${Math.floor(i / batchSize) + 1} (${batch.length} keywords)`);

        const batchResults = await keywordService.analyzeKeywords(batch, country);

        // Extract successful analyses
        const successfulResults = batchResults
          .filter((r) => r.success && r.data)
          .map((r) => r.data);

        allResults.push(...successfulResults);
      }

      logger.info(`Successfully analyzed ${allResults.length} keywords`);

      // Step 3: Calculate opportunity scores
      const keywordsWithScores = allResults.map((k) => ({
        ...k,
        opportunityScore: this.calculateOpportunityScore(k.popularity, k.difficulty),
      }));

      // Step 4: Apply filters and sort
      const filteredKeywords = this.filterAndSortKeywords(keywordsWithScores, filters);

      // Step 5: Calculate stats
      const stats = {
        total: filteredKeywords.length,
        highOpportunity: filteredKeywords.filter((k) => k.opportunityScore >= 70).length,
        avgDifficulty: Math.round(
          filteredKeywords.reduce((sum, k) => sum + k.difficulty, 0) / filteredKeywords.length || 0
        ),
        avgPopularity: Math.round(
          filteredKeywords.reduce((sum, k) => sum + k.popularity, 0) / filteredKeywords.length || 0
        ),
        avgOpportunityScore: Math.round(
          filteredKeywords.reduce((sum, k) => sum + k.opportunityScore, 0) / filteredKeywords.length || 0
        ),
        bestScore: filteredKeywords.length > 0 ? filteredKeywords[0].opportunityScore : 0,
      };

      // Step 6: Get top 20 opportunities
      const topOpportunities = filteredKeywords.slice(0, 20);

      const result = {
        keywords: filteredKeywords,
        stats,
        topOpportunities,
        category,
        targetAudience,
        country,
        discoveredAt: new Date().toISOString(),
      };

      // Step 7: Save to database
      try {
        await prisma.opportunityDiscovery.create({
          data: {
            category,
            targetAudience: targetAudience || null,
            country,
            keywords: JSON.stringify(filteredKeywords),
            topOpportunities: JSON.stringify(topOpportunities),
            filters: JSON.stringify(filters),
            discoveredAt: new Date(),
          },
        });
      } catch (dbError) {
        logger.error('Failed to save opportunity discovery to database:', dbError.message);
        // Don't fail the request if DB save fails
      }

      return result;
    } catch (error) {
      logger.error('Error discovering opportunities:', error.message);
      throw error;
    }
  }
}

export const opportunityService = new OpportunityService();
