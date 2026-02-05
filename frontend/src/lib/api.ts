import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface KeywordAnalysisResponse {
  keyword: string;
  country: string;
  popularity: number;
  difficulty: number;
  competitorCount: number;
  topApps: any[];
  relatedTerms: string[];
  analyzedAt: string;
}

export const keywordApi = {
  analyze: (keyword: string, country = 'us') =>
    api.get<KeywordAnalysisResponse>('/keywords/analyze', { params: { keyword, country } }),

  getSuggestions: (keyword: string, country = 'us') =>
    api.get('/keywords/suggestions', { params: { keyword, country } }),

  getLongTail: (keyword: string, country = 'us') =>
    api.get('/keywords/long-tail', { params: { keyword, country } }),

  compareCountries: (keyword: string, countries: string[]) =>
    api.get('/keywords/compare-countries', { params: { keyword, countries: countries.join(',') } }),
};

export const aiApi = {
  suggestKeywords: (data: { description: string, category: string, targetAudience?: string, country?: string }) =>
    api.post('/ai/suggest-keywords', data),

  analyzeCompetitors: (data: { appId: string, competitorIds: string[], country?: string }) =>
    api.post('/ai/analyze-competitors', data),

  optimizeMetadata: (data: { description: string, currentTitle: string, currentSubtitle?: string, targetKeywords: string[], country?: string }) =>
    api.post('/ai/optimize-metadata', data),

  analyzeIntent: (keywords: string[]) =>
    api.post('/ai/analyze-intent', { keywords }),

  detailedCompare: (data: { myAppId: string, competitorId: string, country?: string }) =>
    api.post('/ai/detailed-compare', data),
};

export const appApi = {
  search: (term: string, country = 'us', limit = 25) =>
    api.get('/apps/search', { params: { term, country, limit } }),

  getDetail: (appId: string, country = 'us') =>
    api.get(`/apps/${appId}`, { params: { country } }),

  extractKeywords: (appId: string, country = 'us') =>
    api.get(`/apps/${appId}/keywords`, { params: { country } }),
};

export const historyApi = {
  trending: (country = 'us', hours = 24, limit = 20) =>
    api.get('/history/trending', { params: { country, hours, limit } }),

  aiGenerations: (limit = 20, type = 'keywords', days = 7) =>
    api.get('/history/ai-generations', { params: { type, days, limit } }),

  keywordHistory: (keyword: string, country = 'us', days = 30) =>
    api.get(`/history/keywords/${keyword}`, { params: { country, days } }),

  rankingHistory: (appId: string, keyword?: string, country = 'us', days = 30) =>
    api.get(`/history/rankings/${appId}`, { params: { keyword, country, days } }),
};

export const opportunityApi = {
  discover: (data: { category: string, targetAudience?: string, country?: string, filters?: any, referenceKeyword?: string }) =>
    api.post('/opportunities/discover', data),

  generateAppIdeas: (data: { keywords: string[], category: string, count?: number }) =>
    api.post('/opportunities/app-ideas', data),
};

export const trackedApi = {
  // Tracked Keywords
  getKeywords: (sessionId?: string) =>
    api.get('/tracked/keywords', { params: { sessionId } }),

  trackKeywords: (keywords: Array<{
    keyword: string;
    country?: string;
    popularity?: number;
    difficulty?: number;
    opportunityScore?: number;
    competitorCount?: number;
  }>, sessionId?: string) =>
    api.post('/tracked/keywords', { keywords, sessionId }),

  deleteKeyword: (id: string) =>
    api.delete(`/tracked/keywords/${id}`),

  // Saved App Ideas
  getAppIdeas: (sessionId?: string, category?: string) =>
    api.get('/tracked/app-ideas', { params: { sessionId, category } }),

  saveAppIdea: (idea: {
    name: string;
    elevatorPitch: string;
    description: string;
    targetKeywords: string[];
    uniqueSellingPoints: string[];
    keyFeatures: string[];
    targetAudience: string;
    estimatedDifficulty: 'Easy' | 'Moderate' | 'Hard';
    category: string;
    sessionId?: string;
    notes?: string;
  }) =>
    api.post('/tracked/app-ideas', idea),

  deleteAppIdea: (id: string) =>
    api.delete(`/tracked/app-ideas/${id}`),
};

export const jobsApi = {
  // Job Management
  list: (sessionId?: string) =>
    api.get('/jobs', { params: { sessionId } }),

  get: (jobId: string) =>
    api.get(`/jobs/${jobId}`),

  create: (data: {
    name: string;
    searchesPerBatch?: number;
    intervalMinutes?: number;
    totalCycles?: number;
    country?: string;
    strategy?: 'random' | 'category' | 'trending';
    seedCategory?: string;
    sessionId?: string;
    notes?: string;
  }) =>
    api.post('/jobs', data),

  start: (jobId: string) =>
    api.post(`/jobs/${jobId}/start`),

  stop: (jobId: string) =>
    api.post(`/jobs/${jobId}/stop`),

  delete: (jobId: string) =>
    api.delete(`/jobs/${jobId}`),

  // Add keywords from job to tracked
  trackKeywords: (jobId: string, resultIds: string[], sessionId?: string) =>
    api.post(`/jobs/${jobId}/track-keywords`, { resultIds, sessionId }),
};
