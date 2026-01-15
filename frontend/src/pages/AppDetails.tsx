import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star, Sparkles, UserPlus, Trash2, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useStore } from '../store/useStore';
import { appApi, aiApi } from '../lib/api';
import { formatNumber } from '../lib/utils';

export default function AppDetails() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shouldOptimize = searchParams.get('optimize') === 'true';

  const [app, setApp] = useState<any>(null);
  const [keywords, setKeywords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [keywordsLoading, setKeywordsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showOptimizer, setShowOptimizer] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedData, setOptimizedData] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { myApps, removeMyApp, trackedApps, addTrackedApp } = useStore();
  const isMyApp = myApps.some((a) => a.id === appId);
  const isTracked = trackedApps.some((a) => a.id === appId);

  useEffect(() => {
    if (!appId) return;

    const fetchAppDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await appApi.getDetail(appId);
        setApp(response.data);
      } catch (err: any) {
        console.error('Failed to fetch app details:', err);
        setError(err.response?.data?.error || 'Failed to load app details');
      } finally {
        setLoading(false);
      }
    };

    const fetchKeywords = async () => {
      setKeywordsLoading(true);
      try {
        const response = await appApi.extractKeywords(appId);
        setKeywords(response.data.keywords || []);
      } catch (err: any) {
        console.error('Failed to fetch keywords:', err);
        // Don't set error for keywords, just log it
      } finally {
        setKeywordsLoading(false);
      }
    };

    fetchAppDetails();
    fetchKeywords();
  }, [appId]);

  useEffect(() => {
    if (shouldOptimize && app && !showOptimizer) {
      handleOptimizeMetadata();
    }
  }, [shouldOptimize, app]);

  const handleOptimizeMetadata = async () => {
    if (!app) return;

    setShowOptimizer(true);
    setOptimizing(true);

    try {
      // Extract keywords from the keywords array
      let keywordsList = keywords.map(k => typeof k === 'string' ? k : k.keyword).filter(k => k && k.trim()).slice(0, 20);

      // If no keywords available, generate fallback keywords from app name and category
      if (keywordsList.length === 0) {
        const fallbackKeywords = [];

        // Add app name words as keywords
        if (app.trackName) {
          const nameWords = app.trackName.split(/\s+/).filter((w: string) => w.length > 2);
          fallbackKeywords.push(...nameWords);
        }

        // Add category
        if (app.primaryGenreName) {
          fallbackKeywords.push(app.primaryGenreName);
        }

        // Add developer name if short
        if (app.artistName && app.artistName.split(/\s+/).length <= 2) {
          fallbackKeywords.push(app.artistName);
        }

        // Use at least the app name as a keyword
        if (fallbackKeywords.length === 0) {
          fallbackKeywords.push(app.trackName || app.name || 'app');
        }

        keywordsList = fallbackKeywords.slice(0, 20);
      }

      const response = await aiApi.optimizeMetadata({
        description: app.description || `${app.trackName} by ${app.artistName}`,
        currentTitle: app.trackName || app.name,
        currentSubtitle: app.subtitle || undefined,
        targetKeywords: keywordsList,
        country: 'us',
      });

      setOptimizedData(response.data);
    } catch (err: any) {
      console.error('Optimization failed:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to optimize metadata. Please try again.';
      alert(errorMessage);
      setShowOptimizer(false);
    } finally {
      setOptimizing(false);
    }
  };

  const handleRemoveFromMyApps = () => {
    if (!appId || !app) return;
    if (confirm(`Remove "${app.trackName}" from My Apps?`)) {
      removeMyApp(appId);
      navigate('/apps');
    }
  };

  const handleAddToTracked = () => {
    if (!app) return;
    addTrackedApp({
      id: String(app.trackId || app.id),
      name: app.trackName || app.name,
      icon: app.artworkUrl512 || app.artworkUrl100,
      developer: app.artistName,
    });
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading app details...</p>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-bold mb-2 text-destructive">Failed to Load App</h2>
              <p className="text-muted-foreground mb-6">{error || 'App not found'}</p>
              <Button onClick={() => navigate('/apps')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Apps
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="bg-gradient-dark border-b border-gray-800/50 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/apps')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Apps
          </Button>

          <div className="flex items-start gap-6">
            <div
              className="size-28 rounded-2xl bg-cover bg-center border-2 border-border flex-shrink-0 shadow-lg"
              style={{
                backgroundImage: app.artworkUrl512 ? `url("${app.artworkUrl512}")` : 'none',
                backgroundColor: '#f4eee7',
              }}
            />
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{app.trackName || app.name}</h1>
              <p className="text-xl text-muted-foreground mb-4">{app.artistName}</p>

              <div className="flex flex-wrap items-center gap-4">
                {app.averageUserRating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-primary">
                      <Star className="h-5 w-5 fill-current" />
                      <span className="font-bold text-lg">{app.averageUserRating.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({formatNumber(app.userRatingCount || 0)} ratings)
                    </span>
                  </div>
                )}
                {app.primaryGenreName && (
                  <Badge className="text-sm">{app.primaryGenreName}</Badge>
                )}
                {app.contentAdvisoryRating && (
                  <Badge variant="outline" className="text-sm">{app.contentAdvisoryRating}</Badge>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {!showOptimizer && (
                <Button onClick={handleOptimizeMetadata} disabled={optimizing}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {optimizing ? 'Optimizing...' : 'Optimize Metadata'}
                </Button>
              )}
              {!isTracked && (
                <Button variant="outline" onClick={handleAddToTracked}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add to Tracked
                </Button>
              )}
              {isMyApp && (
                <Button variant="outline" onClick={handleRemoveFromMyApps} className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Optimizer Panel */}
          {showOptimizer && (
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-orange-500/5">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-6 w-6 mr-2 text-primary" />
                  AI-Optimized Metadata
                </CardTitle>
                <CardDescription>
                  AI-generated suggestions to improve your app's visibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {optimizing ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Analyzing and generating optimizations...</p>
                  </div>
                ) : optimizedData ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Current Metadata */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg">Current Metadata</h3>

                      <div className="space-y-3">
                        <div className="p-4 rounded-lg bg-card border">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-muted-foreground">Title</p>
                            <Badge variant="outline">{(app.trackName || '').length}/30</Badge>
                          </div>
                          <p className="text-sm">{app.trackName}</p>
                        </div>

                        {app.subtitle && (
                          <div className="p-4 rounded-lg bg-card border">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-semibold text-muted-foreground">Subtitle</p>
                              <Badge variant="outline">{app.subtitle.length}/30</Badge>
                            </div>
                            <p className="text-sm">{app.subtitle}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Optimized Metadata */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg text-primary">AI-Optimized Suggestions</h3>

                      <div className="space-y-3">
                        {optimizedData.title && (
                          <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-semibold text-primary">Optimized Title</p>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-primary/20 text-primary border-primary/40">
                                  {optimizedData.titleCharCount || optimizedData.title.length}/30
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCopy(optimizedData.title, 'title')}
                                  className="h-7 px-2"
                                >
                                  {copiedField === 'title' ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm font-medium">{optimizedData.title}</p>
                          </div>
                        )}

                        {optimizedData.subtitle && (
                          <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-semibold text-primary">Optimized Subtitle</p>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-primary/20 text-primary border-primary/40">
                                  {optimizedData.subtitleCharCount || optimizedData.subtitle.length}/30
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCopy(optimizedData.subtitle, 'subtitle')}
                                  className="h-7 px-2"
                                >
                                  {copiedField === 'subtitle' ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm font-medium">{optimizedData.subtitle}</p>
                          </div>
                        )}

                        {optimizedData.keywords && (
                          <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm font-semibold text-primary">Strategic Keywords</p>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-primary/20 text-primary border-primary/40">
                                  {optimizedData.keywordsCharCount || optimizedData.keywords.length}/100
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCopy(optimizedData.keywords, 'keywords')}
                                  className="h-7 px-2"
                                >
                                  {copiedField === 'keywords' ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {optimizedData.keywords.split(',').map((kw: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {kw.trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {optimizedData.reasoning && (
                          <div className="p-4 rounded-lg bg-muted/50 border">
                            <p className="text-sm font-semibold mb-2">AI Reasoning</p>
                            <p className="text-sm text-muted-foreground">{optimizedData.reasoning}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* App Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Description */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {app.description || 'No description available'}
                </p>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {app.version && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Version</span>
                    <span className="font-semibold">{app.version}</span>
                  </div>
                )}
                {app.fileSizeBytes && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-semibold">
                      {(app.fileSizeBytes / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                )}
                {app.price !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-semibold">
                      {app.price === 0 ? 'Free' : `$${app.price}`}
                    </span>
                  </div>
                )}
                {app.releaseDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Released</span>
                    <span className="font-semibold">
                      {new Date(app.releaseDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {app.currentVersionReleaseDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="font-semibold">
                      {new Date(app.currentVersionReleaseDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Extracted Keywords</span>
                {keywordsLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                ) : (
                  <Badge>{keywords.length} keywords</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Keywords extracted from the app's metadata and description
              </CardDescription>
            </CardHeader>
            <CardContent>
              {keywordsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Extracting keywords...</p>
                </div>
              ) : keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => {
                    const kw = typeof keyword === 'string' ? keyword : keyword.keyword;
                    const freq = typeof keyword === 'object' ? keyword.frequency : undefined;
                    return (
                      <Badge key={index} variant="outline" className="text-sm">
                        {kw}
                        {freq && <span className="ml-1 text-xs opacity-60">({freq})</span>}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No keywords extracted. Try optimizing metadata to get AI-suggested keywords.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
