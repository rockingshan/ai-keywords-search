# Keyword Search Jobs - Feature Guide

## Overview

The Keyword Search Jobs feature allows you to create automated, continuous keyword discovery jobs that run in the background. This is perfect for finding profitable app ideas by discovering high-opportunity keywords across various categories.

## Key Features

- **Automated Keyword Discovery**: Jobs run continuously in the background, searching for keywords at configurable intervals
- **Rate Limit Management**: Built-in delays between searches to avoid API rate limiting
- **Multiple Strategies**: Choose from Random, Category-specific, or Trending keyword generation
- **Unique Keywords**: Tracks all searched keywords to ensure no duplicates
- **Opportunity Scoring**: Automatically calculates opportunity scores (popularity/difficulty ratio)
- **Results Tracking**: Save promising keywords to your tracked keywords list
- **Job Resumption**: Jobs automatically resume if server restarts

## How It Works

### 1. Create a Job

Navigate to `/jobs` in the frontend and click "New Job". Configure:

- **Job Name**: Give your job a descriptive name
- **Strategy**:
  - **Random**: Generates keywords from diverse categories for maximum variety
  - **Category**: Focuses on a specific category (e.g., "Health & Fitness")
  - **Trending**: Mix of popular categories (Health, Productivity, Finance, Education, Entertainment)
- **Searches per Batch**: How many keywords to search in each cycle (1-10)
- **Interval**: Minutes between each search cycle (minimum 1 minute)
- **Total Cycles**: How many cycles the job should run (1-1000)
- **Country**: Target App Store country (US, UK, Germany, France, Japan, India)

### 2. Start the Job

Click the play button to start the job. The job will:

1. Generate unique random keywords using AI
2. Analyze each keyword for:
   - Popularity (5-100 scale)
   - Difficulty (0-100 scale)
   - Competitor Count
   - Opportunity Score (calculated as popularity/difficulty * 10)
3. Save results to the database
4. Wait for the configured interval
5. Repeat for the specified number of cycles

### 3. Monitor Progress

While running, you can see:

- Current cycle / Total cycles
- Total keywords found
- Progress bar
- Last run timestamp

### 4. View Results

Once a job completes (or while it's running), click the chart icon to view:

- All searched keywords
- Metrics for each keyword
- Opportunity scores (color-coded: green = high, yellow = medium, gray = low)
- Success/error status for each search

### 5. Track Keywords

From the results view:

- Select one or multiple keywords
- Click "Add to Tracked" to save them to your tracked keywords list
- Tracked keywords are marked with a green badge

## API Endpoints

### Create Job
```http
POST /api/jobs
Content-Type: application/json

{
  "name": "Fitness Keywords Discovery",
  "searchesPerBatch": 1,
  "intervalMinutes": 15,
  "totalCycles": 10,
  "country": "us",
  "strategy": "random",
  "seedCategory": "Health & Fitness",
  "sessionId": "optional-session-id",
  "notes": "Optional notes"
}
```

### List Jobs
```http
GET /api/jobs?sessionId=your-session-id
```

### Get Job Details
```http
GET /api/jobs/:jobId
```

### Start Job
```http
POST /api/jobs/:jobId/start
```

### Stop Job
```http
POST /api/jobs/:jobId/stop
```

### Delete Job
```http
DELETE /api/jobs/:jobId
```

### Track Keywords
```http
POST /api/jobs/:jobId/track-keywords
Content-Type: application/json

{
  "resultIds": ["result-id-1", "result-id-2"],
  "sessionId": "your-session-id"
}
```

## Database Schema

### KeywordSearchJob

```prisma
model KeywordSearchJob {
  id               String   @id @default(cuid())
  name             String
  searchesPerBatch Int
  intervalMinutes  Int
  totalCycles      Int
  country          String   @default("us")
  status           String   @default("pending")
  currentCycle     Int      @default(0)
  totalKeywords    Int      @default(0)
  strategy         String   @default("random")
  seedCategory     String?
  usedKeywords     String   @default("[]")
  createdAt        DateTime @default(now())
  startedAt        DateTime?
  completedAt      DateTime?
  lastRunAt        DateTime?
  sessionId        String?
  notes            String?
  results          KeywordSearchResult[]
}
```

### KeywordSearchResult

```prisma
model KeywordSearchResult {
  id               String   @id @default(cuid())
  jobId            String
  keyword          String
  cycleNumber      Int
  popularity       Int?
  difficulty       Int?
  competitorCount  Int?
  opportunityScore Float?
  topApps          String?
  relatedTerms     String?
  status           String   @default("success")
  errorMessage     String?
  searchedAt       DateTime @default(now())
  isTracked        Boolean  @default(false)
  job              KeywordSearchJob @relation(fields: [jobId], references: [id], onDelete: Cascade)
}
```

## Rate Limiting Strategy

To avoid API rate limits:

1. **Between Keywords in Same Cycle**: 2-second delay
2. **Between Cycles**: Configurable interval (default 15 minutes)
3. **Between AI Calls**: 1-second delay
4. **Recommended Settings**:
   - 1 search per batch with 15-minute intervals = 96 searches/day
   - 2 searches per batch with 30-minute intervals = 96 searches/day
   - 1 search per batch with 1-minute intervals = 1,440 searches/day (more aggressive)

## Keyword Generation Strategy

### Random Strategy
- Selects random categories from 40+ app categories
- Generates diverse keywords across different niches
- Filters out duplicates
- Best for discovering unexpected opportunities

### Category Strategy
- Focuses on a single category
- Generates multiple variations of keywords
- Uses previous keywords as reference for more variations
- Best for deep-diving into a specific niche

### Trending Strategy
- Balanced across 5 trending categories
- Ensures variety while focusing on popular areas
- Best for finding opportunities in hot markets

## Keyword Diversity Features

1. **No Duplicates**: Tracks all used keywords per job
2. **Multiple AI Calls**: Makes multiple AI requests per cycle if needed
3. **Smart Filtering**: Removes duplicates and empty keywords
4. **Fallback Mechanism**: If one category fails, continues with others
5. **Reference Keywords**: Uses generated keywords to inspire variations

## Job State Management

### Job Statuses
- `pending`: Job created but not started
- `running`: Job is actively searching
- `paused`: Job was stopped by user
- `completed`: Job finished all cycles
- `failed`: Job encountered critical error

### Automatic Resumption
- Jobs marked as "running" when server stops are automatically resumed on startup
- Jobs that already completed all cycles are marked as "completed"
- Progress is preserved (current cycle, used keywords)

## Frontend Components

### KeywordJobs.tsx
Main page component with:
- Job creation form
- Job list with status badges
- Real-time progress tracking
- Job detail modal

### JobDetailModal
Shows:
- All search results in a table
- Popularity and difficulty visualizations
- Opportunity score highlighting
- Bulk selection and tracking

## Best Practices

1. **Start Small**: Begin with 10 cycles to test the strategy
2. **Monitor First Job**: Watch the first few cycles to ensure quality keywords
3. **Adjust Intervals**: Use longer intervals (15-30 min) to be safe with API limits
4. **Review Results**: Regularly check job results and track promising keywords
5. **Strategy Selection**:
   - Use "Random" for broad discovery
   - Use "Category" when you have a specific niche
   - Use "Trending" for balanced popular niches

## Troubleshooting

### Job Not Starting
- Check server logs for errors
- Ensure Gemini API key is configured
- Verify database connection

### No Keywords Generated
- Check AI service logs
- Verify Gemini API quota
- Try different strategy

### Rate Limiting Errors
- Increase interval between cycles
- Reduce searches per batch
- Check external API limits (iTunes, Gemini)

### Job Stuck in Running State
- Stop and restart the job
- Check server logs for errors
- Use DELETE to remove and create new job

## Example Workflow

1. **Create a Discovery Job**
   ```
   Name: "Find Fitness App Ideas"
   Strategy: Random
   Searches/Batch: 1
   Interval: 15 minutes
   Total Cycles: 20
   ```

2. **Let it Run Overnight**
   - 20 cycles × 15 minutes = 5 hours
   - 20 unique keywords analyzed

3. **Review Results Next Day**
   - Sort by opportunity score
   - Look for keywords with:
     - Popularity > 30
     - Difficulty < 50
     - Opportunity Score > 5.0

4. **Track Promising Keywords**
   - Select 5-10 best keywords
   - Click "Add to Tracked"

5. **Analyze Further**
   - Use tracked keywords in other tools
   - Generate app ideas from high-opportunity keywords
   - Research competitors for selected keywords

## Future Enhancements

Potential improvements:
- Email notifications when jobs complete
- Pause/resume functionality
- Export results to CSV
- Scheduling (start at specific time)
- Smart retry on errors
- Keyword quality filters
- Category learning (prioritize successful categories)
- Collaborative filtering (learn from user's tracked keywords)
