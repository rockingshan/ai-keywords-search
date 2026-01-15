-- CreateTable
CREATE TABLE "KeywordAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'us',
    "popularity" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "competitorCount" INTEGER NOT NULL,
    "topApps" TEXT NOT NULL,
    "relatedTerms" TEXT NOT NULL,
    "analyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT
);

-- CreateTable
CREATE TABLE "RankingHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appId" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'us',
    "rank" INTEGER,
    "isRanking" BOOLEAN NOT NULL DEFAULT false,
    "totalResults" INTEGER NOT NULL,
    "topCompetitors" TEXT NOT NULL,
    "trackedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RankingHistory_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "App" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bundleId" TEXT,
    "name" TEXT NOT NULL,
    "developer" TEXT,
    "developerId" TEXT,
    "icon" TEXT,
    "category" TEXT,
    "rating" REAL,
    "ratingCount" INTEGER,
    "price" REAL,
    "currency" TEXT,
    "description" TEXT,
    "releaseDate" TEXT,
    "lastUpdated" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AIKeywordSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appDescription" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetAudience" TEXT,
    "country" TEXT NOT NULL DEFAULT 'us',
    "suggestions" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'gemini-2.0-flash-exp',
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT
);

-- CreateTable
CREATE TABLE "AICompetitorAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mainAppId" TEXT NOT NULL,
    "competitorIds" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'us',
    "missingKeywords" TEXT NOT NULL,
    "keywordGaps" TEXT NOT NULL,
    "keywordsToAvoid" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "analyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    CONSTRAINT "AICompetitorAnalysis_mainAppId_fkey" FOREIGN KEY ("mainAppId") REFERENCES "App" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIMetadataOptimization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appDescription" TEXT NOT NULL,
    "currentTitle" TEXT NOT NULL,
    "currentSubtitle" TEXT,
    "targetKeywords" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'us',
    "optimizedTitle" TEXT NOT NULL,
    "titleCharCount" INTEGER NOT NULL,
    "optimizedSubtitle" TEXT NOT NULL,
    "subtitleCharCount" INTEGER NOT NULL,
    "keywordField" TEXT NOT NULL,
    "keywordCharCount" INTEGER NOT NULL,
    "reasoning" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT
);

-- CreateTable
CREATE TABLE "AIIntentAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keywords" TEXT NOT NULL,
    "analysis" TEXT NOT NULL,
    "analyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "body" TEXT,
    "statusCode" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "response" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChecked" DATETIME,
    "alertEnabled" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "TranslationCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalText" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "sourceLang" TEXT NOT NULL,
    "targetLang" TEXT NOT NULL,
    "translatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "service" TEXT NOT NULL DEFAULT 'deepl'
);

-- CreateIndex
CREATE INDEX "KeywordAnalysis_keyword_country_idx" ON "KeywordAnalysis"("keyword", "country");

-- CreateIndex
CREATE INDEX "KeywordAnalysis_analyzedAt_idx" ON "KeywordAnalysis"("analyzedAt");

-- CreateIndex
CREATE INDEX "KeywordAnalysis_sessionId_idx" ON "KeywordAnalysis"("sessionId");

-- CreateIndex
CREATE INDEX "RankingHistory_appId_keyword_country_idx" ON "RankingHistory"("appId", "keyword", "country");

-- CreateIndex
CREATE INDEX "RankingHistory_trackedAt_idx" ON "RankingHistory"("trackedAt");

-- CreateIndex
CREATE INDEX "App_name_idx" ON "App"("name");

-- CreateIndex
CREATE INDEX "App_category_idx" ON "App"("category");

-- CreateIndex
CREATE INDEX "AIKeywordSuggestion_generatedAt_idx" ON "AIKeywordSuggestion"("generatedAt");

-- CreateIndex
CREATE INDEX "AIKeywordSuggestion_sessionId_idx" ON "AIKeywordSuggestion"("sessionId");

-- CreateIndex
CREATE INDEX "AIKeywordSuggestion_category_idx" ON "AIKeywordSuggestion"("category");

-- CreateIndex
CREATE INDEX "AICompetitorAnalysis_mainAppId_idx" ON "AICompetitorAnalysis"("mainAppId");

-- CreateIndex
CREATE INDEX "AICompetitorAnalysis_analyzedAt_idx" ON "AICompetitorAnalysis"("analyzedAt");

-- CreateIndex
CREATE INDEX "AIMetadataOptimization_generatedAt_idx" ON "AIMetadataOptimization"("generatedAt");

-- CreateIndex
CREATE INDEX "AIMetadataOptimization_sessionId_idx" ON "AIMetadataOptimization"("sessionId");

-- CreateIndex
CREATE INDEX "AIIntentAnalysis_analyzedAt_idx" ON "AIIntentAnalysis"("analyzedAt");

-- CreateIndex
CREATE INDEX "AIIntentAnalysis_sessionId_idx" ON "AIIntentAnalysis"("sessionId");

-- CreateIndex
CREATE INDEX "SearchHistory_endpoint_idx" ON "SearchHistory"("endpoint");

-- CreateIndex
CREATE INDEX "SearchHistory_timestamp_idx" ON "SearchHistory"("timestamp");

-- CreateIndex
CREATE INDEX "SearchHistory_sessionId_idx" ON "SearchHistory"("sessionId");

-- CreateIndex
CREATE INDEX "SearchHistory_ipAddress_idx" ON "SearchHistory"("ipAddress");

-- CreateIndex
CREATE INDEX "SavedSearch_userId_idx" ON "SavedSearch"("userId");

-- CreateIndex
CREATE INDEX "SavedSearch_type_idx" ON "SavedSearch"("type");

-- CreateIndex
CREATE INDEX "TranslationCache_targetLang_idx" ON "TranslationCache"("targetLang");

-- CreateIndex
CREATE UNIQUE INDEX "TranslationCache_originalText_sourceLang_targetLang_key" ON "TranslationCache"("originalText", "sourceLang", "targetLang");
