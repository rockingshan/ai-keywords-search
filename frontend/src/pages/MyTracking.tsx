import { useEffect, useState } from 'react';
import { trackedApi } from '../lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Trash2, TrendingUp, Lightbulb, Search, RefreshCw } from 'lucide-react';

// Get session ID from localStorage (same as KeywordJobs)
const getSessionId = () => {
  let sessionId = localStorage.getItem('aso-session-id');
  if (!sessionId) {
    sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('aso-session-id', sessionId);
  }
  return sessionId;
};

interface TrackedKeyword {
  id: string;
  keyword: string;
  country: string;
  popularity?: number;
  difficulty?: number;
  opportunityScore?: number;
  competitorCount?: number;
  trackedAt: string;
}

interface SavedAppIdea {
  id: string;
  name: string;
  elevatorPitch: string;
  description: string;
  targetKeywords: string[];
  uniqueSellingPoints: string[];
  keyFeatures: string[];
  targetAudience: string;
  estimatedDifficulty: string;
  category: string;
  savedAt: string;
}

export function MyTracking() {
  const [keywords, setKeywords] = useState<TrackedKeyword[]>([]);
  const [appIdeas, setAppIdeas] = useState<SavedAppIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState<string>(getSessionId());
  const [showMigrationBanner, setShowMigrationBanner] = useState(false);
  const [migrationData, setMigrationData] = useState<{ keywordCount: number; ideaCount: number }>({ keywordCount: 0, ideaCount: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Fetching tracked keywords with sessionId:', sessionId);

      // Fetch from BOTH current sessionId AND 'default' to merge old data
      const [currentSession, defaultSession, currentIdeas, defaultIdeas] = await Promise.all([
        trackedApi.getKeywords(sessionId).catch(() => ({ data: { keywords: [] } })),
        trackedApi.getKeywords('default').catch(() => ({ data: { keywords: [] } })),
        trackedApi.getAppIdeas(sessionId).catch(() => ({ data: { ideas: [] } })),
        trackedApi.getAppIdeas('default').catch(() => ({ data: { ideas: [] } })),
      ]);

      // Merge keywords from both sessions (deduplicate by keyword+country)
      const keywordMap = new Map<string, TrackedKeyword>();

      // Add from current session first (priority)
      currentSession.data.keywords.forEach((kw: TrackedKeyword) => {
        const key = `${kw.keyword}-${kw.country}`;
        keywordMap.set(key, kw);
      });

      // Add from default session if not already present
      defaultSession.data.keywords.forEach((kw: TrackedKeyword) => {
        const key = `${kw.keyword}-${kw.country}`;
        if (!keywordMap.has(key)) {
          keywordMap.set(key, kw);
        }
      });

      const mergedKeywords = Array.from(keywordMap.values());

      // Merge app ideas (deduplicate by id)
      const ideaMap = new Map<string, SavedAppIdea>();
      currentIdeas.data.ideas.forEach((idea: SavedAppIdea) => ideaMap.set(idea.id, idea));
      defaultIdeas.data.ideas.forEach((idea: SavedAppIdea) => {
        if (!ideaMap.has(idea.id)) ideaMap.set(idea.id, idea);
      });

      const mergedIdeas = Array.from(ideaMap.values());

      console.log(`Merged data: ${mergedKeywords.length} keywords, ${mergedIdeas.length} ideas`);
      console.log(`  - From session '${sessionId}': ${currentSession.data.keywords.length} keywords, ${currentIdeas.data.ideas.length} ideas`);
      console.log(`  - From session 'default': ${defaultSession.data.keywords.length} keywords, ${defaultIdeas.data.ideas.length} ideas`);

      // Show migration banner if there's data in default session
      const hasDefaultData = defaultSession.data.keywords.length > 0 || defaultIdeas.data.ideas.length > 0;
      if (hasDefaultData && sessionId !== 'default') {
        setShowMigrationBanner(true);
        setMigrationData({
          keywordCount: defaultSession.data.keywords.length,
          ideaCount: defaultIdeas.data.ideas.length,
        });
      }

      setKeywords(mergedKeywords);
      setAppIdeas(mergedIdeas);
    } catch (error) {
      console.error('Failed to load tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteKeyword = async (id: string) => {
    if (!confirm('Remove this keyword from tracking?')) return;
    try {
      await trackedApi.deleteKeyword(id);
      setKeywords(keywords.filter(kw => kw.id !== id));
    } catch (error) {
      console.error('Failed to delete keyword:', error);
      alert('Failed to remove keyword');
    }
  };

  const deleteAppIdea = async (id: string) => {
    if (!confirm('Delete this app idea?')) return;
    try {
      await trackedApi.deleteAppIdea(id);
      setAppIdeas(appIdeas.filter(idea => idea.id !== id));
    } catch (error) {
      console.error('Failed to delete app idea:', error);
      alert('Failed to delete app idea');
    }
  };

  const handleMigrateData = async () => {
    if (!confirm(`Migrate ${migrationData.keywordCount} keywords and ${migrationData.ideaCount} app ideas to your current session?\n\nThis will re-save them under your current session.`)) {
      return;
    }

    setLoading(true);
    try {
      // Fetch data from default session
      const [defaultKeywords, defaultIdeas] = await Promise.all([
        trackedApi.getKeywords('default'),
        trackedApi.getAppIdeas('default'),
      ]);

      // Re-track keywords under current session
      if (defaultKeywords.data.keywords.length > 0) {
        const keywordsToMigrate = defaultKeywords.data.keywords.map((kw: TrackedKeyword) => ({
          keyword: kw.keyword,
          country: kw.country,
          popularity: kw.popularity,
          difficulty: kw.difficulty,
          opportunityScore: kw.opportunityScore,
          competitorCount: kw.competitorCount,
        }));

        await trackedApi.trackKeywords(keywordsToMigrate, sessionId);
      }

      // Re-save app ideas under current session
      for (const idea of defaultIdeas.data.ideas) {
        await trackedApi.saveAppIdea({
          ...idea,
          sessionId,
        });
      }

      alert(`✅ Successfully migrated ${defaultKeywords.data.keywords.length} keywords and ${defaultIdeas.data.ideas.length} app ideas!`);
      setShowMigrationBanner(false);
      loadData(); // Refresh
    } catch (error) {
      console.error('Migration error:', error);
      alert('❌ Failed to migrate data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty?: number) => {
    if (!difficulty) return 'text-gray-500';
    if (difficulty <= 30) return 'text-green-500';
    if (difficulty <= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading your tracked items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Tracking</h1>
            <p className="text-muted-foreground">
              Your tracked keywords and saved app ideas
            </p>
          </div>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Migration Banner */}
        {showMigrationBanner && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-500 mb-1">
                    Legacy Data Detected
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    We found {migrationData.keywordCount} keywords and {migrationData.ideaCount} app ideas from your previous tracking.
                    Migrate them to your current session to keep everything organized.
                  </p>
                  <Button onClick={handleMigrateData} size="sm" variant="outline" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/20">
                    Migrate Data
                  </Button>
                </div>
                <Button onClick={() => setShowMigrationBanner(false)} variant="ghost" size="sm">
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Search className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{keywords.length}</p>
                  <p className="text-sm text-muted-foreground">Tracked Keywords</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <Lightbulb className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{appIdeas.length}</p>
                  <p className="text-sm text-muted-foreground">Saved App Ideas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {keywords.filter(kw => (kw.opportunityScore || 0) >= 5.0).length}
                  </p>
                  <p className="text-sm text-muted-foreground">High Opportunity (≥5.0)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tracked Keywords Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Tracked Keywords</h2>
          {keywords.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No tracked keywords yet. Start tracking from Keyword Research or Opportunity Finder!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {keywords.map((kw) => (
                <Card key={kw.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{kw.keyword}</h3>
                          <Badge variant="outline">{kw.country.toUpperCase()}</Badge>
                          {kw.opportunityScore !== undefined && kw.opportunityScore !== null && (
                            <Badge
                              className={
                                kw.opportunityScore >= 5.0
                                  ? 'bg-green-500/20 text-green-600 border-green-500/30'
                                  : kw.opportunityScore >= 2.0
                                  ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
                                  : 'bg-red-500/20 text-red-600 border-red-500/30'
                              }
                            >
                              Score: {typeof kw.opportunityScore === 'number' ? kw.opportunityScore.toFixed(1) : kw.opportunityScore}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-6 text-sm text-muted-foreground">
                          {kw.popularity !== undefined && kw.popularity !== null && (
                            <span>Popularity: {kw.popularity}/100</span>
                          )}
                          {kw.difficulty !== undefined && kw.difficulty !== null && (
                            <span className={getDifficultyColor(kw.difficulty)}>
                              Difficulty: {kw.difficulty}/100
                            </span>
                          )}
                          {kw.competitorCount !== undefined && kw.competitorCount !== null && (
                            <span>Competitors: {kw.competitorCount}</span>
                          )}
                          <span>Added: {new Date(kw.trackedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteKeyword(kw.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Saved App Ideas Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Saved App Ideas</h2>
          {appIdeas.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No saved app ideas yet. Generate and save ideas from Opportunity Finder!
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {appIdeas.map((idea) => (
                <Card key={idea.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{idea.name}</CardTitle>
                        <CardDescription className="text-sm mb-3">
                          {idea.elevatorPitch}
                        </CardDescription>
                        <div className="flex gap-2 mb-3">
                          <Badge variant="outline">{idea.category}</Badge>
                          <Badge
                            className={
                              idea.estimatedDifficulty === 'Easy' ? 'bg-green-500' :
                              idea.estimatedDifficulty === 'Moderate' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }
                          >
                            {idea.estimatedDifficulty}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAppIdea(idea.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <p className="text-sm text-muted-foreground">{idea.description}</p>

                      <div>
                        <p className="font-semibold mb-1">Target Keywords:</p>
                        <div className="flex flex-wrap gap-1">
                          {idea.targetKeywords.map((kw, i) => (
                            <Badge key={i} variant="secondary">{kw}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="font-semibold mb-1">Unique Selling Points:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {idea.uniqueSellingPoints.map((usp, i) => (
                            <li key={i}>{usp}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold mb-1">Key Features:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {idea.keyFeatures.slice(0, 3).map((feature, i) => (
                            <li key={i}>{feature}</li>
                          ))}
                          {idea.keyFeatures.length > 3 && (
                            <li className="text-xs italic">+ {idea.keyFeatures.length - 3} more</li>
                          )}
                        </ul>
                      </div>

                      <div className="pt-2 border-t text-xs text-muted-foreground">
                        <p>Target: {idea.targetAudience}</p>
                        <p>Saved: {new Date(idea.savedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
