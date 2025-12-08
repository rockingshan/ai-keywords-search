import OpenAI from 'openai';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { cache } from '../utils/cache.js';
import { appStoreService } from './appStore.service.js';

export class AIService {
  constructor() {
    if (config.openaiApiKey) {
      this.client = new OpenAI({
        apiKey: config.openaiApiKey,
      });
    } else {
      logger.warn('OpenAI API key not configured. AI features will be limited.');
      this.client = null;
    }
  }

  /**
   * Generate AI-powered keyword suggestions based on app description
   */
  async generateKeywordSuggestions(appDescription, category, targetAudience = '', country = 'us') {
    if (!this.client) {
      throw new Error('AI service not configured. Please set OPENAI_API_KEY.');
    }

    const cacheKey = `ai:suggestions:${Buffer.from(appDescription).toString('base64').slice(0, 50)}:${category}:${country}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const prompt = `You are an expert App Store Optimization (ASO) specialist. Analyze the following app information and generate keyword suggestions.

App Description: ${appDescription}

Category: ${category}

Target Audience: ${targetAudience || 'General'}

Country/Market: ${country.toUpperCase()}

Generate a comprehensive list of keyword suggestions. For each keyword, provide:
1. The keyword (1-3 words, optimized for App Store search)
2. Relevance score (1-10)
3. Expected competition level (low/medium/high)
4. Reasoning for including this keyword

Focus on:
- Primary keywords that directly describe the app's main function
- Secondary keywords that describe features
- Long-tail keywords with lower competition
- Trending terms in this category
- User intent keywords (what users type when looking for this type of app)

Return your response as a JSON array with objects containing: keyword, relevance, competition, reasoning

Provide at least 20 keyword suggestions.`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const content = response.choices[0].message.content;
      
      // Parse JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      let suggestions = [];
      
      if (jsonMatch) {
        try {
          suggestions = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          logger.error('Error parsing AI response:', parseError.message);
          suggestions = this.extractKeywordsFromText(content);
        }
      } else {
        suggestions = this.extractKeywordsFromText(content);
      }

      const result = {
        suggestions,
        generatedAt: new Date().toISOString(),
        model: 'gpt-4o-mini',
      };

      cache.set(cacheKey, result, 7200); // 2 hour cache
      return result;
    } catch (error) {
      logger.error('Error generating AI suggestions:', error.message);
      throw error;
    }
  }

  /**
   * Analyze competitors and suggest keyword opportunities
   */
  async analyzeCompetitors(appId, competitorIds, country = 'us') {
    if (!this.client) {
      throw new Error('AI service not configured. Please set OPENAI_API_KEY.');
    }

    try {
      // Fetch app data
      const [mainApp, ...competitors] = await Promise.all([
        appStoreService.getAppById(appId, country),
        ...competitorIds.map((id) => appStoreService.getAppById(id, country)),
      ]);

      // Extract keywords from each app
      const mainAppKeywords = await appStoreService.extractAppKeywords(appId, country);
      const competitorKeywordsData = await Promise.all(
        competitorIds.map((id) => appStoreService.extractAppKeywords(id, country))
      );

      const prompt = `You are an ASO expert. Analyze these competing apps and identify keyword opportunities.

MAIN APP:
Name: ${mainApp.name}
Category: ${mainApp.category}
Description: ${mainApp.description.slice(0, 500)}
Current Keywords (extracted): ${mainAppKeywords.keywords.slice(0, 20).map(k => k.keyword).join(', ')}

COMPETITORS:
${competitors.map((c, i) => `
${i + 1}. ${c.name}
Category: ${c.category}
Rating: ${c.rating} (${c.ratingCount} reviews)
Keywords: ${competitorKeywordsData[i]?.keywords.slice(0, 15).map(k => k.keyword).join(', ')}
`).join('\n')}

Provide:
1. Keywords competitors are ranking for that the main app is missing
2. Keyword gaps (opportunities with low competition)
3. Keywords to avoid (too competitive or irrelevant)
4. Strategic recommendations for ASO improvement

Return as JSON with: missingKeywords[], keywordGaps[], keywordsToAvoid[], recommendations[]`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      let analysis = {
        missingKeywords: [],
        keywordGaps: [],
        keywordsToAvoid: [],
        recommendations: [],
      };

      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[0]);
        } catch (e) {
          logger.error('Error parsing competitor analysis:', e.message);
        }
      }

      return {
        mainApp: {
          id: mainApp.id,
          name: mainApp.name,
        },
        competitors: competitors.map((c) => ({
          id: c.id,
          name: c.name,
        })),
        analysis,
        analyzedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error analyzing competitors:', error.message);
      throw error;
    }
  }

  /**
   * Generate optimized metadata (title, subtitle, keywords) for an app
   */
  async generateOptimizedMetadata(appDescription, currentTitle, currentSubtitle, targetKeywords, country = 'us') {
    if (!this.client) {
      throw new Error('AI service not configured. Please set OPENAI_API_KEY.');
    }

    try {
      const prompt = `You are an ASO expert. Generate optimized App Store metadata.

Current Title: ${currentTitle}
Current Subtitle: ${currentSubtitle || 'None'}
App Description: ${appDescription.slice(0, 500)}
Target Keywords: ${targetKeywords.join(', ')}
Market: ${country.toUpperCase()}

Generate optimized metadata following App Store guidelines:
- Title: Max 30 characters, include primary keyword
- Subtitle: Max 30 characters, include secondary keywords
- Keyword field: 100 characters total, comma-separated, no spaces after commas

Return as JSON:
{
  "title": "optimized title",
  "titleCharCount": number,
  "subtitle": "optimized subtitle",
  "subtitleCharCount": number,
  "keywords": "keyword1,keyword2,keyword3",
  "keywordsCharCount": number,
  "reasoning": "explanation of choices"
}`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse metadata response');
    } catch (error) {
      logger.error('Error generating metadata:', error.message);
      throw error;
    }
  }

  /**
   * Analyze keyword intent and categorize
   */
  async analyzeKeywordIntent(keywords) {
    if (!this.client) {
      throw new Error('AI service not configured. Please set OPENAI_API_KEY.');
    }

    try {
      const prompt = `Analyze these App Store keywords and categorize them by user intent:

Keywords: ${keywords.join(', ')}

Categorize each keyword into:
- navigational: User looking for a specific app
- informational: User researching/learning
- transactional: User ready to download
- commercial: User comparing options

Return as JSON array:
[{"keyword": "...", "intent": "...", "confidence": 0.0-1.0, "explanation": "..."}]`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.5,
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [];
    } catch (error) {
      logger.error('Error analyzing keyword intent:', error.message);
      throw error;
    }
  }

  /**
   * Generate localized keywords for different markets
   */
  async generateLocalizedKeywords(keywords, sourceCountry, targetCountries) {
    if (!this.client) {
      throw new Error('AI service not configured. Please set OPENAI_API_KEY.');
    }

    try {
      const countryLanguages = {
        us: 'English (US)',
        gb: 'English (UK)',
        de: 'German',
        fr: 'French',
        es: 'Spanish',
        it: 'Italian',
        pt: 'Portuguese',
        jp: 'Japanese',
        kr: 'Korean',
        cn: 'Chinese (Simplified)',
        tw: 'Chinese (Traditional)',
        br: 'Portuguese (Brazilian)',
        mx: 'Spanish (Mexican)',
        ru: 'Russian',
      };

      const prompt = `Translate and localize these App Store keywords for different markets.

Source Keywords (${countryLanguages[sourceCountry] || sourceCountry}):
${keywords.join(', ')}

Target Markets:
${targetCountries.map((c) => `- ${c.toUpperCase()}: ${countryLanguages[c] || c}`).join('\n')}

For each target market, provide:
1. Direct translations
2. Localized alternatives (terms locals actually search for)
3. Cultural adaptations if needed

Return as JSON:
{
  "translations": {
    "country_code": {
      "keywords": ["keyword1", "keyword2"],
      "localizedAlternatives": ["alt1", "alt2"],
      "notes": "cultural notes"
    }
  }
}`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { translations: {} };
    } catch (error) {
      logger.error('Error generating localized keywords:', error.message);
      throw error;
    }
  }

  /**
   * Helper to extract keywords from text when JSON parsing fails
   */
  extractKeywordsFromText(text) {
    const keywords = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^[\d\-\*\.]+\s*["']?([^"'\n:]+)["']?/);
      if (match && match[1]) {
        const keyword = match[1].trim().toLowerCase();
        if (keyword.length > 2 && keyword.length < 50) {
          keywords.push({
            keyword,
            relevance: 5,
            competition: 'medium',
            reasoning: 'Extracted from AI response',
          });
        }
      }
    }

    return keywords;
  }
}

export const aiService = new AIService();
