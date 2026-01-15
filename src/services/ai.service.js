import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { cache } from '../utils/cache.js';
import { appStoreService } from './appStore.service.js';
import { prisma } from '../db/prisma.js';

export class AIService {
  constructor() {
    if (config.geminiApiKey) {
      this.client = new GoogleGenerativeAI(config.geminiApiKey);
      this.model = this.client.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    } else {
      logger.warn('Google Gemini API key not configured. AI features will be limited.');
      this.client = null;
      this.model = null;
    }
  }

  /**
   * Generate AI-powered keyword suggestions based on app description
   */
  async generateKeywordSuggestions(appDescription, category, targetAudience = '', country = 'us') {
    if (!this.model) {
      throw new Error('AI service not configured. Please set GEMINI_API_KEY.');
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

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();

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

      const resultData = {
        suggestions,
        generatedAt: new Date().toISOString(),
        model: 'gemini-3-flash-preview',
      };

      // Save AI generation to database
      try {
        await prisma.aIKeywordSuggestion.create({
          data: {
            appDescription: appDescription.slice(0, 5000),
            category,
            targetAudience: targetAudience || '',
            country,
            suggestions: JSON.stringify(resultData.suggestions),
            model: resultData.model,
            generatedAt: new Date(resultData.generatedAt),
          },
        });
      } catch (dbError) {
        logger.error('Failed to save AI suggestions to database:', dbError.message);
      }

      cache.set(cacheKey, resultData, 7200); // 2 hour cache
      return resultData;
    } catch (error) {
      logger.error('Error generating AI suggestions:', error.message);
      throw error;
    }
  }

  /**
   * Analyze competitors and suggest keyword opportunities
   */
  async analyzeCompetitors(appId, competitorIds, country = 'us') {
    if (!this.model) {
      throw new Error('AI service not configured. Please set GEMINI_API_KEY.');
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
Description: ${mainApp.description?.slice(0, 500) || 'No description'}
Current Keywords (extracted): ${mainAppKeywords.keywords.slice(0, 20).map(k => k.keyword).join(', ')}

COMPETITORS:
${competitors.map((c, i) => `
${i + 1}. ${c.name}
Category: ${c.category}
Rating: ${c.rating || 'N/A'} (${c.ratingCount || 0} reviews)
Keywords: ${competitorKeywordsData[i]?.keywords.slice(0, 15).map(k => k.keyword).join(', ')}
`).join('\n')}

Provide:
1. Keywords competitors are ranking for that the main app is missing
2. Keyword gaps (opportunities with low competition)
3. Keywords to avoid (too competitive or irrelevant)
4. Strategic recommendations for ASO improvement

Return as JSON with: missingKeywords[], keywordGaps[], keywordsToAvoid[], recommendations[]`;

      const aiResult = await this.model.generateContent(prompt);
      const response = await aiResult.response;
      const content = response.text();
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

      const result = {
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

      // Save competitor analysis to database
      try {
        await prisma.aICompetitorAnalysis.create({
          data: {
            mainAppId: String(mainApp.id),
            competitorIds: JSON.stringify(competitorIds),
            country,
            missingKeywords: JSON.stringify(analysis.missingKeywords),
            keywordGaps: JSON.stringify(analysis.keywordGaps),
            keywordsToAvoid: JSON.stringify(analysis.keywordsToAvoid),
            recommendations: JSON.stringify(analysis.recommendations),
            analyzedAt: new Date(result.analyzedAt),
          },
        });
      } catch (dbError) {
        logger.error('Failed to save competitor analysis to database:', dbError.message);
      }

      return result;
    } catch (error) {
      logger.error('Error analyzing competitors:', error.message);
      throw error;
    }
  }

  /**
   * Generate optimized metadata (title, subtitle, keywords) for an app
   */
  async generateOptimizedMetadata(appDescription, currentTitle, currentSubtitle, targetKeywords, country = 'us') {
    if (!this.model) {
      throw new Error('AI service not configured. Please set GEMINI_API_KEY.');
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

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const metadata = JSON.parse(jsonMatch[0]);

        // Save metadata optimization to database
        try {
          await prisma.aIMetadataOptimization.create({
            data: {
              appDescription: appDescription.slice(0, 5000),
              currentTitle,
              currentSubtitle: currentSubtitle || '',
              targetKeywords: JSON.stringify(targetKeywords),
              country,
              optimizedTitle: metadata.title,
              titleCharCount: metadata.titleCharCount,
              optimizedSubtitle: metadata.subtitle,
              subtitleCharCount: metadata.subtitleCharCount,
              keywordField: metadata.keywords,
              keywordCharCount: metadata.keywordsCharCount,
              reasoning: metadata.reasoning,
              generatedAt: new Date(),
            },
          });
        } catch (dbError) {
          logger.error('Failed to save metadata optimization to database:', dbError.message);
        }

        return metadata;
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
    if (!this.model) {
      throw new Error('AI service not configured. Please set GEMINI_API_KEY.');
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

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      const jsonMatch = content.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);

        // Save intent analysis to database
        try {
          await prisma.aIIntentAnalysis.create({
            data: {
              keywords: JSON.stringify(keywords),
              analysis: JSON.stringify(analysis),
              analyzedAt: new Date(),
            },
          });
        } catch (dbError) {
          logger.error('Failed to save intent analysis to database:', dbError.message);
        }

        return analysis;
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
    if (!this.model) {
      throw new Error('AI service not configured. Please set GEMINI_API_KEY.');
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

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
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
   * Detailed competitive comparison between your app and a competitor
   */
  async detailedCompetitorComparison(myAppId, competitorId, country = 'us') {
    if (!this.model) {
      throw new Error('AI service not configured. Please set GEMINI_API_KEY.');
    }

    try {
      // Fetch both apps data
      const [myApp, competitorApp] = await Promise.all([
        appStoreService.getAppById(myAppId, country),
        appStoreService.getAppById(competitorId, country),
      ]);

      // Extract keywords from both apps
      const [myAppKeywords, competitorKeywords] = await Promise.all([
        appStoreService.extractAppKeywords(myAppId, country),
        appStoreService.extractAppKeywords(competitorId, country),
      ]);

      const prompt = `You are an elite App Store Optimization (ASO) consultant. Conduct a deep competitive analysis comparing two apps.

YOUR APP (Client):
Name: ${myApp.name}
Category: ${myApp.category}
Description: ${myApp.description?.slice(0, 800) || 'No description'}
Rating: ${myApp.rating || 'N/A'} (${myApp.ratingCount || 0} reviews)
Keywords (extracted): ${myAppKeywords.keywords.slice(0, 25).map(k => k.keyword).join(', ')}

COMPETITOR APP:
Name: ${competitorApp.name}
Category: ${competitorApp.category}
Description: ${competitorApp.description?.slice(0, 800) || 'No description'}
Rating: ${competitorApp.rating || 'N/A'} (${competitorApp.ratingCount || 0} reviews)
Keywords (extracted): ${competitorKeywords.keywords.slice(0, 25).map(k => k.keyword).join(', ')}

TASK: Provide a comprehensive, actionable competitive analysis with:

1. HOW THE COMPETITOR IS OUTPERFORMING:
   - Analyze their keyword strategy (which keywords they use that you don't, density, placement)
   - Metadata structure (title, subtitle optimization)
   - Description quality and keyword integration
   - User perception (based on ratings and reviews)
   - Specific advantages they have

2. STEP-BY-STEP IMPROVEMENT PLAN:
   - Provide 5-8 specific, actionable steps
   - Each step should include:
     * Clear action title
     * Detailed explanation
     * Recommended keywords to use
     * Expected impact

Return as JSON:
{
  "competitorAdvantages": [
    "advantage 1 with specific details",
    "advantage 2 with specific details",
    ...
  ],
  "improvementSteps": [
    {
      "title": "Action step title",
      "description": "Detailed explanation of what to do and why",
      "keywords": ["keyword1", "keyword2"],
      "expectedImpact": "What improvement to expect"
    },
    ...
  ]
}

Be specific, data-driven, and actionable. Focus on concrete ASO strategies that can be implemented immediately.`;

      const aiResult = await this.model.generateContent(prompt);
      const response = await aiResult.response;
      const content = response.text();
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      let analysis = {
        competitorAdvantages: [],
        improvementSteps: [],
      };

      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[0]);
        } catch (e) {
          logger.error('Error parsing detailed comparison:', e.message);
        }
      }

      const result = {
        myApp: {
          id: myApp.id,
          name: myApp.name,
        },
        competitor: {
          id: competitorApp.id,
          name: competitorApp.name,
        },
        competitorAdvantages: analysis.competitorAdvantages,
        improvementSteps: analysis.improvementSteps,
        analyzedAt: new Date().toISOString(),
      };

      return result;
    } catch (error) {
      logger.error('Error in detailed competitor comparison:', error.message);
      throw error;
    }
  }

  /**
   * Generate comprehensive keyword ideas for a category/niche
   * Used for opportunity discovery
   */
  async generateCategoryKeywords(category, targetAudience = '', count = 10, referenceKeyword = null) {
    if (!this.model) {
      throw new Error('AI service not configured. Please set GEMINI_API_KEY.');
    }

    try {
      const referenceContext = referenceKeyword
        ? `\n\nIMPORTANT: Generate keywords that are RELATED TO or VARIATIONS OF the reference keyword: "${referenceKeyword}". Include semantic variations, synonyms, long-tail versions, and problem-solution combinations around this core concept.`
        : '';

      const prompt = `You are an expert ASO strategist and keyword researcher. Generate a comprehensive list of keyword ideas for the "${category}" category in the App Store.

Target Audience: ${targetAudience || 'General users'}
Count Goal: ${count}+ keywords${referenceContext}

Generate diverse keyword variations including:

1. **Primary Keywords** - Core category terms (e.g., "fitness tracker", "workout app")
2. **Feature Keywords** - Specific features users search for (e.g., "calorie counter", "step tracker")
3. **User Intent Keywords** - What users type when they have a need (e.g., "lose weight fast", "build muscle at home")
4. **Long-tail Keywords** - Specific, less competitive phrases (e.g., "beginner home workout no equipment")
5. **Synonym Variations** - Different ways to express the same concept
6. **Problem-Solution Keywords** - Pain points users want to solve (e.g., "quick morning workout", "office desk exercises")
7. **Modifiers** - Combined with action words (e.g., "track calories", "count steps", "monitor progress")

Return ONLY a JSON array of keyword strings: ["keyword1", "keyword2", "keyword3", ...]

Be creative and think like a user searching the App Store. Include both broad and specific terms. Mix short and long-tail keywords. Aim for ${count} diverse keywords.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();

      // Parse JSON array
      const jsonMatch = content.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        try {
          const keywords = JSON.parse(jsonMatch[0]);
          logger.info(`Generated ${keywords.length} category keywords for: ${category}`);
          return keywords;
        } catch (parseError) {
          logger.error('Error parsing keyword generation response:', parseError.message);
          // Fallback: extract keywords from lines
          return this.extractKeywordsFromLines(content);
        }
      }

      return this.extractKeywordsFromLines(content);
    } catch (error) {
      logger.error('Error generating category keywords:', error.message);
      throw error;
    }
  }

  /**
   * Generate creative app concept ideas based on high-opportunity keywords
   */
  async generateAppConcepts(keywords, category, count = 5) {
    if (!this.model) {
      throw new Error('AI service not configured. Please set GEMINI_API_KEY.');
    }

    try {
      const prompt = `You are a creative product strategist specializing in mobile apps. Based on these high-opportunity keywords, suggest ${count} innovative app concepts.

High-Opportunity Keywords: ${keywords.slice(0, 20).join(', ')}
Category: ${category}

Market Gap Analysis: These keywords have high search volume but moderate competition, indicating underserved demand and opportunity for new apps.

For each app idea, provide a structured concept that solves real user problems and leverages the keyword opportunities.

Return as JSON array with ${count} app concepts:
[
  {
    "name": "Creative, memorable app name (2-4 words)",
    "elevatorPitch": "One compelling sentence describing the app's unique value",
    "description": "2-3 sentences explaining what the app does and why users need it",
    "targetKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "uniqueSellingPoints": ["USP 1 - what makes it different", "USP 2", "USP 3"],
    "keyFeatures": ["Core feature 1", "Core feature 2", "Core feature 3", "Core feature 4", "Core feature 5"],
    "targetAudience": "Specific user demographic who would benefit most",
    "estimatedDifficulty": "Easy|Moderate|Hard"
  }
]

Focus on:
- Realistic, buildable apps (not sci-fi concepts)
- Solving specific pain points the keywords reveal
- Unique angles that differentiate from existing apps
- Practical features users actually need
- Clear monetization potential

Be creative but grounded. Each idea should be distinct and valuable.`;

      const aiResult = await this.model.generateContent(prompt);
      const response = await aiResult.response;
      const content = response.text();
      const jsonMatch = content.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        try {
          const concepts = JSON.parse(jsonMatch[0]);
          logger.info(`Generated ${concepts.length} app concepts for category: ${category}`);
          return concepts;
        } catch (e) {
          logger.error('Error parsing app concepts:', e.message);
          return [];
        }
      }

      return [];
    } catch (error) {
      logger.error('Error generating app concepts:', error.message);
      throw error;
    }
  }

  /**
   * Helper to extract keywords from lines when JSON parsing fails
   */
  extractKeywordsFromLines(text) {
    const keywords = [];
    const lines = text.split('\n');

    for (const line of lines) {
      // Match quoted strings or simple text
      const matches = line.match(/"([^"]+)"/g) || [];
      matches.forEach((match) => {
        const keyword = match.replace(/"/g, '').trim().toLowerCase();
        if (keyword.length > 2 && keyword.length < 50 && !keywords.includes(keyword)) {
          keywords.push(keyword);
        }
      });
    }

    return keywords.slice(0, 100); // Limit to 100
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
