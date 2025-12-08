import { appStoreService } from './appStore.service.js';
import { logger } from '../utils/logger.js';
import { cache } from '../utils/cache.js';

export class KeywordService {
  /**
   * Analyze a keyword - get popularity, difficulty, and related data
   */
  async analyzeKeyword(keyword, country = 'us') {
    const cacheKey = `keyword:${keyword}:${country}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Get search results to calculate difficulty
      const searchResults = await appStoreService.searchApps(keyword, country, 10);
      
      // Get search suggestions to estimate popularity
      const suggestions = await appStoreService.getSearchSuggestions(keyword, country);
      
      // Calculate difficulty based on competition
      const difficulty = this.calculateDifficulty(searchResults);
      
      // Estimate popularity based on suggestions and search results
      const popularity = this.estimatePopularity(keyword, suggestions, searchResults);
      
      // Get top competing apps
      const topApps = searchResults.slice(0, 5).map((app, index) => ({
        rank: index + 1,
        id: app.id,
        name: app.name,
        developer: app.developer,
        rating: app.rating,
        ratingCount: app.ratingCount,
        icon: app.icon,
      }));

      const result = {
        keyword,
        country,
        popularity,
        difficulty,
        competitorCount: searchResults.length,
        topApps,
        relatedTerms: suggestions.slice(0, 10).map((s) => s.keyword),
        analyzedAt: new Date().toISOString(),
      };

      cache.set(cacheKey, result, 3600);
      return result;
    } catch (error) {
      logger.error('Error analyzing keyword:', error.message);
      throw error;
    }
  }

  /**
   * Bulk analyze multiple keywords
   */
  async analyzeKeywords(keywords, country = 'us') {
    const results = await Promise.allSettled(
      keywords.map((keyword) => this.analyzeKeyword(keyword, country))
    );

    return results.map((result, index) => ({
      keyword: keywords[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null,
    }));
  }

  /**
   * Calculate keyword difficulty based on competing apps
   * Returns a score from 0-100 (higher = more difficult)
   */
  calculateDifficulty(searchResults) {
    if (!searchResults || searchResults.length === 0) {
      return 10; // Low difficulty if no competition
    }

    let difficultyScore = 0;
    const weights = {
      avgRating: 15,
      avgRatingCount: 35,
      topAppStrength: 30,
      competitorCount: 20,
    };

    // Average rating of top 10 apps
    const avgRating = searchResults.reduce((sum, app) => sum + (app.rating || 0), 0) / searchResults.length;
    difficultyScore += (avgRating / 5) * weights.avgRating;

    // Average rating count (normalized, cap at 100k)
    const avgRatingCount = searchResults.reduce((sum, app) => sum + (app.ratingCount || 0), 0) / searchResults.length;
    const normalizedRatingCount = Math.min(avgRatingCount / 100000, 1);
    difficultyScore += normalizedRatingCount * weights.avgRatingCount;

    // Top app strength (first 3 apps)
    const topApps = searchResults.slice(0, 3);
    const topAppScore = topApps.reduce((sum, app) => {
      const ratingScore = (app.rating || 0) / 5;
      const countScore = Math.min((app.ratingCount || 0) / 500000, 1);
      return sum + (ratingScore * 0.3 + countScore * 0.7);
    }, 0) / 3;
    difficultyScore += topAppScore * weights.topAppStrength;

    // Competitor count factor
    const competitorFactor = Math.min(searchResults.length / 10, 1);
    difficultyScore += competitorFactor * weights.competitorCount;

    return Math.round(Math.min(difficultyScore, 100));
  }

  /**
   * Estimate keyword popularity
   * Returns a score from 5-100 (mimicking Apple's SAP scale)
   */
  estimatePopularity(keyword, suggestions, searchResults) {
    let popularityScore = 5; // Minimum score

    // Check if keyword appears in suggestions
    const suggestionMatch = suggestions.find(
      (s) => s.keyword.toLowerCase() === keyword.toLowerCase()
    );
    
    if (suggestionMatch) {
      // Higher position in suggestions = higher popularity
      popularityScore += Math.max(0, 50 - suggestionMatch.position * 5);
      if (suggestionMatch.priority) {
        popularityScore += Math.min(suggestionMatch.priority / 2, 25);
      }
    }

    // Factor in search results quality
    if (searchResults && searchResults.length > 0) {
      const avgRatingCount = searchResults.reduce(
        (sum, app) => sum + (app.ratingCount || 0), 0
      ) / searchResults.length;
      
      // More ratings suggest more searches
      popularityScore += Math.min(avgRatingCount / 10000, 20);
    }

    // Keyword length factor (shorter keywords tend to be more popular)
    if (keyword.length <= 5) {
      popularityScore += 10;
    } else if (keyword.length <= 10) {
      popularityScore += 5;
    }

    return Math.min(Math.round(popularityScore), 100);
  }

  /**
   * Get keyword suggestions based on a seed keyword
   */
  async getSuggestions(seedKeyword, country = 'us') {
    try {
      const suggestions = await appStoreService.getSearchSuggestions(seedKeyword, country);
      
      // Analyze each suggestion
      const analyzedSuggestions = await Promise.allSettled(
        suggestions.slice(0, 10).map(async (suggestion) => {
          const analysis = await this.analyzeKeyword(suggestion.keyword, country);
          return {
            ...suggestion,
            popularity: analysis.popularity,
            difficulty: analysis.difficulty,
          };
        })
      );

      return analyzedSuggestions
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value);
    } catch (error) {
      logger.error('Error getting suggestions:', error.message);
      throw error;
    }
  }

  /**
   * Find long-tail keyword opportunities
   */
  async findLongTailKeywords(seedKeyword, country = 'us') {
    const modifiers = [
      'best', 'free', 'top', 'app', 'apps', 'pro', 'lite', 'easy',
      'simple', 'fast', 'quick', 'new', 'online', 'offline', 'mobile',
    ];

    const longTailKeywords = [];

    // Generate combinations
    for (const modifier of modifiers) {
      longTailKeywords.push(`${modifier} ${seedKeyword}`);
      longTailKeywords.push(`${seedKeyword} ${modifier}`);
    }

    // Analyze a subset
    const results = await this.analyzeKeywords(
      longTailKeywords.slice(0, 15),
      country
    );

    // Filter for good opportunities (low difficulty, decent popularity)
    return results
      .filter((r) => r.success && r.data)
      .map((r) => r.data)
      .filter((kw) => kw.difficulty < 50 && kw.popularity > 15)
      .sort((a, b) => {
        // Score = popularity / difficulty (higher is better)
        const scoreA = a.popularity / (a.difficulty || 1);
        const scoreB = b.popularity / (b.difficulty || 1);
        return scoreB - scoreA;
      });
  }

  /**
   * Track keyword ranking for an app
   */
  async trackKeywordRanking(appId, keyword, country = 'us') {
    try {
      const rankings = await appStoreService.getKeywordRankings(keyword, country, 100);
      
      const appRanking = rankings.find((r) => r.app.id === parseInt(appId));
      
      return {
        appId,
        keyword,
        country,
        rank: appRanking ? appRanking.rank : null,
        isRanking: !!appRanking,
        totalResults: rankings.length,
        topCompetitors: rankings.slice(0, 5),
        trackedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error tracking keyword:', error.message);
      throw error;
    }
  }

  /**
   * Compare keyword performance across countries
   */
  async compareKeywordAcrossCountries(keyword, countries = ['us', 'gb', 'de', 'fr', 'jp']) {
    const results = await Promise.allSettled(
      countries.map(async (country) => {
        const analysis = await this.analyzeKeyword(keyword, country);
        return {
          country,
          ...analysis,
        };
      })
    );

    return results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value);
  }
}

export const keywordService = new KeywordService();
