import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // AI Configuration
  geminiApiKey: process.env.GEMINI_API_KEY,

  // Apple Search Ads Configuration
  apple: {
    teamId: process.env.APPLE_TEAM_ID,
    keyId: process.env.APPLE_KEY_ID,
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
  },
  
  // Translation
  deeplApiKey: process.env.DEEPL_API_KEY,
  
  // Cache
  cacheTtl: parseInt(process.env.CACHE_TTL_SECONDS) || 3600,
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  
  // Supported App Store countries
  supportedCountries: [
    { code: 'us', name: 'United States' },
    { code: 'gb', name: 'United Kingdom' },
    { code: 'ca', name: 'Canada' },
    { code: 'au', name: 'Australia' },
    { code: 'de', name: 'Germany' },
    { code: 'fr', name: 'France' },
    { code: 'jp', name: 'Japan' },
    { code: 'kr', name: 'South Korea' },
    { code: 'cn', name: 'China' },
    { code: 'br', name: 'Brazil' },
    { code: 'mx', name: 'Mexico' },
    { code: 'es', name: 'Spain' },
    { code: 'it', name: 'Italy' },
    { code: 'nl', name: 'Netherlands' },
    { code: 'ru', name: 'Russia' },
    { code: 'in', name: 'India' },
    { code: 'id', name: 'Indonesia' },
    { code: 'tr', name: 'Turkey' },
    { code: 'sa', name: 'Saudi Arabia' },
    { code: 'ae', name: 'United Arab Emirates' },
    { code: 'sg', name: 'Singapore' },
    { code: 'th', name: 'Thailand' },
    { code: 'vn', name: 'Vietnam' },
    { code: 'ph', name: 'Philippines' },
    { code: 'my', name: 'Malaysia' },
    { code: 'tw', name: 'Taiwan' },
    { code: 'hk', name: 'Hong Kong' },
    { code: 'se', name: 'Sweden' },
    { code: 'no', name: 'Norway' },
    { code: 'dk', name: 'Denmark' },
    { code: 'fi', name: 'Finland' },
    { code: 'pl', name: 'Poland' },
    { code: 'at', name: 'Austria' },
    { code: 'ch', name: 'Switzerland' },
    { code: 'be', name: 'Belgium' },
    { code: 'pt', name: 'Portugal' },
    { code: 'ie', name: 'Ireland' },
    { code: 'nz', name: 'New Zealand' },
    { code: 'za', name: 'South Africa' },
    { code: 'il', name: 'Israel' },
    { code: 'eg', name: 'Egypt' },
    { code: 'ng', name: 'Nigeria' },
    { code: 'ke', name: 'Kenya' },
    { code: 'co', name: 'Colombia' },
    { code: 'ar', name: 'Argentina' },
    { code: 'cl', name: 'Chile' },
    { code: 'pe', name: 'Peru' },
    { code: 'cz', name: 'Czech Republic' },
    { code: 'hu', name: 'Hungary' },
    { code: 'ro', name: 'Romania' },
    { code: 'gr', name: 'Greece' },
    { code: 'ua', name: 'Ukraine' },
  ],
};
