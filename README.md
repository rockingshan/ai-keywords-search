# ASO Keyword API

A powerful Node.js backend API for App Store Optimization (ASO) with AI-powered keyword research, similar to [Astro](https://tryastro.app).

## Features

- 🔍 **Keyword Analysis** - Get popularity and difficulty scores for any keyword
- 🤖 **AI-Powered Suggestions** - Generate keyword ideas using Claude AI
- 📊 **Competitor Analysis** - Find keyword gaps and opportunities
- 🌍 **Multi-Country Support** - Track keywords across 50+ App Store regions
- 📈 **Rank Tracking** - Monitor your app's keyword rankings
- 🔄 **Auto-Complete Data** - Access App Store search suggestions
- 🌐 **Translation** - Localize keywords with DeepL integration
- ⚡ **Caching** - Built-in caching for optimal performance
- 🛡️ **Rate Limiting** - Protect your API from abuse

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone or copy the project
cd aso-api

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your API keys
nano .env

# Start the server
npm start
```

### Environment Variables

```env
# Required
PORT=3000
NODE_ENV=development

# AI Features (Required for AI endpoints)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Translation (Optional)
DEEPL_API_KEY=your_deepl_api_key

# Cache & Rate Limiting
CACHE_TTL_SECONDS=3600
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## API Endpoints

### Keywords

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/keywords/analyze` | Analyze a single keyword |
| POST | `/api/keywords/analyze-bulk` | Analyze multiple keywords |
| GET | `/api/keywords/suggestions` | Get keyword suggestions |
| GET | `/api/keywords/long-tail` | Find long-tail opportunities |
| GET | `/api/keywords/track/:appId` | Track keyword ranking |
| GET | `/api/keywords/compare-countries` | Compare across countries |

### Apps

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/apps/search` | Search App Store |
| GET | `/api/apps/:appId` | Get app details |
| GET | `/api/apps/:appId/keywords` | Extract app keywords |
| GET | `/api/apps/top/:category` | Get top apps |
| GET | `/api/apps/rankings/:keyword` | Get keyword rankings |
| GET | `/api/apps/suggestions/:term` | Get search suggestions |

### AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/suggest-keywords` | AI keyword suggestions |
| POST | `/api/ai/analyze-competitors` | Competitor analysis |
| POST | `/api/ai/optimize-metadata` | Optimize app metadata |
| POST | `/api/ai/analyze-intent` | Analyze search intent |
| POST | `/api/ai/localize-keywords` | Localize for markets |
| POST | `/api/ai/translate` | Translate keywords |
| GET | `/api/ai/languages` | Supported languages |

## Usage Examples

### Analyze a Keyword

```bash
curl "http://localhost:3000/api/keywords/analyze?keyword=fitness&country=us"
```

Response:
```json
{
  "keyword": "fitness",
  "country": "us",
  "popularity": 72,
  "difficulty": 85,
  "competitorCount": 10,
  "topApps": [...],
  "relatedTerms": ["fitness tracker", "workout", "exercise"],
  "analyzedAt": "2025-01-15T10:30:00Z"
}
```

### Bulk Keyword Analysis

```bash
curl -X POST "http://localhost:3000/api/keywords/analyze-bulk" \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["fitness", "workout", "gym", "exercise"],
    "country": "us"
  }'
```

### AI Keyword Suggestions

```bash
curl -X POST "http://localhost:3000/api/ai/suggest-keywords" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "A fitness app that helps users track workouts, count calories, and achieve their health goals with personalized AI coaching.",
    "category": "Health & Fitness",
    "targetAudience": "Adults aged 25-45 interested in fitness",
    "country": "us"
  }'
```

### Competitor Analysis

```bash
curl -X POST "http://localhost:3000/api/ai/analyze-competitors" \
  -H "Content-Type: application/json" \
  -d '{
    "appId": 1234567890,
    "competitorIds": [987654321, 456789123, 321654987],
    "country": "us"
  }'
```

### Search Apps

```bash
curl "http://localhost:3000/api/apps/search?term=fitness%20tracker&country=us&limit=10"
```

### Track Keyword Ranking

```bash
curl "http://localhost:3000/api/keywords/track/1234567890?keyword=fitness&country=us"
```

### Compare Keyword Across Countries

```bash
curl "http://localhost:3000/api/keywords/compare-countries?keyword=fitness&countries=us,gb,de,fr,jp"
```

### Translate Keywords

```bash
curl -X POST "http://localhost:3000/api/ai/translate" \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["fitness tracker", "workout planner", "calorie counter"],
    "targetLang": "DE",
    "sourceLang": "EN"
  }'
```

## Project Structure

```
aso-api/
├── src/
│   ├── config/
│   │   └── index.js          # Configuration
│   ├── routes/
│   │   ├── index.js          # Route aggregator
│   │   ├── keywords.routes.js # Keyword endpoints
│   │   ├── apps.routes.js    # App endpoints
│   │   └── ai.routes.js      # AI endpoints
│   ├── services/
│   │   ├── appStore.service.js    # App Store data
│   │   ├── keyword.service.js     # Keyword analysis
│   │   ├── ai.service.js          # AI integration
│   │   └── translation.service.js # Translation
│   ├── utils/
│   │   ├── logger.js         # Logging utility
│   │   └── cache.js          # Caching utility
│   └── index.js              # App entry point
├── .env.example              # Environment template
├── package.json
└── README.md
```

## Data Sources

### Keyword Popularity

The API estimates keyword popularity using multiple signals:
1. **App Store Search Suggestions** - Priority scores from Apple's autocomplete
2. **Search Results Quality** - Rating counts of top apps (more ratings = more searches)
3. **Keyword Length** - Shorter keywords typically have higher search volume

For official Apple Search Ads popularity data (5-100 scale), you would need:
- An Apple Search Ads account
- Access to the Apple Search Ads API

### Keyword Difficulty

Difficulty is calculated based on:
- Average rating of top 10 competing apps
- Average rating count (download proxy)
- Strength of top 3 apps (market dominance)
- Total competitor count

## Extending the API

### Adding Apple Search Ads Integration

If you have Apple Search Ads API access:

```javascript
// src/services/appleSearchAds.service.js
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { config } from '../config/index.js';

export class AppleSearchAdsService {
  constructor() {
    this.baseUrl = 'https://api.searchads.apple.com/api/v4';
  }

  async getAccessToken() {
    // Implement OAuth token generation
    // See: https://developer.apple.com/documentation/apple_search_ads
  }

  async getKeywordPopularity(keywords, country) {
    const token = await this.getAccessToken();
    // Call Apple Search Ads API for actual popularity scores
  }
}
```

### Adding Database Persistence

For storing historical data:

```bash
npm install prisma @prisma/client
npx prisma init
```

## Rate Limits

- Default: 100 requests per minute per IP
- Bulk endpoints: Count as multiple requests
- Cached responses don't count against limits

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## Support

For issues and feature requests, please open a GitHub issue.
