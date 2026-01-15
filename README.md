# ASO Keyword Research Platform

A full-stack App Store Optimization (ASO) platform with AI-powered keyword research, beautiful React frontend, and persistent historical data tracking. Similar to [Astro](https://tryastro.app) but open-source and self-hosted.

## 🎯 Features

### Backend API
- 🔍 **Keyword Analysis** - Get popularity and difficulty scores for any keyword
- 🤖 **AI-Powered Suggestions** - Generate keyword ideas using Google Gemini AI
- 📊 **Competitor Analysis** - Find keyword gaps and opportunities
- 🌍 **Multi-Country Support** - Track keywords across 50+ App Store regions
- 📈 **Rank Tracking** - Monitor your app's keyword rankings
- 🔄 **Auto-Complete Data** - Access App Store search suggestions
- 🌐 **Translation** - Localize keywords with DeepL integration
- ⚡ **Caching** - Built-in caching for optimal performance
- 🛡️ **Rate Limiting** - Protect your API from abuse
- 💾 **Database Persistence** - SQLite database with Prisma ORM for historical tracking
- 📊 **Analytics** - Request tracking and usage analytics

### Frontend Application
- 🎨 **Modern UI** - React + TypeScript with warm orange theme
- 📱 **Responsive Design** - Works beautifully on desktop and mobile
- 🌙 **Dark Mode** - Eye-friendly dark theme by default
- ⚡ **Real-time Updates** - TanStack Query for instant data synchronization
- 📈 **Data Visualization** - Beautiful charts and graphs with Recharts
- 🔥 **Trending Keywords** - See what's hot in real-time
- 🤖 **AI Tools** - Built-in AI keyword generator, competitor analyzer, and more
- 📜 **Search History** - Track and revisit your research
- 🎯 **7 Comprehensive Pages** - Dashboard, Keyword Research, App Explorer, Rank Tracking, Competitor Analysis, AI Tools, and History

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Backend Setup

```bash
# Install backend dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your API keys
nano .env

# Run database migration
npx prisma migrate dev --name init

# Start the backend server (http://localhost:3000)
npm start
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Start the frontend dev server (http://localhost:5173)
npm run dev
```

### Accessing the Platform

Once both servers are running:
- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/health

### Environment Variables

```env
# Required
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="file:./prisma/aso.db"

# AI Features (Required for AI endpoints)
# Get your API key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_google_gemini_api_key

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

### History & Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/history/keywords/:keyword` | Historical trend data for a keyword |
| GET | `/api/history/rankings/:appId` | App ranking history over time |
| GET | `/api/history/trending` | Trending keywords by search frequency |
| GET | `/api/history/ai-generations` | Past AI generations and analyses |

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

## 📁 Project Structure

```
aso-keyword-platform/
├── src/                      # Backend source code
│   ├── config/
│   │   └── index.js          # Configuration
│   ├── db/
│   │   └── prisma.js         # Prisma client singleton
│   ├── middleware/
│   │   └── analytics.js      # Request tracking middleware
│   ├── routes/
│   │   ├── index.js          # Route aggregator
│   │   ├── keywords.routes.js # Keyword endpoints
│   │   ├── apps.routes.js    # App endpoints
│   │   ├── ai.routes.js      # AI endpoints
│   │   └── history.routes.js # History endpoints
│   ├── services/
│   │   ├── appStore.service.js    # App Store data
│   │   ├── keyword.service.js     # Keyword analysis
│   │   ├── ai.service.js          # AI integration
│   │   └── translation.service.js # Translation
│   ├── utils/
│   │   ├── logger.js         # Logging utility
│   │   └── cache.js          # Caching utility
│   └── index.js              # Backend entry point
├── prisma/
│   ├── schema.prisma         # Database schema (12 models)
│   ├── migrations/           # Database migrations
│   └── aso.db               # SQLite database file
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── api/              # API client layer
│   │   │   ├── client.ts     # Axios instance
│   │   │   ├── keywords.ts   # Keyword API methods
│   │   │   ├── apps.ts       # App API methods
│   │   │   ├── ai.ts         # AI API methods
│   │   │   └── history.ts    # History API methods
│   │   ├── components/
│   │   │   ├── ui/           # UI components (Button, Card, etc.)
│   │   │   └── layout/       # Layout components
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx         # Main dashboard
│   │   │   ├── KeywordResearch.tsx   # Keyword analysis
│   │   │   ├── AppExplorer.tsx       # App search
│   │   │   ├── RankTracking.tsx      # Rank monitoring
│   │   │   ├── CompetitorAnalysis.tsx # Gap analysis
│   │   │   ├── AITools.tsx           # AI features
│   │   │   └── History.tsx           # Search history
│   │   ├── store/
│   │   │   └── useStore.ts   # Zustand state management
│   │   ├── App.tsx           # Root component
│   │   └── main.tsx          # Frontend entry point
│   ├── package.json
│   └── vite.config.ts        # Vite configuration
├── .env.example              # Environment template
├── package.json              # Backend dependencies
└── README.md
```

## 💾 Database Schema

The platform uses SQLite with Prisma ORM and includes 12 models for comprehensive data tracking:

- **KeywordAnalysis** - Historical keyword metrics (popularity, difficulty, competitors)
- **RankingHistory** - App ranking positions over time
- **App** - Cached app information
- **AIKeywordSuggestion** - AI-generated keyword suggestions
- **AICompetitorAnalysis** - Competitor gap analysis results
- **AIMetadataOptimization** - Optimized metadata generations
- **AIIntentAnalysis** - Keyword intent categorization
- **SearchHistory** - All API requests for analytics
- **SavedSearch** - User-saved searches and favorites
- **TranslationCache** - Translation results cache

All data is persisted automatically without affecting API response times (non-blocking saves).

## 🎨 Frontend Technology Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with custom warm orange theme
- **UI Components**: Custom components with shadcn/ui patterns
- **State Management**:
  - TanStack Query (React Query) for server state
  - Zustand for client state
- **Charts**: Recharts for data visualization
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React
- **Fonts**: Outfit (display), JetBrains Mono (code)
- **Theme**: Dark-first with warm orange/amber gradients

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

## 🔧 Extending the Platform

### Adding Apple Search Ads Integration

For official Apple Search Ads popularity data (5-100 scale), you can integrate the Apple Search Ads API:

1. Get Apple Search Ads API access
2. Create `src/services/appleSearchAds.service.js`
3. Implement OAuth token generation
4. Replace estimated popularity with official scores

See: https://developer.apple.com/documentation/apple_search_ads

### Customizing the Frontend Theme

The frontend uses a warm orange color palette. To customize:

1. Edit `frontend/src/index.css` - Update CSS variables
2. Edit `frontend/tailwind.config.js` - Modify theme colors
3. Update gradient classes in components

### Adding More Database Models

To extend the database schema:

```bash
# Edit prisma/schema.prisma
# Add your new models

# Create migration
npx prisma migrate dev --name your_migration_name

# Generate Prisma client
npx prisma generate
```

## Rate Limits

- Default: 100 requests per minute per IP
- Bulk endpoints: Count as multiple requests
- Cached responses don't count against limits

## License

![MIT](LICENSE)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## Support

For issues and feature requests, please open a GitHub issue.
