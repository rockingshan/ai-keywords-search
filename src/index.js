import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import routes from './routes/index.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  points: config.rateLimit.maxRequests,
  duration: config.rateLimit.windowMs / 1000,
});

app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (error) {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil(error.msBeforeNext / 1000),
    });
  }
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// Mount API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'ASO Keyword API',
    version: '1.0.0',
    description: 'App Store Optimization API with AI-powered keyword search',
    documentation: '/api/docs',
    endpoints: {
      health: '/api/health',
      countries: '/api/countries',
      keywords: {
        analyze: 'GET /api/keywords/analyze?keyword=:keyword&country=:country',
        analyzeBulk: 'POST /api/keywords/analyze-bulk',
        suggestions: 'GET /api/keywords/suggestions?keyword=:keyword',
        longTail: 'GET /api/keywords/long-tail?keyword=:keyword',
        track: 'GET /api/keywords/track/:appId?keyword=:keyword',
        compareCountries: 'GET /api/keywords/compare-countries?keyword=:keyword&countries=:countries',
      },
      apps: {
        search: 'GET /api/apps/search?term=:term&country=:country',
        detail: 'GET /api/apps/:appId',
        keywords: 'GET /api/apps/:appId/keywords',
        top: 'GET /api/apps/top/:category',
        rankings: 'GET /api/apps/rankings/:keyword',
        suggestions: 'GET /api/apps/suggestions/:term',
      },
      ai: {
        suggestKeywords: 'POST /api/ai/suggest-keywords',
        analyzeCompetitors: 'POST /api/ai/analyze-competitors',
        optimizeMetadata: 'POST /api/ai/optimize-metadata',
        analyzeIntent: 'POST /api/ai/analyze-intent',
        localizeKeywords: 'POST /api/ai/localize-keywords',
        translate: 'POST /api/ai/translate',
        languages: 'GET /api/ai/languages',
      },
    },
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'ASO Keyword API Documentation',
    version: '1.0.0',
    description: 'Complete API for App Store Optimization with AI-powered keyword research',
    
    authentication: {
      type: 'API Key (coming soon)',
      header: 'Authorization: Bearer <api_key>',
    },
    
    rateLimit: {
      requests: config.rateLimit.maxRequests,
      window: `${config.rateLimit.windowMs / 1000} seconds`,
    },
    
    endpoints: [
      {
        group: 'Keywords',
        routes: [
          {
            method: 'GET',
            path: '/api/keywords/analyze',
            description: 'Analyze a single keyword for popularity and difficulty',
            params: {
              keyword: 'string (required) - The keyword to analyze',
              country: 'string (optional) - 2-letter country code (default: us)',
            },
            example: '/api/keywords/analyze?keyword=fitness&country=us',
          },
          {
            method: 'POST',
            path: '/api/keywords/analyze-bulk',
            description: 'Analyze multiple keywords at once (max 50)',
            body: {
              keywords: 'string[] (required) - Array of keywords',
              country: 'string (optional) - 2-letter country code',
            },
          },
          {
            method: 'GET',
            path: '/api/keywords/suggestions',
            description: 'Get keyword suggestions based on a seed keyword',
            params: {
              keyword: 'string (required) - Seed keyword',
              country: 'string (optional) - 2-letter country code',
            },
          },
          {
            method: 'GET',
            path: '/api/keywords/long-tail',
            description: 'Find long-tail keyword opportunities',
            params: {
              keyword: 'string (required) - Seed keyword',
              country: 'string (optional) - 2-letter country code',
            },
          },
          {
            method: 'GET',
            path: '/api/keywords/track/:appId',
            description: 'Track keyword ranking for a specific app',
            params: {
              appId: 'number (required) - App Store app ID',
              keyword: 'string (required) - Keyword to track',
              country: 'string (optional) - 2-letter country code',
            },
          },
          {
            method: 'GET',
            path: '/api/keywords/compare-countries',
            description: 'Compare keyword performance across countries',
            params: {
              keyword: 'string (required) - Keyword to compare',
              countries: 'string (optional) - Comma-separated country codes',
            },
          },
        ],
      },
      {
        group: 'Apps',
        routes: [
          {
            method: 'GET',
            path: '/api/apps/search',
            description: 'Search for apps in the App Store',
            params: {
              term: 'string (required) - Search term',
              country: 'string (optional) - 2-letter country code',
              limit: 'number (optional) - Max results (1-200)',
            },
          },
          {
            method: 'GET',
            path: '/api/apps/:appId',
            description: 'Get detailed app information',
            params: {
              appId: 'number (required) - App Store app ID',
              country: 'string (optional) - 2-letter country code',
            },
          },
          {
            method: 'GET',
            path: '/api/apps/:appId/keywords',
            description: 'Extract keywords from app metadata',
            params: {
              appId: 'number (required) - App Store app ID',
              country: 'string (optional) - 2-letter country code',
            },
          },
          {
            method: 'GET',
            path: '/api/apps/top/:category',
            description: 'Get top apps in a category',
            params: {
              category: 'string (optional) - Category name (default: all)',
              country: 'string (optional) - 2-letter country code',
              limit: 'number (optional) - Max results (1-200)',
            },
          },
          {
            method: 'GET',
            path: '/api/apps/rankings/:keyword',
            description: 'Get app rankings for a keyword',
            params: {
              keyword: 'string (required) - Keyword',
              country: 'string (optional) - 2-letter country code',
              limit: 'number (optional) - Max results',
            },
          },
        ],
      },
      {
        group: 'AI',
        routes: [
          {
            method: 'POST',
            path: '/api/ai/suggest-keywords',
            description: 'Generate AI-powered keyword suggestions',
            body: {
              description: 'string (required) - App description (50-5000 chars)',
              category: 'string (required) - App category',
              targetAudience: 'string (optional) - Target audience description',
              country: 'string (optional) - 2-letter country code',
            },
          },
          {
            method: 'POST',
            path: '/api/ai/analyze-competitors',
            description: 'Analyze competitors and find keyword gaps',
            body: {
              appId: 'number (required) - Your app ID',
              competitorIds: 'number[] (required) - Competitor app IDs (1-10)',
              country: 'string (optional) - 2-letter country code',
            },
          },
          {
            method: 'POST',
            path: '/api/ai/optimize-metadata',
            description: 'Generate optimized app metadata',
            body: {
              description: 'string (required) - App description',
              currentTitle: 'string (required) - Current app title',
              currentSubtitle: 'string (optional) - Current subtitle',
              targetKeywords: 'string[] (required) - Target keywords (1-20)',
              country: 'string (optional) - 2-letter country code',
            },
          },
          {
            method: 'POST',
            path: '/api/ai/analyze-intent',
            description: 'Analyze keyword search intent',
            body: {
              keywords: 'string[] (required) - Keywords to analyze (1-50)',
            },
          },
          {
            method: 'POST',
            path: '/api/ai/localize-keywords',
            description: 'Generate localized keywords for different markets',
            body: {
              keywords: 'string[] (required) - Keywords to localize (1-30)',
              sourceCountry: 'string (required) - Source country code',
              targetCountries: 'string[] (required) - Target country codes (1-10)',
            },
          },
          {
            method: 'POST',
            path: '/api/ai/translate',
            description: 'Translate keywords using DeepL',
            body: {
              keywords: 'string[] (required) - Keywords to translate (1-50)',
              targetLang: 'string (required) - Target language code',
              sourceLang: 'string (optional) - Source language code',
            },
          },
          {
            method: 'GET',
            path: '/api/ai/languages',
            description: 'Get supported languages for translation',
          },
        ],
      },
    ],
    
    errors: {
      400: 'Bad Request - Invalid parameters',
      404: 'Not Found - Resource not found',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong',
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`🚀 ASO Keyword API running on port ${PORT}`);
  logger.info(`📚 Documentation: http://localhost:${PORT}/api/docs`);
  logger.info(`🔍 Health check: http://localhost:${PORT}/api/health`);
  
  if (!config.openaiApiKey) {
    logger.warn('⚠️  OPENAI_API_KEY not set - AI features will be disabled');
  }
  if (!config.deeplApiKey) {
    logger.warn('⚠️  DEEPL_API_KEY not set - Translation features will be limited');
  }
});

export default app;
