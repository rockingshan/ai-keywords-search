import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { cache } from '../utils/cache.js';

export class TranslationService {
  constructor() {
    this.deeplApiKey = config.deeplApiKey;
    this.deeplUrl = 'https://api-free.deepl.com/v2/translate';
  }

  /**
   * Translate text using DeepL API
   */
  async translate(text, targetLang, sourceLang = null) {
    const cacheKey = `translate:${text}:${targetLang}:${sourceLang}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    if (!this.deeplApiKey) {
      logger.warn('DeepL API key not configured. Using fallback translation.');
      return this.fallbackTranslate(text, targetLang);
    }

    try {
      const params = {
        auth_key: this.deeplApiKey,
        text,
        target_lang: targetLang.toUpperCase(),
      };

      if (sourceLang) {
        params.source_lang = sourceLang.toUpperCase();
      }

      const response = await axios.post(this.deeplUrl, null, { params });

      const result = {
        originalText: text,
        translatedText: response.data.translations[0].text,
        sourceLang: response.data.translations[0].detected_source_language,
        targetLang,
      };

      cache.set(cacheKey, result, 86400); // 24 hour cache
      return result;
    } catch (error) {
      logger.error('DeepL translation error:', error.message);
      return this.fallbackTranslate(text, targetLang);
    }
  }

  /**
   * Translate multiple keywords
   */
  async translateKeywords(keywords, targetLang, sourceLang = null) {
    const results = await Promise.allSettled(
      keywords.map((keyword) => this.translate(keyword, targetLang, sourceLang))
    );

    return results.map((result, index) => ({
      original: keywords[index],
      translated: result.status === 'fulfilled' ? result.value.translatedText : keywords[index],
      success: result.status === 'fulfilled',
    }));
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return {
      source: [
        { code: 'EN', name: 'English' },
        { code: 'DE', name: 'German' },
        { code: 'FR', name: 'French' },
        { code: 'ES', name: 'Spanish' },
        { code: 'IT', name: 'Italian' },
        { code: 'PT', name: 'Portuguese' },
        { code: 'NL', name: 'Dutch' },
        { code: 'PL', name: 'Polish' },
        { code: 'RU', name: 'Russian' },
        { code: 'JA', name: 'Japanese' },
        { code: 'ZH', name: 'Chinese' },
        { code: 'KO', name: 'Korean' },
      ],
      target: [
        { code: 'EN-US', name: 'English (US)' },
        { code: 'EN-GB', name: 'English (UK)' },
        { code: 'DE', name: 'German' },
        { code: 'FR', name: 'French' },
        { code: 'ES', name: 'Spanish' },
        { code: 'IT', name: 'Italian' },
        { code: 'PT-PT', name: 'Portuguese' },
        { code: 'PT-BR', name: 'Portuguese (Brazilian)' },
        { code: 'NL', name: 'Dutch' },
        { code: 'PL', name: 'Polish' },
        { code: 'RU', name: 'Russian' },
        { code: 'JA', name: 'Japanese' },
        { code: 'ZH', name: 'Chinese (Simplified)' },
        { code: 'KO', name: 'Korean' },
      ],
    };
  }

  /**
   * Fallback translation (basic mapping for common terms)
   */
  fallbackTranslate(text, targetLang) {
    // This is a very basic fallback - in production you'd want a better solution
    return {
      originalText: text,
      translatedText: text, // Return original if no translation available
      sourceLang: 'EN',
      targetLang,
      fallback: true,
    };
  }
}

export const translationService = new TranslationService();
