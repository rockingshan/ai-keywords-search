import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';
import { cache } from '../utils/cache.js';

const APP_STORE_BASE_URL = 'https://itunes.apple.com';
const SEARCH_HINTS_URL = 'https://search.itunes.apple.com/WebObjects/MZSearchHints.woa/wa/hints';

export class AppStoreService {
  constructor() {
    this.axios = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
  }

  /**
   * Search for apps in the App Store
   */
  async searchApps(term, country = 'us', limit = 25) {
    const cacheKey = `search:${term}:${country}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.axios.get(`${APP_STORE_BASE_URL}/search`, {
        params: {
          term,
          country,
          media: 'software',
          limit,
          entity: 'software',
        },
      });

      const results = response.data.results.map((app) => ({
        id: app.trackId,
        bundleId: app.bundleId,
        name: app.trackName,
        developer: app.artistName,
        icon: app.artworkUrl100,
        price: app.price,
        currency: app.currency,
        rating: app.averageUserRating,
        ratingCount: app.userRatingCount,
        description: app.description,
        releaseNotes: app.releaseNotes,
        version: app.version,
        category: app.primaryGenreName,
        categoryId: app.primaryGenreId,
        url: app.trackViewUrl,
        screenshots: app.screenshotUrls,
        size: app.fileSizeBytes,
        minimumOsVersion: app.minimumOsVersion,
        releaseDate: app.releaseDate,
        currentVersionReleaseDate: app.currentVersionReleaseDate,
        languages: app.languageCodesISO2A,
        contentRating: app.contentAdvisoryRating,
      }));

      cache.set(cacheKey, results, 1800); // 30 min cache
      return results;
    } catch (error) {
      logger.error('Error searching apps:', error.message);
      throw new Error(`Failed to search apps: ${error.message}`);
    }
  }

  /**
   * Get app details by ID
   */
  async getAppById(appId, country = 'us') {
    const cacheKey = `app:${appId}:${country}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.axios.get(`${APP_STORE_BASE_URL}/lookup`, {
        params: {
          id: appId,
          country,
        },
      });

      if (response.data.resultCount === 0) {
        throw new Error('App not found');
      }

      const app = response.data.results[0];
      const result = {
        id: app.trackId,
        bundleId: app.bundleId,
        name: app.trackName,
        developer: app.artistName,
        developerId: app.artistId,
        icon: app.artworkUrl512 || app.artworkUrl100,
        price: app.price,
        currency: app.currency,
        rating: app.averageUserRating,
        ratingCount: app.userRatingCount,
        description: app.description,
        releaseNotes: app.releaseNotes,
        version: app.version,
        category: app.primaryGenreName,
        categoryId: app.primaryGenreId,
        genres: app.genres,
        url: app.trackViewUrl,
        screenshots: app.screenshotUrls,
        ipadScreenshots: app.ipadScreenshotUrls,
        size: app.fileSizeBytes,
        minimumOsVersion: app.minimumOsVersion,
        releaseDate: app.releaseDate,
        currentVersionReleaseDate: app.currentVersionReleaseDate,
        languages: app.languageCodesISO2A,
        contentRating: app.contentAdvisoryRating,
        sellerName: app.sellerName,
        supportedDevices: app.supportedDevices,
      };

      cache.set(cacheKey, result, 3600); // 1 hour cache
      return result;
    } catch (error) {
      logger.error('Error fetching app:', error.message);
      throw new Error(`Failed to fetch app: ${error.message}`);
    }
  }

  /**
   * Get autocomplete/search suggestions from App Store
   * This provides keyword hints with priority scores
   */
  async getSearchSuggestions(term, country = 'us') {
    const cacheKey = `suggestions:${term}:${country}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Apple's search hints API
      const response = await this.axios.get(SEARCH_HINTS_URL, {
        params: {
          clientApplication: 'Software',
          term,
          storefront: this.getStorefrontId(country),
        },
      });

      const suggestions = [];
      
      if (response.data && response.data.hints) {
        response.data.hints.forEach((hint, index) => {
          suggestions.push({
            keyword: hint.term,
            priority: hint.priority || (100 - index * 5), // Estimated priority
            position: index + 1,
          });
        });
      }

      cache.set(cacheKey, suggestions, 3600);
      return suggestions;
    } catch (error) {
      logger.error('Error fetching suggestions:', error.message);
      // Fallback: return empty array instead of throwing
      return [];
    }
  }

  /**
   * Get top apps in a category
   */
  async getTopApps(category = 'all', country = 'us', limit = 100) {
    const cacheKey = `top:${category}:${country}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const genreId = this.getCategoryId(category);
      const response = await this.axios.get(
        `${APP_STORE_BASE_URL}/${country}/rss/topfreeapplications/${genreId ? `genre=${genreId}/` : ''}limit=${limit}/json`
      );

      const apps = response.data.feed.entry.map((entry, index) => ({
        rank: index + 1,
        id: entry.id.attributes['im:id'],
        name: entry['im:name'].label,
        developer: entry['im:artist'].label,
        icon: entry['im:image'][2].label,
        category: entry.category.attributes.label,
        url: entry.link[0].attributes.href,
        summary: entry.summary?.label,
        price: entry['im:price'].attributes.amount,
        currency: entry['im:price'].attributes.currency,
      }));

      cache.set(cacheKey, apps, 3600);
      return apps;
    } catch (error) {
      logger.error('Error fetching top apps:', error.message);
      throw new Error(`Failed to fetch top apps: ${error.message}`);
    }
  }

  /**
   * Get apps ranking for a specific keyword
   */
  async getKeywordRankings(keyword, country = 'us', limit = 10) {
    try {
      const searchResults = await this.searchApps(keyword, country, limit);
      
      return searchResults.map((app, index) => ({
        rank: index + 1,
        app: {
          id: app.id,
          name: app.name,
          developer: app.developer,
          icon: app.icon,
          rating: app.rating,
          ratingCount: app.ratingCount,
        },
      }));
    } catch (error) {
      logger.error('Error fetching keyword rankings:', error.message);
      throw error;
    }
  }

  /**
   * Extract keywords from an app's metadata
   */
  async extractAppKeywords(appId, country = 'us') {
    try {
      const app = await this.getAppById(appId, country);
      
      // Extract keywords from title, subtitle (description first line), and description
      const text = `${app.name} ${app.description}`.toLowerCase();
      
      // Basic keyword extraction (will be enhanced by AI service)
      const words = text
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length > 2)
        .filter((word) => !this.isStopWord(word));

      // Count word frequency
      const wordCount = {};
      words.forEach((word) => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });

      // Sort by frequency
      const keywords = Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([word, count]) => ({
          keyword: word,
          frequency: count,
        }));

      return {
        appId: app.id,
        appName: app.name,
        category: app.category,
        keywords,
      };
    } catch (error) {
      logger.error('Error extracting keywords:', error.message);
      throw error;
    }
  }

  /**
   * Get storefront ID for a country
   */
  getStorefrontId(country) {
    const storefronts = {
      us: 143441,
      gb: 143444,
      ca: 143455,
      au: 143460,
      de: 143443,
      fr: 143442,
      jp: 143462,
      kr: 143466,
      cn: 143465,
      br: 143503,
      mx: 143468,
      es: 143454,
      it: 143450,
      nl: 143452,
      ru: 143469,
      in: 143467,
      se: 143456,
      sg: 143464,
      tw: 143470,
      hk: 143463,
    };
    return storefronts[country] || storefronts.us;
  }

  /**
   * Get category ID
   */
  getCategoryId(category) {
    const categories = {
      all: null,
      games: 6014,
      business: 6000,
      education: 6017,
      entertainment: 6016,
      finance: 6015,
      food: 6023,
      health: 6013,
      lifestyle: 6012,
      music: 6011,
      navigation: 6010,
      news: 6009,
      photo: 6008,
      productivity: 6007,
      social: 6005,
      sports: 6004,
      travel: 6003,
      utilities: 6002,
      weather: 6001,
    };
    return categories[category.toLowerCase()] || null;
  }

  /**
   * Check if word is a stop word
   */
  isStopWord(word) {
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
      'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'were', 'they',
      'this', 'that', 'with', 'will', 'your', 'from', 'when', 'what', 'which',
      'their', 'would', 'there', 'about', 'more', 'some', 'very', 'just', 'into',
      'over', 'such', 'than', 'them', 'other', 'only', 'then', 'also', 'most',
      'app', 'apps', 'use', 'using', 'used', 'new', 'best', 'free', 'get',
    ]);
    return stopWords.has(word);
  }
}

export const appStoreService = new AppStoreService();
